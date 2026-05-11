import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Safe JSON parse – handle empty body gracefully
    let page: string | undefined;
    try {
      const body = await req.json();
      page = body?.page;
    } catch {
      // Body is empty or invalid JSON – try reading from text
      const raw = await req.text();
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          page = parsed?.page;
        } catch {
          // ignore
        }
      }
    }

    if (!page || typeof page !== "string") {
      // Don't fail silently; just use a default
      page = "/";
    }

    await prisma.pageView.create({
      data: {
        userId: session.user.id,
        page,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Track error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}