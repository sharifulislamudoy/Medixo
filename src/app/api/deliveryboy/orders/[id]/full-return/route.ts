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
      include: { items: true },
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
        { error: "Only SHIPPED orders can be fully returned" },
        { status: 400 }
      );
    }

    // Check if any items have already been partially returned
    // If yes, we can still do a full return by returning the remaining quantities.
    // We'll set returnedQuantity = quantity for each item.

    await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        const alreadyReturned = item.returnedQuantity;
        const toReturn = item.quantity - alreadyReturned;
        if (toReturn > 0) {
          await tx.orderItem.update({
            where: { id: item.id },
            data: {
              returnedQuantity: { increment: toReturn },
            },
          });
          await tx.stock.update({
            where: { productId: item.productId },
            data: { quantity: { increment: toReturn } },
          });
        }
      }

      // Update order status to RETURNED
      await tx.order.update({
        where: { id },
        data: { status: "RETURNED" },
      });
    });

    return NextResponse.json({ message: "Order fully returned" });
  } catch (error) {
    console.error("Error in full return:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}