// app/api/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const settings = await prisma.siteSettings.findFirst();
  return NextResponse.json(settings || {
    dailyCutoffHour: 11,
    dailyCutoffMinute: 0,
    minFirstOrderAmount: 0,
    orderOffStart: null,
    orderOffEnd: null,
  });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { dailyCutoffHour, dailyCutoffMinute, minFirstOrderAmount, orderOffStart, orderOffEnd } = body;

  // Upsert the single settings row
  const existing = await prisma.siteSettings.findFirst();
  let settings;
  if (existing) {
    settings = await prisma.siteSettings.update({
      where: { id: existing.id },
      data: {
        dailyCutoffHour: dailyCutoffHour ?? existing.dailyCutoffHour,
        dailyCutoffMinute: dailyCutoffMinute ?? existing.dailyCutoffMinute,
        minFirstOrderAmount: minFirstOrderAmount ?? existing.minFirstOrderAmount,
        orderOffStart: orderOffStart !== undefined ? new Date(orderOffStart) : existing.orderOffStart,
        orderOffEnd: orderOffEnd !== undefined ? new Date(orderOffEnd) : existing.orderOffEnd,
      },
    });
  } else {
    settings = await prisma.siteSettings.create({
      data: {
        dailyCutoffHour: dailyCutoffHour ?? 11,
        dailyCutoffMinute: dailyCutoffMinute ?? 0,
        minFirstOrderAmount: minFirstOrderAmount ?? 0,
        orderOffStart: orderOffStart ? new Date(orderOffStart) : null,
        orderOffEnd: orderOffEnd ? new Date(orderOffEnd) : null,
      },
    });
  }

  return NextResponse.json(settings);
}