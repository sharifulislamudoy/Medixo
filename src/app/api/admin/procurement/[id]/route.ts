import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // ✅ Await the promise
    const procurement = await prisma.procurement.findUnique({
      where: { id },
      include: {
        items: {
          include: { product: true },
        },
      },
    });
    if (!procurement) {
      return NextResponse.json({ error: 'Procurement not found' }, { status: 404 });
    }
    return NextResponse.json({ procurement });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch procurement' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // ✅ Await
    const body = await request.json();
    const { items, notes, status } = body;

    await prisma.$transaction([
      prisma.procurementItem.deleteMany({ where: { procurementId: id } }),
      prisma.procurement.update({
        where: { id },
        data: {
          notes,
          status,
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
      }),
    ]);

    const updated = await prisma.procurement.findUnique({
      where: { id },
      include: { items: true },
    });
    return NextResponse.json({ procurement: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update procurement' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // ✅ Await
    await prisma.procurement.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete procurement' }, { status: 500 });
  }
}