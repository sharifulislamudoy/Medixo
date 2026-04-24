// app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { items, totalPrice } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 });
    }

    // Fetch site settings
    const settings = await prisma.siteSettings.findFirst();
    const cutoffHour = settings?.dailyCutoffHour ?? 11;
    const cutoffMinute = settings?.dailyCutoffMinute ?? 0;
    const minFirstOrder = settings?.minFirstOrderAmount ?? 0;

    // Check orders‑off period
    const now = new Date();
    if (settings?.orderOffStart && settings?.orderOffEnd) {
      if (now >= settings.orderOffStart && now <= settings.orderOffEnd) {
        return NextResponse.json(
          { error: 'Orders are currently off. Please try again later.' },
          { status: 403 }
        );
      }
    }

    // Compute today's cutoff DateTime
    const todayCutoff = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      cutoffHour,
      cutoffMinute,
      0,
      0
    );

    // Determine if this order is placed after cutoff
    const isAfterCutoff = now > todayCutoff;

    // Fetch user details
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        shopName: true,
        address: true,
        phone: true,
        area: {
          include: { deliveryCode: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // -------------------------------
    // First‑order‑after‑cutoff check
    // -------------------------------
    if (isAfterCutoff && minFirstOrder > 0) {
      const ordersAfterCutoff = await prisma.order.count({
        where: {
          userId: session.user.id,
          orderDate: { gte: todayCutoff },
        },
      });

      if (ordersAfterCutoff === 0 && totalPrice < minFirstOrder) {
        return NextResponse.json(
          {
            error: `The first order placed after the daily cutoff must be at least ৳${minFirstOrder.toFixed(2)}. Please add more items or come back later.`,
          },
          { status: 400 }
        );
      }
    }

    // -------------------------------
    // Validate products & calculate total
    // -------------------------------
    const productIds = items.map((i: any) => i.id);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });
    const productMap = new Map(products.map(p => [p.id, p]));

    let calculatedTotal = 0;
    const orderItemsData = items.map((item: any) => {
      const product = productMap.get(item.id);
      if (!product) throw new Error(`Product ${item.id} not found`);
      if (!product.status || !product.availability) {
        throw new Error(`Product ${product.name} is not available`);
      }
      const price = product.sellPrice;
      calculatedTotal += price * item.quantity;
      return {
        productId: item.id,
        quantity: item.quantity,
        price,
      };
    });

    if (Math.abs(calculatedTotal - totalPrice) > 0.01) {
      return NextResponse.json({ error: 'Total price mismatch' }, { status: 400 });
    }

    // -------------------------------
    // Invoice number generation
    // -------------------------------
    const lastOrder = await prisma.order.findFirst({
      orderBy: { invoiceNo: 'desc' },
      select: { invoiceNo: true },
    });
    let nextInvoiceNumber = 1;
    if (lastOrder) {
      const lastNum = parseInt(lastOrder.invoiceNo, 10);
      if (!isNaN(lastNum)) nextInvoiceNumber = lastNum + 1;
    }
    const invoiceNo = nextInvoiceNumber.toString().padStart(4, '0');

    // -------------------------------
    // Delivery date calculation
    // -------------------------------
    let deliveryDate: Date;
    if (isAfterCutoff) {
      // After cutoff → next day delivery
      deliveryDate = new Date(now);
      deliveryDate.setDate(now.getDate() + 1);
    } else {
      deliveryDate = new Date(now);
    }
    deliveryDate.setHours(23, 59, 59, 999);

    const deliveryCodeId = user.area?.deliveryCode?.id || null;

    // -------------------------------
    // Create order & update stock
    // -------------------------------
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          invoiceNo,
          customerName: user.name,
          customerShopName: user.shopName,
          customerAddress: user.address,
          customerPhone: user.phone,
          deliveryDate,
          totalAmount: calculatedTotal,
          userId: session.user.id,
          deliveryCodeId,
          items: {
            create: orderItemsData,
          },
        },
      });

      for (const item of items) {
        await tx.stock.upsert({
          where: { productId: item.id },
          update: { quantity: { decrement: item.quantity } },
          create: { productId: item.id, quantity: -item.quantity },
        });
      }

      return newOrder;
    });

    return NextResponse.json(
      {
        orderId: order.id,
        invoiceNo: order.invoiceNo,
        trCode: user.area?.trCode || null,
        deliveryCode: user.area?.deliveryCode?.code || null,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Order creation error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}