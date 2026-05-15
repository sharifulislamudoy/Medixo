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
    const { items } = await req.json(); // items: { productId, missingQuantity }[]

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
        { error: "Only SHIPPED orders can record missing items" },
        { status: 400 }
      );
    }

    // Validate items
    const itemMap = new Map(order.items.map(i => [i.productId, i]));
    for (const reqItem of items) {
      const existing = itemMap.get(reqItem.productId);
      if (!existing) {
        return NextResponse.json(
          { error: `Product ${reqItem.productId} is not part of this order` },
          { status: 400 }
        );
      }
      const maxMissing = existing.quantity - existing.returnedQuantity - existing.missingQuantity;
      if (reqItem.missingQuantity < 0 || reqItem.missingQuantity > maxMissing) {
        return NextResponse.json(
          { error: `Invalid missing quantity for product ${existing.product.name}` },
          { status: 400 }
        );
      }
    }

    // Perform updates in transaction
    await prisma.$transaction(async (tx) => {
      for (const reqItem of items) {
        if (reqItem.missingQuantity > 0) {
          const existing = itemMap.get(reqItem.productId)!;
          // Update missing quantity on the order item
          await tx.orderItem.update({
            where: { id: existing.id },
            data: {
              missingQuantity: { increment: reqItem.missingQuantity },
            },
          });
          // Return the missing quantity to stock (since it wasn't actually shipped)
          await tx.stock.update({
            where: { productId: reqItem.productId },
            data: { quantity: { increment: reqItem.missingQuantity } },
          });
        }
      }
      // NOTE: Order status remains SHIPPED – delivery boy will deliver later
    });

    return NextResponse.json({ message: "Missing items recorded" });
  } catch (error) {
    console.error("Error recording missing items:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}