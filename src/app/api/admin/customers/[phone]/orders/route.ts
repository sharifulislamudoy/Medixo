import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ phone: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { phone } = await params;

    // Get all orders for this phone number
    const orders = await prisma.order.findMany({
      where: { customerPhone: phone },
      orderBy: { orderDate: 'desc' },
      select: {
        id: true,
        invoiceNo: true,
        orderDate: true,
        totalAmount: true,
        paymentStatus: true,
        status: true,
      },
    });

    // Also get the latest customer info from the most recent order (or first)
    const customerInfo = await prisma.order.findFirst({
      where: { customerPhone: phone },
      select: {
        customerName: true,
        customerShopName: true,
        customerAddress: true,
        customerPhone: true,
      },
      orderBy: { orderDate: 'desc' },
    });

    return NextResponse.json({
      customer: customerInfo,
      orders,
    });
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}