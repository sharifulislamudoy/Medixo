import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ReturnClient from "@/components/deliveryboy/ReturnClient";

export default async function ReturnPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "DELIVERY_BOY") {
    return <div className="text-center py-12 text-red-600">Unauthorized</div>;
  }

  const { id } = await params;

  // Get delivery boy's assigned delivery code
  const deliveryBoy = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { deliveryCodeId: true },
  });

  if (!deliveryBoy?.deliveryCodeId) {
    return <div className="text-center py-12">No delivery area assigned.</div>;
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, image: true, sellPrice: true } },
        },
      },
    },
  });

  if (!order || order.deliveryCodeId !== deliveryBoy.deliveryCodeId) {
    return <div className="text-center py-12">Order not found or not assigned to you.</div>;
  }

  if (order.status !== "SHIPPED") {
    return <div className="text-center py-12">Only SHIPPED orders can be returned.</div>;
  }

  // Serialize dates
  const serializedOrder = {
    ...order,
    orderDate: order.orderDate.toISOString(),
    deliveryDate: order.deliveryDate.toISOString(),
    items: order.items.map((item) => ({
      ...item,
      product: {
        ...item.product,
        sellPrice: item.product.sellPrice,
      },
    })),
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ReturnClient order={serializedOrder} />
    </div>
  );
}