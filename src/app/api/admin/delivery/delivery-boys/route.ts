import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const boys = await prisma.user.findMany({
      where: { role: "DELIVERY_BOY" },
      select: {
        id: true,
        name: true,
        deliveryCode: {
          select: {
            id: true,
            code: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(boys);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch delivery boys" },
      { status: 500 }
    );
  }
}