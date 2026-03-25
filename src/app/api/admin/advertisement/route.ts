import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendNotificationToAllUsers } from "@/lib/send-notification";

// GET all advertisements (Admin only)
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ads = await prisma.advertisement.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(ads);
}

// CREATE advertisement
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { title, imageUrl, category, hyperlink, isVisible } = body;

  if (!title || !imageUrl || !category) {
    return NextResponse.json(
      { error: "Required fields missing" },
      { status: 400 }
    );
  }

  const ad = await prisma.advertisement.create({
    data: {
      title,
      imageUrl,
      category,
      hyperlink,
      isVisible,
    },
  });

  // Send push notification to all users
  await sendNotificationToAllUsers(
    "New Advertisement",
    `Check out: ${title}`,
    { adId: ad.id, category } // optional data
  );

  return NextResponse.json(ad);
}