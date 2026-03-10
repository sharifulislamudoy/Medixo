import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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
  const { name, code } = await req.json();

  if (!name || !code) {
    return NextResponse.json(
      { error: "Name and code are required" },
      { status: 400 }
    );
  }

  // Check uniqueness (excluding current city)
  const existing = await prisma.city.findFirst({
    where: { code, NOT: { id } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "City code must be unique" },
      { status: 400 }
    );
  }

  const updated = await prisma.city.update({
    where: { id },
    data: { name, code },
  });

  return NextResponse.json(updated);
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
  await prisma.city.delete({ where: { id } });
  return NextResponse.json({ message: "Deleted" });
}