// /app/api/admin/advertisement/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function createSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const ads = await prisma.advertisement.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(ads);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const { title, imageUrl, category, hyperlink, isVisible, detailImage, description } = body;

  if (!title || !imageUrl || !category) {
    return NextResponse.json({ error: "Title, image and category are required" }, { status: 400 });
  }

  let slug = createSlug(title);
  const existing = await prisma.advertisement.findUnique({ where: { slug } });
  if (existing) {
    slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`;
  }

  const ad = await prisma.advertisement.create({
    data: {
      title,
      slug,
      imageUrl,
      detailImage: category === "ANNOUNCEMENT" ? detailImage : null,
      description: category === "ANNOUNCEMENT" ? description : null,
      category,
      hyperlink: category === "PRODUCT" ? hyperlink : null,
      isVisible: isVisible ?? true,
    },
  });

  return NextResponse.json(ad);
}