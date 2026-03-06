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

    const { items, totalPrice } = await req.json(); // items: { id, quantity }[]

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 });
    }

    // Fetch user details
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, shopName: true, address: true, phone: true },
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch products with stock (still need product data for price)
    const productIds = items.map(i => i.id);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { stock: true },
    });

    const productMap = new Map(products.map(p => [p.id, p]));

    // Validate that all products exist and are available (status/availability)
    for (const item of items) {
      const product = productMap.get(item.id);
      if (!product) {
        return NextResponse.json({ error: `Product ${item.id} not found` }, { status: 400 });
      }
      if (!product.status || !product.availability) {
        return NextResponse.json({ error: `Product ${product.name} is not available` }, { status: 400 });
      }
      // ❌ STOCK CHECK REMOVED – order allowed even if insufficient stock
    }

    // Calculate total from products (use sellPrice)
    let calculatedTotal = 0;
    const orderItemsData = items.map(item => {
      const product = productMap.get(item.id)!;
      const price = product.sellPrice;
      calculatedTotal += price * item.quantity;
      return {
        productId: item.id,
        quantity: item.quantity,
        price,
      };
    });

    // Verify totalPrice matches (allow small rounding difference)
    if (Math.abs(calculatedTotal - totalPrice) > 0.01) {
      return NextResponse.json({ error: 'Total price mismatch' }, { status: 400 });
    }

    // Generate invoice number
    const lastOrder = await prisma.order.findFirst({
      orderBy: { invoiceNo: 'desc' },
      select: { invoiceNo: true },
    });
    let nextInvoiceNumber = 1;
    if (lastOrder) {
      const lastNum = parseInt(lastOrder.invoiceNo, 10);
      if (!isNaN(lastNum)) {
        nextInvoiceNumber = lastNum + 1;
      }
    }
    const invoiceNo = nextInvoiceNumber.toString().padStart(4, '0');

    // Compute delivery date
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    let deliveryDate: Date;
    if (currentHour > 11 || (currentHour === 11 && currentMinute > 0)) {
      deliveryDate = new Date(now);
      deliveryDate.setDate(now.getDate() + 1);
    } else {
      deliveryDate = new Date(now);
    }
    deliveryDate.setHours(23, 59, 59, 999);

    // Create order and items, update stock in a transaction
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
          items: {
            create: orderItemsData,
          },
        },
      });

      // Update stock for each product (allow negative)
      for (const item of items) {
        await tx.stock.update({
          where: { productId: item.id },
          data: { quantity: { decrement: item.quantity } },
        });
      }

      return newOrder;
    });

    return NextResponse.json({ orderId: order.id, invoiceNo: order.invoiceNo }, { status: 201 });
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}