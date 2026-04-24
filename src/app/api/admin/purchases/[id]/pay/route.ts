import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { amount } = body; // amount to add to paid

  if (!amount || isNaN(amount) || amount <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  try {
    const purchase = await prisma.purchase.findUnique({ where: { id } });
    if (!purchase) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const newPaid = purchase.paidAmount + parseFloat(amount);
    if (newPaid > purchase.totalAmount) {
      return NextResponse.json({ error: "Paid amount exceeds total" }, { status: 400 });
    }

    const status = newPaid >= purchase.totalAmount ? "PAID" : "PARTIAL_PAID";

    const updated = await prisma.purchase.update({
      where: { id },
      data: {
        paidAmount: newPaid,
        paymentStatus: status,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update payment" }, { status: 500 });
  }
}