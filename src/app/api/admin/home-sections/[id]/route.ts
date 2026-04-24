// app/api/admin/home-sections/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// ✅ GET – fetch a single section with its products
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // params is now a Promise
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;   // ✅ await params

  const section = await prisma.homeSection.findUnique({
    where: { id },
    include: {
      products: {
        select: {
          id: true,
          productId: true,
          sortOrder: true,
        },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!section) {
    return NextResponse.json({ error: "Section not found" }, { status: 404 });
  }

  return NextResponse.json(section);
}

// PUT – update section details
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;   // ✅ await params

  const body = await req.json();
  const { title, description, isVisible, shuffleIntervalMinutes } = body;

  const updated = await prisma.homeSection.update({
    where: { id },
    data: {
      title: title ?? undefined,
      description: description ?? undefined,
      isVisible: isVisible ?? undefined,
      shuffleIntervalMinutes: shuffleIntervalMinutes ?? undefined,
    },
  });

  return NextResponse.json(updated);
}

// DELETE – remove a section
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;   // ✅ await params

  await prisma.homeSection.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}