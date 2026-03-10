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
  const { name, code, cityId } = await req.json();

  if (!name || !code || !cityId) {
    return NextResponse.json(
      { error: "Name, code, and cityId are required" },
      { status: 400 }
    );
  }

  // Check uniqueness (excluding current zone)
  const existing = await prisma.zone.findFirst({
    where: { cityId, code, NOT: { id } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Zone code must be unique within the same city" },
      { status: 400 }
    );
  }

  const updated = await prisma.zone.update({
    where: { id },
    data: { name, code, cityId },
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
  await prisma.zone.delete({ where: { id } });
  return NextResponse.json({ message: "Deleted" });
}