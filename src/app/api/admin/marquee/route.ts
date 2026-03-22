import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET all marquees (Admin only)
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const marquees = await prisma.marquee.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(marquees);
}

// POST create marquee
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { text, isVisible } = body;

  if (!text) {
    return NextResponse.json({ error: "Text is required" }, { status: 400 });
  }

  const marquee = await prisma.marquee.create({
    data: {
      text,
      isVisible: isVisible ?? true,
    },
  });

  return NextResponse.json(marquee);
}