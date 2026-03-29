import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const suppliers = await prisma.user.findMany({
      where: { role: "SUPPLIER", status: "APPROVED" },
      select: { id: true, name: true, shopName: true, phone: true, email: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(suppliers);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch suppliers" }, { status: 500 });
  }
}