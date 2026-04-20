import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'SUPPLIER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supplierId = session.user.id;

    const procurements = await prisma.procurement.findMany({
      where: {
        status: true,
        items: {
          some: {
            bidding: true,
          },
        },
      },
      include: {
        items: {
          where: { bidding: true },
          include: {
            product: {
              select: { name: true, sku: true, image: true },
            },
            assignments: {
              where: { supplierId },
              select: { quantity: true, costPrice: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform response
    const transformed = procurements.map((proc) => ({
      id: proc.id,
      prNumber: proc.prNumber,
      createdAt: proc.createdAt.toISOString(),
      status: proc.status,
      items: proc.items.map((item) => ({
        id: item.id,
        product: item.product,
        requiredQuantity: item.requiredQuantity,
        bidding: item.bidding,
        assignments: item.assignments,
      })),
    }));

    return NextResponse.json({ procurements: transformed });
  } catch (error) {
    console.error('Supplier bidding GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch bidding items' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'SUPPLIER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supplierId = session.user.id;
    const body = await request.json();
    const { procurementItemId, quantity, costPrice } = body;

    if (!procurementItemId || typeof quantity !== 'number' || typeof costPrice !== 'number') {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (quantity <= 0 || costPrice <= 0) {
      return NextResponse.json({ error: 'Quantity and cost price must be positive' }, { status: 400 });
    }

    // Verify procurement item exists, procurement is active, and bidding is true
    const procurementItem = await prisma.procurementItem.findUnique({
      where: { id: procurementItemId },
      include: { procurement: true },
    });

    if (!procurementItem) {
      return NextResponse.json({ error: 'Procurement item not found' }, { status: 404 });
    }

    if (!procurementItem.procurement.status) {
      return NextResponse.json({ error: 'Procurement is not active' }, { status: 400 });
    }

    if (!procurementItem.bidding) {
      return NextResponse.json({ error: 'Bidding is closed for this item' }, { status: 400 });
    }

    const assignment = await prisma.procurementAssignment.upsert({
      where: {
        procurementItemId_supplierId: {
          procurementItemId,
          supplierId,
        },
      },
      update: {
        quantity,
        costPrice,
      },
      create: {
        procurementItemId,
        supplierId,
        quantity,
        costPrice,
      },
    });

    return NextResponse.json({ success: true, assignment });
  } catch (error) {
    console.error('Supplier bidding POST error:', error);
    return NextResponse.json({ error: 'Failed to submit bid' }, { status: 500 });
  }
}