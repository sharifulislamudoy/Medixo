// app/api/admin/purchases/[id]/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET single purchase
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
                nextPurchasePrice: true,   // 👈 new
              },
            },
          },
        },
      },
    });
    if (!purchase) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(purchase);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

// UPDATE purchase
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
      // Get existing purchase with its items
      const existing = await tx.purchase.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!existing) throw new Error("Purchase not found");

      // Revert stock changes from old items
      for (const oldItem of existing.items) {
        await tx.stock.update({
          where: { productId: oldItem.productId },
          data: { quantity: { decrement: oldItem.quantity } },
        });
      }

      // Delete old items
      await tx.purchaseItem.deleteMany({ where: { purchaseId: id } });

      // Calculate new total amount
      let totalAmount = 0;
      for (const item of items) {
        totalAmount += item.quantity * item.costPrice;
      }

      // Update purchase header
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

      // Create new items and update stock & product
      for (const item of items) {
        const { productId, quantity, costPrice, profitMargin, nextPurchasePrice } = item;
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
          },
        });

        // Update stock with new quantity
        await tx.stock.update({
          where: { productId },
          data: { quantity: { increment: quantity } },
        });

        // Optionally update product defaults
        if (updateProductDefaults === true) {
          await tx.product.update({
            where: { id: productId },
            data: {
              costPrice,
              profitMargin,
              sellPrice,
              nextPurchasePrice: nextPurchasePrice ?? null,   // 👈 new
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

// DELETE purchase
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
      // Get purchase items
      const purchase = await tx.purchase.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!purchase) throw new Error("Purchase not found");

      // Revert stock
      for (const item of purchase.items) {
        await tx.stock.update({
          where: { productId: item.productId },
          data: { quantity: { decrement: item.quantity } },
        });
      }

      // Delete purchase (cascade deletes items)
      await tx.purchase.delete({ where: { id } });
    });
    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}