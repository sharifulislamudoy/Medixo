// /app/api/advertisement/visible/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const ads = await prisma.advertisement.findMany({
    where: { isVisible: true },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      imageUrl: true,
      category: true,
      hyperlink: true,
    },
  });
  return NextResponse.json(ads);
}