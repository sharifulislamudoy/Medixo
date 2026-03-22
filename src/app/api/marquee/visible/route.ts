import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const marquees = await prisma.marquee.findMany({
    where: { isVisible: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(marquees);
}