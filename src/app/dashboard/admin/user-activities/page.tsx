// app/dashboard/admin/user-activities/page.tsx

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isRateChecker } from "@/lib/analyzeUser";
import UserActivitiesTable from "@/components/UserActivitiesTable";

export default async function AdminUserActivitiesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-red-600">Unauthorized</h1>
        <p className="text-gray-500 mt-2">You do not have access to this page.</p>
      </div>
    );
  }

  // শুধুমাত্র SHOP_OWNER রোলের ইউজার
  const users = await prisma.user.findMany({
    where: {
      role: "SHOP_OWNER",
      OR: [
        { orders: { some: {} } },
        { pageViews: { some: {} } },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      orders: {
        select: {
          status: true,
          totalAmount: true,
        },
      },
      pageViews: {
        select: {
          page: true,
          timestamp: true,
        },
        orderBy: { timestamp: "asc" },
      },
    },
  });

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  // প্রতিটি ইউজারের ডেটা প্রসেসিং (Groq ছাড়া)
  const processedUsers = users.map((user) => {
    const totalOrders = user.orders.length;
    const deliveredAmount = user.orders
      .filter((o) => o.status === "DELIVERED")
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const pageViews = user.pageViews;
    const todayViews = pageViews.filter(
      (pv) => pv.timestamp >= todayStart && pv.timestamp < todayEnd
    );

    // Top 5 pages for AI
    const pageCounter = new Map<string, number>();
    pageViews.forEach((pv) => pageCounter.set(pv.page, (pageCounter.get(pv.page) || 0) + 1));
    const sortedPages = [...pageCounter.entries()].sort((a, b) => b[1] - a[1]);
    const topPages = sortedPages.slice(0, 5).map(([page]) => page);
    const mostVisitedPage = topPages.length > 0 ? topPages[0] : "—";

    // সেশন তৈরি (30 min gap)
    const sessions: { start: Date; end: Date; pagesCount: number }[] = [];
    if (pageViews.length > 0) {
      const sorted = [...pageViews].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      let currentSession = {
        start: sorted[0].timestamp,
        end: sorted[0].timestamp,
        pagesCount: 1,
      };
      for (let i = 1; i < sorted.length; i++) {
        const diff = sorted[i].timestamp.getTime() - sorted[i - 1].timestamp.getTime();
        if (diff <= 30 * 60 * 1000) {
          currentSession.end = sorted[i].timestamp;
          currentSession.pagesCount++;
        } else {
          sessions.push({ ...currentSession });
          currentSession = {
            start: sorted[i].timestamp,
            end: sorted[i].timestamp,
            pagesCount: 1,
          };
        }
      }
      sessions.push(currentSession);
    }

    // আজকের অ্যাক্টিভ সময়
    let todayActiveMs = 0;
    sessions.forEach((s) => {
      if (s.end >= todayStart && s.start < todayEnd) {
        const overlapStart = s.start < todayStart ? todayStart : s.start;
        const overlapEnd = s.end > todayEnd ? todayEnd : s.end;
        todayActiveMs += overlapEnd.getTime() - overlapStart.getTime();
      }
    });
    const todayActiveMinutes = Math.round(todayActiveMs / 60000);
    const sessionsToday = sessions.filter(
      (s) => s.start >= todayStart && s.start < todayEnd
    ).length;

    // দৈনিক অ্যাক্টিভিটি (মোডালের জন্য)
    const dailyMap = new Map<string, { totalPages: number; totalTimeMs: number }>();
    pageViews.forEach((pv) => {
      const dateKey = pv.timestamp.toISOString().split("T")[0];
      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, { totalPages: 0, totalTimeMs: 0 });
      }
      dailyMap.get(dateKey)!.totalPages++;
    });
    sessions.forEach((s) => {
      const dateKey = s.start.toISOString().split("T")[0];
      if (dailyMap.has(dateKey)) {
        dailyMap.get(dateKey)!.totalTimeMs += s.end.getTime() - s.start.getTime();
      }
    });
    const dailyActivity = Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      pagesCount: data.totalPages,
      activeMinutes: Math.round(data.totalTimeMs / 60000),
    }));

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      totalOrders,
      deliveredAmount,
      totalPageViews: pageViews.length,
      todayPageViews: todayViews.length,
      mostVisitedPage,
      todayActiveMinutes,
      sessionsToday,
      dailyActivity,
      sessions,
      topPages,        // Groq এ পাঠানোর জন্য
    };
  });

  // 🔁 প্যারালাল Groq API কল (একসাথে সব ইউজারের জন্য)
  const suspiciousResults = await Promise.all(
    processedUsers.map((userData) =>
      isRateChecker({
        totalOrders: userData.totalOrders,
        totalPageViews: userData.totalPageViews,
        topPages: userData.topPages,
      })
    )
  );

  // final data ready
  const userActivities = processedUsers.map((userData, idx) => ({
    ...userData,
    suspicious: suspiciousResults[idx],  // true/false
    // topPages আর দরকার নেই, তাই সরিয়ে ফেলতে পারেন
    topPages: undefined,
  }));

  // সর্ট (আজকের পেজ ভিউ অনুসারে)
  userActivities.sort((a, b) => b.todayPageViews - a.todayPageViews);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">User Activities</h1>
        <p className="text-gray-500 mt-1">
          Today's activity summary for shop owners. Rate checkers are flagged in red.
        </p>
      </div>
      <UserActivitiesTable data={userActivities} />
    </div>
  );
}