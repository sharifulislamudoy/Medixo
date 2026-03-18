import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfToday, endOfToday } from "date-fns";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "DELIVERY_BOY") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get delivery boy's assigned delivery code
    const deliveryBoy = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { deliveryCodeId: true },
    });

    if (!deliveryBoy?.deliveryCodeId) {
      // No delivery code assigned – return zeros
      return NextResponse.json({
        assignedTotal: 0,
        collectedTotal: 0,
        returnedTotal: 0,
        returnedItems: [],
      });
    }

    const todayStart = startOfToday();
    const todayEnd = endOfToday();

    // Fetch all orders assigned to this delivery boy that were updated today
    const orders = await prisma.order.findMany({
      where: {
        deliveryCodeId: deliveryBoy.deliveryCodeId,
        updatedAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                image: true,
              },
            },
          },
        },
      },
    });

    let assignedTotal = 0;
    let collectedTotal = 0;
    let returnedTotal = 0;
    const returnedItemsMap = new Map<
      string,
      {
        productName: string;
        productImage: string;
        totalReturned: number;
        totalValue: number;
      }
    >();

    for (const order of orders) {
      // Compute returned value for this order
      const orderReturnedValue = order.items.reduce(
        (sum, item) => sum + item.returnedQuantity * item.price,
        0
      );

      // Add to returned total (all returns today)
      if (orderReturnedValue > 0) {
        returnedTotal += orderReturnedValue;

        // Aggregate per product for the summary
        for (const item of order.items) {
          if (item.returnedQuantity > 0) {
            const key = item.productId;
            const existing = returnedItemsMap.get(key);
            const value = item.returnedQuantity * item.price;
            if (existing) {
              existing.totalReturned += item.returnedQuantity;
              existing.totalValue += value;
            } else {
              returnedItemsMap.set(key, {
                productName: item.product.name,
                productImage: item.product.image,
                totalReturned: item.returnedQuantity,
                totalValue: value,
              });
            }
          }
        }
      }

      // Assigned total: SHIPPED orders only
      if (order.status === "SHIPPED") {
        assignedTotal += order.totalAmount;
      }

      // Collected total: DELIVERED with PAID payment, net of returns
      if (order.status === "DELIVERED" && order.paymentStatus === "PAID") {
        collectedTotal += order.totalAmount - orderReturnedValue;
      }

      // Note: DELIVERED with DUE payment do not add to collected,
      // but their returns are already added to returnedTotal above.
    }

    const returnedItems = Array.from(returnedItemsMap.values());

    return NextResponse.json({
      assignedTotal,
      collectedTotal,
      returnedTotal,
      returnedItems,
    });
  } catch (error) {
    console.error("Error fetching cash summary:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}