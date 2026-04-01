import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ResetStoreButton from "@/components/admin/ResetStoreButton";
import SetCutoffTimeButton from "@/components/admin/SetCutoffTimeButton";
import DispatchButton from "@/components/admin/DispatchButton";

export default async function AdminDashboardHome() {
  const session = await getServerSession(authOptions);


  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-red-600">Unauthorized</h1>
        <p className="text-gray-600 mt-2">You do not have access to this page.</p>
      </div>
    );
  }

  const [totalUsers, pendingUsers, processingOrders] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: "PENDING" } }),
    prisma.order.count({ where: { status: "PROCESSING" } }),
  ]);

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Welcome back, {session.user.name}!
          </h1>
          <p className="text-gray-500 mt-1">
            Here's what's happening with your platform today.
          </p>
        </div>
        <div className="flex gap-5">
          <ResetStoreButton />
          <SetCutoffTimeButton />
          <DispatchButton processingCount={processingOrders} />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Users"
          value={totalUsers}
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
          color="from-blue-500 to-blue-600"
        />
        <StatCard
          title="Pending Approvals"
          value={pendingUsers}
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="from-yellow-500 to-yellow-600"
        />
        <StatCard
          title="Processing Orders"
          value={processingOrders}
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          }
          color="from-purple-500 to-purple-600"
        />
      </div>

      {/* Recent Activity Placeholder */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          <ActivityItem message="New user registration pending approval" time="5 minutes ago" />
          <ActivityItem message="Order #1234 has been placed" time="2 hours ago" />
          <ActivityItem message="Product 'Paracetamol' stock updated" time="1 day ago" />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
      <div className={`p-3 rounded-full bg-gradient-to-br ${color} text-white`}>{icon}</div>
    </div>
  );
}

function ActivityItem({ message, time }: { message: string; time: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <p className="text-gray-700">{message}</p>
      <span className="text-sm text-gray-400">{time}</span>
    </div>
  );
}