"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

type Session = {
  start: Date;
  end: Date;
  pagesCount: number;
};

type DailyActivity = {
  date: string;
  pagesCount: number;
  activeMinutes: number;
};

type Activity = {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
  };
  totalOrders: number;
  deliveredAmount: number;
  totalPageViews: number;
  todayPageViews: number;
  mostVisitedPage: string;
  todayActiveMinutes: number;
  sessionsToday: number;
  suspicious: boolean;
  dailyActivity: DailyActivity[];
  sessions: Session[];
};

type Props = {
  data: Activity[];
};

const roleBadge: Record<string, string> = {
  ADMIN: "bg-purple-100 text-purple-800",
  SHOP_OWNER: "bg-blue-100 text-blue-800",
  DELIVERY_BOY: "bg-orange-100 text-orange-800",
  SUPPLIER: "bg-teal-100 text-teal-800",
};

export default function UserActivitiesTable({ data }: Props) {
  const [selectedUser, setSelectedUser] = useState<Activity | null>(null);
  const [modalMode, setModalMode] = useState<"sessions" | "daily">("daily");

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT" }).format(amount);

  const formatTime = (date: Date) =>
    date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const openModal = (user: Activity, mode: "daily" | "sessions") => {
    setSelectedUser(user);
    setModalMode(mode);
  };

  const closeModal = () => setSelectedUser(null);

  const renderRoutes = (routes: string) => {
    if (routes === "—") return "—";
    const firstRoute = routes.split(",")[0].trim();
    return (
      <Link
        href={firstRoute}
        className="text-[#156A98] hover:underline"
        target="_blank"
      >
        {firstRoute}
      </Link>
    );
  };

  return (
    <>
      {/* টেবিল */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Today Views</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Today Active</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Most Visited</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Orders</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Delivered Amt</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">View All</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((item) => (
                <tr
                  key={item.user.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div
                      className={`text-sm font-semibold ${
                        item.suspicious ? "text-red-600" : "text-gray-900"
                      }`}
                    >
                      {item.user.name}
                    </div>
                    <div className="text-xs text-gray-500">{item.user.email}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-700">
                    {item.todayPageViews}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-700">
                    {item.todayActiveMinutes} min
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 truncate max-w-[120px]">
                    {renderRoutes(item.mostVisitedPage)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-700">
                    {item.totalOrders}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-700">
                    {formatCurrency(item.deliveredAmount)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <button
                      onClick={() => openModal(item, "daily")}
                      className="text-sm font-medium text-[#156A98] hover:underline"
                    >
                      View All
                    </button>
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    No user activity data for today.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals with Framer Motion */}
      <AnimatePresence>
        {selectedUser && modalMode === "daily" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            key="modal-daily"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{selectedUser.user.name}</h3>
                    <p className="text-sm text-gray-500">{selectedUser.user.email}</p>
                  </div>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                  >
                    ×
                  </button>
                </div>

                <h4 className="font-semibold text-gray-800 mb-3">
                  Daily Activity ({selectedUser.dailyActivity.length} days)
                </h4>
                {selectedUser.dailyActivity.length === 0 ? (
                  <p className="text-sm text-gray-500">No recorded activity.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedUser.dailyActivity.map((day) => (
                      <div key={day.date} className="flex justify-between items-center border-b pb-2">
                        <span className="text-sm font-medium text-gray-700">
                          {formatDate(day.date)}
                        </span>
                        <div className="flex gap-6 text-sm text-gray-600">
                          <span>📄 {day.pagesCount} pages</span>
                          <span>⏱️ {day.activeMinutes} min</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={closeModal}
                  className="mt-4 px-4 py-2 bg-red-500 hover:bg-red-600 rounded text-sm"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {selectedUser && modalMode === "sessions" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            key="modal-sessions"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{selectedUser.user.name}</h3>
                    <p className="text-sm text-gray-500">{selectedUser.user.email}</p>
                  </div>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                  >
                    ×
                  </button>
                </div>

                <h4 className="font-semibold text-gray-800 mb-2">
                  Sessions ({selectedUser.sessions.length})
                </h4>
                {selectedUser.sessions.length === 0 ? (
                  <p className="text-sm text-gray-500">No recorded sessions.</p>
                ) : (
                  <div className="space-y-3">
                    {selectedUser.sessions.map((s, idx) => (
                      <div key={idx} className="border rounded-lg p-3 bg-gray-50">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-gray-700">
                            {formatTime(new Date(s.start))} → {formatTime(new Date(s.end))}
                          </span>
                          <span className="text-gray-600">
                            {s.pagesCount} page{s.pagesCount > 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Duration:{" "}
                          {Math.round(
                            (new Date(s.end).getTime() - new Date(s.start).getTime()) / 60000
                          )}{" "}
                          min
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={closeModal}
                  className="mt-4 px-4 py-2 bg-red-500 hover:bg-red-600 rounded text-sm"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}