import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { phone, password } = await request.json();
  if (!phone || !password) {
    return NextResponse.json(
      { error: "Phone and password are required" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // Delete ALL sessions for this user
  await prisma.session.deleteMany({ where: { userId: user.id } });

  return NextResponse.json({ success: true });
}