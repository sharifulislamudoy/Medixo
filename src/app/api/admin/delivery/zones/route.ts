import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const zones = await prisma.zone.findMany({
    orderBy: { createdAt: "desc" },
    include: { city: true, areas: true },
  });
  return NextResponse.json(zones);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, code, cityId } = await req.json();
  if (!name || !code || !cityId) {
    return NextResponse.json(
      { error: "Name, code, and cityId are required" },
      { status: 400 }
    );
  }

  // Check uniqueness of code within the same city
  const existing = await prisma.zone.findFirst({
    where: { cityId, code },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Zone code must be unique within the same city" },
      { status: 400 }
    );
  }

  const zone = await prisma.zone.create({
    data: { name, code, cityId },
  });

  return NextResponse.json(zone);
}