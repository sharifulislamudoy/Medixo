// app/api/notifications/register/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { token } = await req.json();
  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  }

  try {
    // Save token to user
    await prisma.user.update({
      where: { id: session.user.id },
      data: { pushToken: token },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save token', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}