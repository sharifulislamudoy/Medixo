import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          where: { returnedQuantity: { gt: 0 } },
          include: { product: { select: { name: true, image: true } } },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const returnedItems = order.items.map((item) => ({
      productName: item.product.name,
      productImage: item.product.image,
      returnedQuantity: item.returnedQuantity,
      price: item.price,
      total: item.returnedQuantity * item.price,
    }));

    return NextResponse.json({ returnedItems });
  } catch (error) {
    console.error("Error fetching returned items:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}