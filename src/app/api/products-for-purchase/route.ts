// app/api/products-for-purchase/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { status: true },
      include: {
        stock: true,
        generic: true,
        brand: true,
      },
      orderBy: { name: "asc" },
    });
    const mapped = products.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      mrp: p.mrp,
      costPrice: p.costPrice,
      profitMargin: p.profitMargin,
      sellPrice: p.sellPrice,
      stock: p.stock?.quantity || 0,
      image: p.image,
      nextPurchasePrice: p.nextPurchasePrice,   // 👈 new
    }));
    return NextResponse.json(mapped);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}