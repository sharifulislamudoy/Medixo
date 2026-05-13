import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find the first (e.g., most recent) order that is DELIVERED and hasn't shown the review modal
  const order = await prisma.order.findFirst({
    where: {
      userId: session.user.id,
      status: "DELIVERED",
      reviewShown: false,
    },
    orderBy: { deliveryDate: "desc" },
    select: {
      id: true,
      invoiceNo: true,
      deliveryCode: { select: { code: true } },
    },
  });

  return NextResponse.json(order ?? null);
}