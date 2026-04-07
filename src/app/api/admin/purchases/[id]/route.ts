import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  try {
    const purchase = await prisma.purchase.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                image: true,
                nextPurchasePrice: true,
                mrp: true,
              },
            },
          },
        },
      },
    });
    if (!purchase) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(purchase);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { supplierId, purchaseDate, paymentStatus, notes, items, updateProductDefaults } = body;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.purchase.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!existing) throw new Error("Purchase not found");

      // Revert stock
      for (const oldItem of existing.items) {
        await tx.stock.update({
          where: { productId: oldItem.productId },
          data: { quantity: { decrement: oldItem.quantity } },
        });
      }

      await tx.purchaseItem.deleteMany({ where: { purchaseId: id } });

      let totalAmount = 0;
      for (const item of items) {
        totalAmount += item.quantity * item.costPrice;
      }

      const updatedPurchase = await tx.purchase.update({
        where: { id },
        data: {
          supplierId,
          purchaseDate: new Date(purchaseDate),
          paymentStatus,
          totalAmount,
          notes: notes || null,
        },
      });

      for (const item of items) {
        const { productId, quantity, costPrice, profitMargin, mrp, nextPurchasePrice } = item;
        const sellPrice = costPrice * (1 + profitMargin / 100);
        const totalCost = quantity * costPrice;

        await tx.purchaseItem.create({
          data: {
            purchaseId: id,
            productId,
            quantity,
            costPrice,
            profitMargin,
            sellPrice,
            totalCost,
            mrp: mrp || null,
          },
        });

        await tx.stock.update({
          where: { productId },
          data: { quantity: { increment: quantity } },
        });

        if (updateProductDefaults === true) {
          await tx.product.update({
            where: { id: productId },
            data: {
              costPrice,
              profitMargin,
              sellPrice,
              nextPurchasePrice: nextPurchasePrice ?? null,
              mrp: mrp ?? undefined,
            },
          });
        }
      }
      return updatedPurchase;
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update purchase" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  try {
    await prisma.$transaction(async (tx) => {
      const purchase = await tx.purchase.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!purchase) throw new Error("Purchase not found");
      for (const item of purchase.items) {
        await tx.stock.update({
          where: { productId: item.productId },
          data: { quantity: { decrement: item.quantity } },
        });
      }
      await tx.purchase.delete({ where: { id } });
    });
    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}