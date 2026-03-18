import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import LeaderboardClient from "@/components/deliveryboy/LeaderboardClient";


export default async function DeliveryBoyLeaderboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  // Get all delivery boys with their delivery code
  const deliveryBoys = await prisma.user.findMany({
    where: { role: "DELIVERY_BOY" },
    select: {
      id: true,
      name: true,
      deliveryCode: {
        select: {
          id: true,
          code: true,
        },
      },
    },
  });

  // Get aggregated stats per delivery code for DELIVERED orders
  const statsByCode = await prisma.order.groupBy({
    by: ["deliveryCodeId"],
    where: {
      status: "DELIVERED",
      deliveryCodeId: { not: null },
    },
    _count: { id: true },
    _sum: { totalAmount: true },
  });

  // Build a map for quick lookup: deliveryCodeId -> { count, total }
  const statsMap = new Map();
  statsByCode.forEach((stat) => {
    statsMap.set(stat.deliveryCodeId, {
      orderCount: stat._count.id,
      totalAmount: stat._sum.totalAmount || 0,
    });
  });

  // Combine boy info with stats
  const leaderboard = deliveryBoys.map((boy) => {
    const codeId = boy.deliveryCode?.id;
    const stats = codeId ? statsMap.get(codeId) : null;
    return {
      name: boy.name,
      code: boy.deliveryCode?.code || "—",
      orderCount: stats?.orderCount || 0,
      totalAmount: stats?.totalAmount || 0,
    };
  });

  // Sort by orderCount descending for initial display
  leaderboard.sort((a, b) => b.orderCount - a.orderCount);

  return <LeaderboardClient initialData={leaderboard} />;
}