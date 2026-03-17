import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "DELIVERY_BOY") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { paymentStatus, items } = await req.json(); // items: { productId, returnedQuantity }[]

    if (!["DUE", "PAID"].includes(paymentStatus)) {
      return NextResponse.json({ error: "Invalid payment status" }, { status: 400 });
    }

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: "Invalid items data" }, { status: 400 });
    }

    // Get delivery boy's assigned delivery code
    const deliveryBoy = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { deliveryCodeId: true },
    });

    if (!deliveryBoy?.deliveryCodeId) {
      return NextResponse.json(
        { error: "You are not assigned to any delivery code" },
        { status: 403 }
      );
    }

    // Fetch order with items
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: true } } },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.deliveryCodeId !== deliveryBoy.deliveryCodeId) {
      return NextResponse.json(
        { error: "This order is not assigned to you" },
        { status: 403 }
      );
    }

    if (order.status !== "SHIPPED") {
      return NextResponse.json(
        { error: "Only SHIPPED orders can be delivered" },
        { status: 400 }
      );
    }

    // Validate items: all productIds belong to this order and returned quantities are valid
    const itemMap = new Map(order.items.map(i => [i.productId, i]));
    for (const reqItem of items) {
      const existing = itemMap.get(reqItem.productId);
      if (!existing) {
        return NextResponse.json(
          { error: `Product ${reqItem.productId} is not part of this order` },
          { status: 400 }
        );
      }
      const maxReturnable = existing.quantity - existing.returnedQuantity;
      if (reqItem.returnedQuantity < 0 || reqItem.returnedQuantity > maxReturnable) {
        return NextResponse.json(
          { error: `Invalid returned quantity for product ${existing.product.name}` },
          { status: 400 }
        );
      }
    }

    // Perform updates in transaction: update order status, payment, and process returns
    await prisma.$transaction(async (tx) => {
      // Update order status and payment
      await tx.order.update({
        where: { id },
        data: {
          status: "DELIVERED",
          paymentStatus,
        },
      });

      // Process returns
      for (const reqItem of items) {
        if (reqItem.returnedQuantity > 0) {
          const existing = itemMap.get(reqItem.productId)!;
          await tx.orderItem.update({
            where: { id: existing.id },
            data: {
              returnedQuantity: { increment: reqItem.returnedQuantity },
            },
          });
          await tx.stock.update({
            where: { productId: reqItem.productId },
            data: { quantity: { increment: reqItem.returnedQuantity } },
          });
        }
      }
    });

    return NextResponse.json({ message: "Order delivered with returns" });
  } catch (error) {
    console.error("Error delivering with return:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}