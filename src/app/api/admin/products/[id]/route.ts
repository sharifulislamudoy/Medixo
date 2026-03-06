import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await req.json();
  const {
    name,
    category,
    mrp,
    genericName,
    brandName,
    image,
    description,
    costPrice,
    profitMargin,      // 👈 NEW
    status,
    availability,
    stock,
  } = body;

  // Handle generic upsert
  let genericId = undefined;
  if (genericName !== undefined) {
    if (genericName) {
      const generic = await prisma.generic.upsert({
        where: { name: genericName },
        update: {},
        create: { name: genericName },
      });
      genericId = generic.id;
    } else {
      genericId = null;
    }
  }

  // Handle brand upsert
  let brandId = undefined;
  if (brandName !== undefined) {
    if (brandName) {
      const brand = await prisma.brand.upsert({
        where: { name: brandName },
        update: {},
        create: { name: brandName },
      });
      brandId = brand.id;
    } else {
      brandId = null;
    }
  }

  // Update product and stock in a transaction
  const updated = await prisma.$transaction(async (tx) => {
    // Fetch current product to get existing cost/margin if needed for sellPrice calculation
    const currentProduct = await tx.product.findUnique({ where: { id } });
    if (!currentProduct) throw new Error("Product not found");

    // Determine final cost and margin
    const finalCost = costPrice !== undefined ? parseFloat(costPrice) : currentProduct.costPrice;
    const finalMargin = profitMargin !== undefined ? parseFloat(profitMargin) : currentProduct.profitMargin;
    // Compute new sell price
    const computedSellPrice = finalCost * (1 + finalMargin / 100);

    const product = await tx.product.update({
      where: { id },
      data: {
        name,
        category,
        mrp: mrp ? parseFloat(mrp) : undefined,
        genericId,
        brandId,
        image,
        description,
        costPrice: costPrice !== undefined ? parseFloat(costPrice) : undefined,
        profitMargin: profitMargin !== undefined ? parseFloat(profitMargin) : undefined,
        sellPrice: computedSellPrice,   // 👈 always update sell price based on latest cost/margin
        status: status !== undefined ? status : undefined,
        availability: availability !== undefined ? availability : undefined,
      },
      include: { generic: true, brand: true },
    });

    // Update or create stock record
    if (stock !== undefined) {
      await tx.stock.upsert({
        where: { productId: id },
        update: { quantity: parseInt(stock, 10) },
        create: { productId: id, quantity: parseInt(stock, 10) },
      });
    }

    return product;
  });

  // Fetch the final stock to include in response
  const stockRecord = await prisma.stock.findUnique({ where: { productId: id } });
  return NextResponse.json({ ...updated, stock: stockRecord?.quantity ?? 0 });
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ message: "Deleted" });
}