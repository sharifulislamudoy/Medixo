import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { status: true },
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