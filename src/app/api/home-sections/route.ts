// app/api/home-sections/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { shuffleProductsWithGroq } from "@/lib/groq";

export async function GET() {
  try {
    const sections = await prisma.homeSection.findMany({
      where: { isVisible: true },
      include: {
        products: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                image: true,
                mrp: true,
                sellPrice: true,
                generic: { select: { name: true } },
                brand: { select: { name: true } },
              },
            },
          },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    for (const section of sections) {
      const now = new Date();
      const intervalMs = section.shuffleIntervalMinutes * 60 * 1000;

      if (
        section.shuffleIntervalMinutes > 0 &&
        (!section.lastShuffledAt || now.getTime() - section.lastShuffledAt.getTime() > intervalMs)
      ) {
        try {
          const productInfos = section.products.map(p => ({
            id: p.product.id,
            name: p.product.name,
          }));

          const newOrder = await shuffleProductsWithGroq(productInfos);

          // Use a transaction to delete all current associations and insert new ones
          await prisma.$transaction(async (tx) => {
            // Remove all existing rows for this section
            await tx.homeSectionProduct.deleteMany({
              where: { sectionId: section.id },
            });

            // Insert new rows with the shuffled order
            await tx.homeSectionProduct.createMany({
              data: newOrder.map((productId, index) => ({
                sectionId: section.id,
                productId,
                sortOrder: index,
              })),
            });
          });

          // Update lastShuffledAt
          await prisma.homeSection.update({
            where: { id: section.id },
            data: { lastShuffledAt: now },
          });

          // Re‑fetch the products for this section after shuffle
          const freshProducts = await prisma.homeSectionProduct.findMany({
            where: { sectionId: section.id },
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  image: true,
                  mrp: true,
                  sellPrice: true,
                  generic: { select: { name: true } },
                  brand: { select: { name: true } },
                },
              },
            },
            orderBy: { sortOrder: "asc" },
          });

          section.products = freshProducts;
        } catch (error) {
          console.error(`Shuffling failed for section ${section.id}`, error);
          // Continue with the existing (old) order
        }
      }
    }

    const result = sections.map(section => ({
      id: section.id,
      title: section.title,
      description: section.description,
      products: section.products.map(sp => ({
        ...sp.product,
        discount:
          sp.product.mrp > sp.product.sellPrice
            ? Math.round(((sp.product.mrp - sp.product.sellPrice) / sp.product.mrp) * 100)
            : 0,
      })),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch home sections", error);
    return NextResponse.json({ error: "Failed to fetch sections" }, { status: 500 });
  }
}