import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET all cities
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cities = await prisma.city.findMany({
    orderBy: { createdAt: "desc" },
    include: { zones: true }, // optional, you may want to include zones
  });
  return NextResponse.json(cities);
}

// CREATE a city
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, code } = await req.json();
  if (!name || !code) {
    return NextResponse.json(
      { error: "Name and code are required" },
      { status: 400 }
    );
  }

  // Check if code already exists
  const existing = await prisma.city.findUnique({ where: { code } });
  if (existing) {
    return NextResponse.json(
      { error: "City code must be unique" },
      { status: 400 }
    );
  }

  const city = await prisma.city.create({
    data: { name, code },
  });

  return NextResponse.json(city);
}