// app/api/admin/procurement/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/admin/procurement – list all procurements
export async function GET() {
  try {
    const procurements = await prisma.procurement.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: { product: true },
        },
      },
    });
    return NextResponse.json({ procurements });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch procurements' }, { status: 500 });
  }
}

// POST /api/admin/procurement – create a new procurement
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, notes } = body;

    // Generate PR number (PQ-0001 style)
    const lastProcurement = await prisma.procurement.findFirst({
      orderBy: { prNumber: 'desc' },
    });
    let nextNumber = 1;
    if (lastProcurement) {
      const match = lastProcurement.prNumber.match(/PQ-(\d+)/);
      if (match) nextNumber = parseInt(match[1], 10) + 1;
    }
    const prNumber = `PQ-${nextNumber.toString().padStart(4, '0')}`;

    const procurement = await prisma.procurement.create({
      data: {
        prNumber,
        notes,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            orderQuantity: item.orderQuantity,
            mrp: item.mrp,
            costPrice: item.costPrice,
            sellPrice: item.sellPrice,
            requiredQuantity: item.requiredQuantity,
            bidding: item.bidding,
          })),
        },
      },
    });

    return NextResponse.json({ procurement });
  } catch (error) {
    console.error('Create procurement error:', error);
    return NextResponse.json({ error: 'Failed to create procurement' }, { status: 500 });
  }
}