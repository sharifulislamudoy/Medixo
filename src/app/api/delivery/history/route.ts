import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
      return NextResponse.json([]); // No history
    }

    // Fetch all orders that belong to this delivery boy and are in a final state
    const orders = await prisma.order.findMany({
      where: {
        deliveryCodeId: deliveryBoy.deliveryCodeId,
        status: { in: ["DELIVERED", "RETURNED"] },
      },
      include: {
        items: {
          include: {
            product: { select: { name: true, image: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Group by date (using updatedAt)
    const historyMap = new Map<
      string,
      {
        date: string;
        deliveredCount: number;
        deliveredAmount: number;
        returnedAmount: number;
      }
    >();

    for (const order of orders) {
      const dateStr = order.updatedAt.toISOString().split("T")[0]; // YYYY-MM-DD
      const entry = historyMap.get(dateStr) || {
        date: dateStr,
        deliveredCount: 0,
        deliveredAmount: 0,
        returnedAmount: 0,
      };

      // Count delivered orders
      if (order.status === "DELIVERED") {
        entry.deliveredCount += 1;
        entry.deliveredAmount += order.totalAmount;
      }

      // Add returned amount from items (for both DELIVERED and RETURNED orders)
      const orderReturned = order.items.reduce(
        (sum, item) => sum + item.returnedQuantity * item.price,
        0
      );
      entry.returnedAmount += orderReturned;

      historyMap.set(dateStr, entry);
    }

    // Convert map to array and sort by date descending
    const history = Array.from(historyMap.values()).sort(
      (a, b) => (a.date < b.date ? 1 : -1)
    );

    return NextResponse.json(history);
  } catch (error) {
    console.error("Error fetching delivery history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}