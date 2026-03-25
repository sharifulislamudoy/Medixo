// app/api/notifications/unregister/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { pushToken: null },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to unregister token', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}