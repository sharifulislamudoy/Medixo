import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function generatePurchaseNo() {
  const count = await prisma.purchase.count();
  return `PO-${(count + 1).toString().padStart(6, "0")}`;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const purchases = await prisma.purchase.findMany({
      include: {
        supplier: { select: { id: true, name: true, shopName: true, phone: true } },
        items: {
          include: {
            product: {
              select: { id: true, name: true, sku: true, image: true }
            }
          }
        }
      },
      orderBy: [{ purchaseDate: "desc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(purchases);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch purchases" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { supplierId, purchaseDate, paymentStatus, notes, items, updateProductDefaults } = body;

  if (!supplierId || !items || items.length === 0) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const purchaseNo = await generatePurchaseNo();
      let totalAmount = 0;
      for (const item of items) {
        totalAmount += item.quantity * item.costPrice;
      }

      const purchase = await tx.purchase.create({
        data: {
          purchaseNo,
          supplierId,
          purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
          paymentStatus: paymentStatus || "DUE",
          totalAmount,
          notes: notes || null,
        },
      });

      for (const item of items) {
        const { productId, quantity, costPrice, profitMargin, costMargin, mrp, nextPurchasePrice } = item;
        const sellPrice = costPrice * (1 + profitMargin / 100);
        const totalCost = quantity * costPrice;

        await tx.purchaseItem.create({
          data: {
            purchaseId: purchase.id,
            productId,
            quantity,
            costPrice,
            profitMargin,
            costMargin: costMargin ?? null,   // 👈 store cost margin
            sellPrice,
            totalCost,
            mrp: mrp || null,
          },
        });

        await tx.stock.upsert({
          where: { productId },
          update: { quantity: { increment: quantity } },
          create: { productId, quantity },
        });

        if (updateProductDefaults === true) {
          await tx.product.update({
            where: { id: productId },
            data: {
              costPrice,
              profitMargin,
              costMargin: costMargin ?? profitMargin,  // 👈 default to profitMargin if not given
              sellPrice,
              nextPurchasePrice: nextPurchasePrice ?? null,
              mrp: mrp ?? undefined,
            },
          });
        }
      }
      return purchase;
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create purchase" }, { status: 500 });
  }
}