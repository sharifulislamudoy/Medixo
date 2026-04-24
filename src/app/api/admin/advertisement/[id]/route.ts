// /app/api/admin/advertisement/[id]/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function createSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  const body = await req.json();
  const { title, imageUrl, category, hyperlink, isVisible, detailImage, description } = body;

  if (!title || !imageUrl || !category) {
    return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
  }

  const current = await prisma.advertisement.findUnique({ where: { id } });
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let slug = current.slug;
  if (current.title !== title) {
    slug = createSlug(title);
    const duplicate = await prisma.advertisement.findFirst({
      where: { slug, id: { not: id } },
    });
    if (duplicate) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`;
    }
  }

  const updated = await prisma.advertisement.update({
    where: { id },
    data: {
      title,
      slug,
      imageUrl,
      detailImage: category === "ANNOUNCEMENT" ? detailImage : null,
      description: category === "ANNOUNCEMENT" ? description : null,
      category,
      hyperlink: category === "PRODUCT" ? hyperlink : null,
      isVisible,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  await prisma.advertisement.delete({ where: { id } });
  return NextResponse.json({ message: "Deleted" });
}