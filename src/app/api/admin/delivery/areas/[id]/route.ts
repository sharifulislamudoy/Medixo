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
  const { name, code, zoneId } = await req.json();

  if (!name || !code || !zoneId) {
    return NextResponse.json(
      { error: "Name, code, and zoneId are required" },
      { status: 400 }
    );
  }

  // Check uniqueness of code within the same zone (excluding current)
  const existing = await prisma.area.findFirst({
    where: { zoneId, code, NOT: { id } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Area code must be unique within the same zone" },
      { status: 400 }
    );
  }

  // Fetch zone with city to regenerate trCode
  const zone = await prisma.zone.findUnique({
    where: { id: zoneId },
    include: { city: true },
  });
  if (!zone) {
    return NextResponse.json({ error: "Zone not found" }, { status: 404 });
  }

  const trCode = `${zone.city.code}-${zone.code}-${code}`;

  // Ensure new trCode is unique (excluding current area)
  const trCodeExists = await prisma.area.findFirst({
    where: { trCode, NOT: { id } },
  });
  if (trCodeExists) {
    return NextResponse.json(
      { error: "Generated TR code already exists. Please use different codes." },
      { status: 400 }
    );
  }

  const updated = await prisma.area.update({
    where: { id },
    data: { name, code, zoneId, trCode },
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
  await prisma.area.delete({ where: { id } });
  return NextResponse.json({ message: "Deleted" });
}