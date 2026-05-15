import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import MissingClient from "@/components/deliveryboy/MissingClient";

export default async function MissingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "DELIVERY_BOY") {
    redirect("/login");
  }

  const { id } = await params;

  // Fetch the order with items
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: {
            select: { id: true, name: true, image: true, sellPrice: true },
          },
        },
      },
    },
  });

  if (!order) {
    return <div>Order not found</div>;
  }

  // Security: ensure this delivery boy is allowed
  const deliveryBoy = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { deliveryCodeId: true },
  });

  if (
    !deliveryBoy?.deliveryCodeId ||
    order.deliveryCodeId !== deliveryBoy.deliveryCodeId
  ) {
    return <div>Unauthorized</div>;
  }

  return <MissingClient order={order} />;
}