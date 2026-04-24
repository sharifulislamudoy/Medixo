// app/api/admin/home-sections/[id]/products/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// POST – add products to section
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: sectionId } = await params;   // ✅ await params

  const body = await req.json();
  const { productIds } = body;

  if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
    return NextResponse.json({ error: "productIds array required" }, { status: 400 });
  }

  const lastProduct = await prisma.homeSectionProduct.findFirst({
    where: { sectionId },
    orderBy: { sortOrder: "desc" },
  });
  let nextOrder = lastProduct ? lastProduct.sortOrder + 1 : 0;

  await prisma.homeSectionProduct.createMany({
    data: productIds.map((pid: string, index: number) => ({
      sectionId,
      productId: pid,
      sortOrder: nextOrder + index,
    })),
  });

  await prisma.homeSection.update({
    where: { id: sectionId },
    data: { lastShuffledAt: null },
  });

  return NextResponse.json({ success: true }, { status: 201 });
}

// DELETE – remove a product from section
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: sectionId } = await params;   // ✅ await params

  const body = await req.json();
  const { productId } = body;

  if (!productId) {
    return NextResponse.json({ error: "productId required" }, { status: 400 });
  }

  await prisma.homeSectionProduct.deleteMany({
    where: { sectionId, productId },
  });

  const remaining = await prisma.homeSectionProduct.findMany({
    where: { sectionId },
    orderBy: { sortOrder: "asc" },
  });
  await prisma.$transaction(
    remaining.map((item, idx) =>
      prisma.homeSectionProduct.update({
        where: { id: item.id },
        data: { sortOrder: idx },
      })
    )
  );

  await prisma.homeSection.update({
    where: { id: sectionId },
    data: { lastShuffledAt: null },
  });

  return new NextResponse(null, { status: 204 });
}