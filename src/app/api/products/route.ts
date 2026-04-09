import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { status: true },
      select: {
        id: true,
        name: true,
        slug: true,          // 👈 Ensure this is selected
        category: true,
        sku: true,
        mrp: true,
        sellPrice: true,
        image: true,
        description: true,
        availability: true,
        generic: { select: { name: true } },
        brand: { select: { name: true } },
        stock: { select: { quantity: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const mapped = products.map(p => ({
      ...p,
      stock: p.stock?.quantity ?? 0,
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}