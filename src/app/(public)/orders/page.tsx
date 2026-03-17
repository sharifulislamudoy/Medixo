import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DeliveryBoyOrdersClient from "@/components/deliveryboy/DeliveryBoyOrdersClient";

export default async function DeliveryBoyOrdersPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "DELIVERY_BOY") {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-red-600">Unauthorized</h1>
        <p className="text-gray-600 mt-2">You do not have access to this page.</p>
      </div>
    );
  }

  // Fetch the delivery boy with his assigned delivery code
  const deliveryBoy = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      deliveryCode: {
        select: { id: true, code: true },
      },
    },
  });

  if (!deliveryBoy?.deliveryCode) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">You have not been assigned any delivery area yet.</p>
      </div>
    );
  }

  // Fetch orders for this delivery code that are SHIPPED (out for delivery)
  const rawOrders = await prisma.order.findMany({
    where: {
      deliveryCodeId: deliveryBoy.deliveryCode.id,
      status: "SHIPPED",
    },
    orderBy: { orderDate: "desc" },
    select: {
      id: true,
      invoiceNo: true,
      orderDate: true,
      customerName: true,
      customerShopName: true,
      customerPhone: true,
      totalAmount: true,
      status: true,
    },
  });

  // Convert Date objects to strings
  const orders = rawOrders.map((order) => ({
    ...order,
    orderDate: order.orderDate.toISOString(),
  }));

  const today = new Date().toLocaleDateString("en-BD", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
        <h1 className="text-3xl font-bold text-gray-800">My Deliveries</h1>
        <div className="text-left sm:text-right">
          <p className="text-lg font-medium text-gray-600">{today}</p>
          <p className="text-sm text-gray-500">Total Orders: {orders.length}</p>
        </div>
      </div>
      <DeliveryBoyOrdersClient initialOrders={orders} />
    </div>
  );
}