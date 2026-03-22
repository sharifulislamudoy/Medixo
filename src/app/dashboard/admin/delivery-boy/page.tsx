"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

interface DeliveryBoyEarning {
  userId: string;
  name: string;
  vehicle: string;
  deliveryCode: string;
  totalDeliveredValue: number;
  deliveryCount: number;
  perDeliveryBonus: number;
  baseSalary: number;
  thresholdBonus: number;
  totalEarnings: number;
}

export default function AdminDeliveryBoyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [results, setResults] = useState<DeliveryBoyEarning[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [currentMonth, setCurrentMonth] = useState(selectedMonth);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && session?.user.role !== "ADMIN") {
      router.push("/");
    }
    if (status === "authenticated") fetchData();
  }, [status, session, selectedMonth]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/delivery-boy/earnings?month=${selectedMonth}`
      );
      if (!res.ok) throw new Error("Failed to fetch earnings");
      const data = await res.json();
      setResults(data.results);
      setCurrentMonth(data.month);
    } catch (error) {
      toast.error("Failed to load earnings");
    } finally {
      setLoading(false);
    }
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedMonth(e.target.value);
  };

  const totalEarningsSum = results.reduce(
    (sum, b) => sum + b.totalEarnings,
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-800">
          Delivery Boy Earnings
        </h1>
        <div className="flex items-center gap-3">
          <label className="text-gray-700 font-medium">Month:</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={handleMonthChange}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#0F9D8F] outline-none text-black"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0F9D8F]"></div>
        </div>
      ) : (
        <>
          {/* Summary Card */}
          <div className="bg-white rounded-xl shadow p-4">
            <p className="text-sm text-gray-500">
              Report for <span className="font-semibold">{currentMonth}</span>
            </p>
            <p className="text-2xl font-bold text-[#0F9D8F]">
              Total Payout: ৳{totalEarningsSum.toFixed(2)}
            </p>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Delivery Boy
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Delivery Code
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Vehicle
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Total Delivered (৳)
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Deliveries
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Per‑Delivery Bonus
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Base Salary
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Threshold Bonus
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Total Earnings
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {results.map((boy) => (
                    <motion.tr
                      key={boy.userId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {boy.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {boy.deliveryCode}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {boy.vehicle}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        ৳{boy.totalDeliveredValue.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        {boy.deliveryCount}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        ৳{boy.perDeliveryBonus.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        ৳{boy.baseSalary.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        ৳{boy.thresholdBonus.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-right text-[#0F9D8F]">
                        ৳{boy.totalEarnings.toFixed(2)}
                      </td>
                    </motion.tr>
                  ))}
                  {results.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-center py-8 text-gray-500">
                        No delivery boys found or no deliveries in this month.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}