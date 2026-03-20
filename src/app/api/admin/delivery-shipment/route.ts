import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, parseISO } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");
    const targetDate = dateParam ? parseISO(dateParam) : new Date();
    const dayStart = startOfDay(targetDate);
    const dayEnd = endOfDay(targetDate);

    // Get all delivery boys with their delivery codes
    const deliveryBoys = await prisma.user.findMany({
      where: { role: "DELIVERY_BOY" },
      select: {
        id: true,
        name: true,
        deliveryCode: {
          select: {
            id: true,
            code: true,
          },
        },
      },
    });

    // Build map: deliveryCodeId -> { code, boys[] }
    const codeMap = new Map<
      string,
      { code: string; boys: string[] }
    >();
    for (const boy of deliveryBoys) {
      if (boy.deliveryCode?.id) {
        const existing = codeMap.get(boy.deliveryCode.id);
        if (existing) {
          existing.boys.push(boy.name);
        } else {
          codeMap.set(boy.deliveryCode.id, {
            code: boy.deliveryCode.code,
            boys: [boy.name],
          });
        }
      }
    }

    const codeIds = Array.from(codeMap.keys());

    // 1. CURRENT TARGET: all SHIPPED orders (count and total amount)
    const shippedOrders = await prisma.order.findMany({
      where: {
        deliveryCodeId: { in: codeIds },
        status: "SHIPPED",
      },
      select: {
        deliveryCodeId: true,
        totalAmount: true,
      },
    });

    const targetMap = new Map<string, { count: number; amount: number }>();
    for (const order of shippedOrders) {
      const codeId = order.deliveryCodeId!;
      const current = targetMap.get(codeId) || { count: 0, amount: 0 };
      current.count += 1;
      current.amount += order.totalAmount;
      targetMap.set(codeId, current);
    }

    // 2. DAILY ACTIVITY: orders updated on the selected date
    const dailyOrders = await prisma.order.findMany({
      where: {
        deliveryCodeId: { in: codeIds },
        updatedAt: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
      include: {
        items: true,
        deliveryCode: { select: { id: true, code: true } },
      },
    });

    const dailyMap = new Map<
      string,
      {
        deliveredAmount: number;
        dueAmount: number;
        returnedAmount: number;
      }
    >();

    for (const order of dailyOrders) {
      const codeId = order.deliveryCodeId!;
      const entry = dailyMap.get(codeId) || {
        deliveredAmount: 0,
        dueAmount: 0,
        returnedAmount: 0,
      };

      if (order.status === "DELIVERED") {
        entry.deliveredAmount += order.totalAmount;
        if (order.paymentStatus === "DUE") {
          entry.dueAmount += order.totalAmount;
        }
      }

      const orderReturned = order.items.reduce(
        (sum, item) => sum + item.returnedQuantity * item.price,
        0
      );
      entry.returnedAmount += orderReturned;

      dailyMap.set(codeId, entry);
    }

    // Combine all data
    const result = Array.from(codeMap.entries()).map(([codeId, { code, boys }]) => {
      const target = targetMap.get(codeId) || { count: 0, amount: 0 };
      const daily = dailyMap.get(codeId) || {
        deliveredAmount: 0,
        dueAmount: 0,
        returnedAmount: 0,
      };

      return {
        deliveryCode: code,
        boys,
        assignedOrders: target.count,
        targetAmount: target.amount,
        deliveredAmount: daily.deliveredAmount,
        dueAmount: daily.dueAmount,
        returnedAmount: daily.returnedAmount,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in delivery shipment API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}