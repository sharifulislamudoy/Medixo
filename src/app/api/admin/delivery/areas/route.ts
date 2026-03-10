import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const areas = await prisma.area.findMany({
    orderBy: { createdAt: "desc" },
    include: { zone: { include: { city: true } } },
  });
  return NextResponse.json(areas);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, code, zoneId } = await req.json();
  if (!name || !code || !zoneId) {
    return NextResponse.json(
      { error: "Name, code, and zoneId are required" },
      { status: 400 }
    );
  }

  // Check uniqueness of code within the same zone
  const existing = await prisma.area.findFirst({
    where: { zoneId, code },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Area code must be unique within the same zone" },
      { status: 400 }
    );
  }

  // Fetch zone with city to generate trCode
  const zone = await prisma.zone.findUnique({
    where: { id: zoneId },
    include: { city: true },
  });
  if (!zone) {
    return NextResponse.json({ error: "Zone not found" }, { status: 404 });
  }

  const trCode = `${zone.city.code}-${zone.code}-${code}`;

  // Ensure trCode is unique
  const trCodeExists = await prisma.area.findUnique({
    where: { trCode },
  });
  if (trCodeExists) {
    return NextResponse.json(
      { error: "Generated TR code already exists. Please use different codes." },
      { status: 400 }
    );
  }

  const area = await prisma.area.create({
    data: { name, code, zoneId, trCode },
  });

  return NextResponse.json(area);
}