import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { startOfToday, endOfToday } from "date-fns";
import CashSummaryClient from "@/components/deliveryboy/CashSummaryClient";


export default async function CashPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "DELIVERY_BOY") {
    redirect("/login");
  }

  // Get delivery boy's assigned delivery code
  const deliveryBoy = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { deliveryCodeId: true },
  });

  if (!deliveryBoy?.deliveryCodeId) {
    // No delivery code – show empty state
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Today's Cash Summary</h1>
        <p className="text-gray-500">
          You are not assigned to any delivery code yet.
        </p>
      </div>
    );
  }

  const todayStart = startOfToday();
  const todayEnd = endOfToday();

  // Fetch orders for today
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
    orderBy: { updatedAt: "desc" },
  });

  // Compute totals and returned items
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
    const orderReturnedValue = order.items.reduce(
      (sum, item) => sum + item.returnedQuantity * item.price,
      0
    );

    if (orderReturnedValue > 0) {
      returnedTotal += orderReturnedValue;
      for (const item of order.items) {
        if (item.returnedQuantity > 0) {
          const key = item.productId;
          const value = item.returnedQuantity * item.price;
          const existing = returnedItemsMap.get(key);
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

    if (order.status === "SHIPPED") {
      assignedTotal += order.totalAmount;
    }

    if (order.status === "DELIVERED" && order.paymentStatus === "PAID") {
      collectedTotal += order.totalAmount - orderReturnedValue;
    }
  }

  const returnedItems = Array.from(returnedItemsMap.values());

  return (
    <CashSummaryClient
      assignedTotal={assignedTotal}
      collectedTotal={collectedTotal}
      returnedTotal={returnedTotal}
      returnedItems={returnedItems}
    />
  );
}