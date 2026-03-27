import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderIds } = await req.json();
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ error: "No orders selected" }, { status: 400 });
    }

    // Fetch all selected orders with their items
    const orders = await prisma.order.findMany({
      where: { id: { in: orderIds } },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Aggregate products and quantities
    const productMap = new Map<
      string,
      { quantity: number; product: any }
    >();
    for (const order of orders) {
      for (const item of order.items) {
        const existing = productMap.get(item.productId);
        if (existing) {
          existing.quantity += item.quantity;
        } else {
          productMap.set(item.productId, {
            quantity: item.quantity,
            product: item.product,
          });
        }
      }
    }

    // Generate next PR number
    const lastProcurement = await prisma.procurement.findFirst({
      orderBy: { prNumber: "desc" },
    });
    let nextNumber = 1;
    if (lastProcurement) {
      const match = lastProcurement.prNumber.match(/PR-(\d+)/);
      if (match) nextNumber = parseInt(match[1]) + 1;
    }
    const prNumber = `PR-${nextNumber.toString().padStart(4, "0")}`;

    // Create procurement with items
    const procurement = await prisma.$transaction(async (tx) => {
      // Create procurement record
      const newProc = await tx.procurement.create({
        data: {
          prNumber,
        },
      });

      // Create procurement items
      const itemsData = [];
      for (const [productId, { quantity, product }] of productMap.entries()) {
        // Get current stock (snapshot)
        const stock = await tx.stock.findUnique({
          where: { productId },
        });
        const currentStock = stock?.quantity ?? 0;

        itemsData.push(
          tx.procurementItem.create({
            data: {
              procurementId: newProc.id,
              productId,
              orderedQuantity: quantity,
              currentStock,
              purchasePrice: product.costPrice,
              mrp: product.mrp,
            },
          })
        );
      }
      await Promise.all(itemsData);

      return newProc;
    });

    return NextResponse.json({
      success: true,
      procurement,
    });
  } catch (error) {
    console.error("Error creating procurement:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}