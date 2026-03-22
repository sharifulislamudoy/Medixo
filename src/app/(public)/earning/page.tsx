"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

interface EarningData {
  month: string;
  name: string;
  vehicle: string | null;
  deliveryCode: string;
  totalDeliveredValue: number;
  deliveryCount: number;
  perDeliveryBonus: number;
  baseSalary: number;
  thresholdBonus: number;
  totalEarnings: number;
}

export default function DeliveryBoyEarningPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<EarningData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && session?.user.role !== "DELIVERY_BOY") {
      router.push("/");
    }
    if (status === "authenticated") fetchEarnings();
  }, [status, session, selectedMonth]);

  const fetchEarnings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/deliveryboy/earnings?month=${selectedMonth}`);
      if (!res.ok) throw new Error("Failed to fetch earnings");
      const json = await res.json();
      setData(json);
    } catch (error) {
      toast.error("Could not load your earnings");
    } finally {
      setLoading(false);
    }
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedMonth(e.target.value);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0F9D8F]"></div>
      </div>
    );
  }

  if (!data) {
    return <div className="text-center py-12 text-gray-500">No data available.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">My Earnings</h1>

      <div className="flex justify-end mb-4">
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg p-6 space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Delivery Info</h2>
            <p><span className="font-medium text-gray-600">Name:</span> <span className="text-gray-600">{data.name}</span></p>
            <p><span className="font-medium text-gray-600">Vehicle:</span> <span className="text-gray-600">{data.vehicle || "—"}</span></p>
            <p><span className="font-medium text-gray-600">Delivery Code:</span> <span className="text-gray-600">{data.deliveryCode}</span></p>
            <p><span className="font-medium text-gray-600">Month:</span> <span className="text-gray-600">{data.month}</span></p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Performance</h2>
            <p><span className="font-medium text-gray-600">Total Delivered Value:</span> <span className="text-gray-600">৳{data.totalDeliveredValue.toFixed(2)}</span></p>
            <p><span className="font-medium text-gray-600">Number of Deliveries:</span> <span className="text-gray-600">{data.deliveryCount}</span></p>
          </div>
        </div>

        <div className="border-t pt-4">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Earnings Breakdown</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Base Salary</span>
              <span className="font-medium text-gray-600">৳{data.baseSalary.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Per‑Delivery Bonus ({data.deliveryCount} × {data.vehicle === "bike" ? "10" : data.vehicle === "cycle" ? "5" : "0"})</span>
              <span className="font-medium text-gray-600">৳{data.perDeliveryBonus.toFixed(2)}</span>
            </div>
            {data.thresholdBonus > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Threshold Bonus (≥ 12,00,000 ৳)</span>
                <span className="font-bold">+ ৳{data.thresholdBonus.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span className="text-black">Total Earnings</span>
              <span className="text-[#0F9D8F]">৳{data.totalEarnings.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}