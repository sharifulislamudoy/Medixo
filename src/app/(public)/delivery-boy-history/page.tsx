import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import HistoryClient from "@/components/deliveryboy/HistoryClient";


export default async function HistoryPage() {
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
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Delivery History</h1>
        <p className="text-gray-500">
          You are not assigned to any delivery code yet.
        </p>
      </div>
    );
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

    if (order.status === "DELIVERED") {
      entry.deliveredCount += 1;
      entry.deliveredAmount += order.totalAmount;
    }

    const orderReturned = order.items.reduce(
      (sum, item) => sum + item.returnedQuantity * item.price,
      0
    );
    entry.returnedAmount += orderReturned;

    historyMap.set(dateStr, entry);
  }

  const history = Array.from(historyMap.values()).sort(
    (a, b) => (a.date < b.date ? 1 : -1)
  );

  return <HistoryClient history={history} />;
}