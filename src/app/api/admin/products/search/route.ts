import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const query = searchParams.get('search');

  if (!query) {
    return NextResponse.json({ products: [] });
  }

  try {
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { sku: { contains: query, mode: 'insensitive' } },
        ],
        status: true,
        availability: true,
      },
      take: 10,
      select: {
        id: true,
        name: true,
        slug: true,
        image: true,
        sku: true,
        sellPrice: true,
      },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Product search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}