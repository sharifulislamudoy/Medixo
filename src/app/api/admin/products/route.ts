import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateNextSKU } from "@/lib/sku";
import { slugify, generateUniqueSlug } from "@/lib/slugify";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const products = await prisma.product.findMany({
    include: {
      generic: true,
      brand: true,
      stock: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const mapped = products.map(p => ({
    ...p,
    stock: p.stock?.quantity ?? 0,
    costMargin: p.costMargin,   // 👈 ensure it's exposed
  }));

  return NextResponse.json(mapped);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    name,
    category,
    mrp,
    genericName,
    brandName,
    image,
    description,
    costPrice,
    profitMargin,
    costMargin,       // 👈 NEW
    stock,
  } = await req.json();

  if (!name || !category || !mrp || !image || !description || !costPrice || profitMargin === undefined || stock === undefined) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const cost = parseFloat(costPrice);
  const margin = parseFloat(profitMargin);
  const sellPrice = cost * (1 + margin / 100);
  const sku = await generateNextSKU();

  const baseSlug = slugify(name);
  const slug = await generateUniqueSlug(baseSlug, prisma);

  let genericId = null;
  if (genericName) {
    const generic = await prisma.generic.upsert({
      where: { name: genericName },
      update: {},
      create: { name: genericName },
    });
    genericId = generic.id;
  }

  let brandId = null;
  if (brandName) {
    const brand = await prisma.brand.upsert({
      where: { name: brandName },
      update: {},
      create: { name: brandName },
    });
    brandId = brand.id;
  }

  const product = await prisma.$transaction(async (tx) => {
    const newProduct = await tx.product.create({
      data: {
        name,
        slug,
        category,
        sku,
        mrp: parseFloat(mrp),
        genericId,
        brandId,
        image,
        description,
        costPrice: cost,
        profitMargin: margin,
        costMargin: costMargin ? parseFloat(costMargin) : null,   // 👈 store
        sellPrice,
      },
      include: { generic: true, brand: true },
    });

    await tx.stock.create({
      data: {
        productId: newProduct.id,
        quantity: parseInt(stock, 10),
      },
    });

    return newProduct;
  });

  return NextResponse.json({ ...product, stock: parseInt(stock, 10) });
}