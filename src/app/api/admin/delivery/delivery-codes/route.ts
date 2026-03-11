import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET all delivery codes
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const deliveryCodes = await prisma.deliveryCode.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        areas: {
          include: {
            zone: {
              include: { city: true },
            },
          },
        },
      },
    });
    return NextResponse.json(deliveryCodes);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch delivery codes" },
      { status: 500 }
    );
  }
}

// POST create a new delivery code
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { areaIds } = await req.json();

  if (!areaIds || !Array.isArray(areaIds) || areaIds.length === 0) {
    return NextResponse.json(
      { error: "At least one area must be selected" },
      { status: 400 }
    );
  }

  try {
    // Check if any of the areas are already assigned to another delivery code
    const conflictingAreas = await prisma.area.findMany({
      where: {
        id: { in: areaIds },
        deliveryCodeId: { not: null },
      },
      include: { deliveryCode: true },
    });

    if (conflictingAreas.length > 0) {
      const conflicting = conflictingAreas
        .map((a) => `${a.name} (already in ${a.deliveryCode?.code})`)
        .join(", ");
      return NextResponse.json(
        { error: `Some areas are already assigned: ${conflicting}` },
        { status: 400 }
      );
    }

    // Generate next delivery code
    const lastCode = await prisma.deliveryCode.findFirst({
      orderBy: { code: "desc" },
      select: { code: true },
    });

    let nextNumber = 1;
    if (lastCode) {
      const lastNumber = parseInt(lastCode.code.replace("DC", ""));
      nextNumber = lastNumber + 1;
    }
    const newCode = `DC${String(nextNumber).padStart(4, "0")}`;

    // Create delivery code and assign areas
    const deliveryCode = await prisma.deliveryCode.create({
      data: {
        code: newCode,
        areas: {
          connect: areaIds.map((id) => ({ id })),
        },
      },
      include: { areas: true },
    });

    return NextResponse.json(deliveryCode);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create delivery code" },
      { status: 500 }
    );
  }
}