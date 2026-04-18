import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'SUPPLIER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supplierId = session.user.id;

  try {
    const procurements = await prisma.procurement.findMany({
      where: { status: true },
      include: {
        items: {
          where: {
            assignments: {
              some: { supplierId }
            }
          },
          include: {
            product: {
              select: { name: true, sku: true, image: true }
            },
            assignments: {
              where: { supplierId },
              select: { quantity: true, costPrice: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Remove procurements with no items assigned to this supplier
    const filtered = procurements.filter(p => p.items.length > 0);

    return NextResponse.json({ procurements: filtered });
  } catch (error) {
    console.error('Supplier orders error:', error);
    return NextResponse.json({ error: 'Failed to fetch assigned orders' }, { status: 500 });
  }
}