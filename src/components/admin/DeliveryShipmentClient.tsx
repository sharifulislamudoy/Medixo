"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface DeliveryStat {
  deliveryCode: string;
  boys: string[];
  assignedOrders: number;
  targetAmount: number;
  deliveredAmount: number;
  dueAmount: number;
  returnedAmount: number;
}

export default function DeliveryShipmentClient() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [stats, setStats] = useState<DeliveryStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [selectedDate]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const dateStr = selectedDate.toISOString().split("T")[0];
      const res = await fetch(`/api/admin/delivery-shipment?date=${dateStr}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => `৳${amount.toFixed(2)}`;

  const totalTarget = stats.reduce((sum, s) => sum + s.targetAmount, 0);
  const totalDelivered = stats.reduce((sum, s) => sum + s.deliveredAmount, 0);
  const totalDue = stats.reduce((sum, s) => sum + s.dueAmount, 0);
  const totalReturned = stats.reduce((sum, s) => sum + s.returnedAmount, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-6"
    >
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Delivery Shipment Summary
      </h1>

      {/* Date Picker */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Select Date</label>
        <DatePicker
          selected={selectedDate}
          onChange={(date: Date | null) => date && setSelectedDate(date)}
          dateFormat="yyyy-MM-dd"
          className="border text-gray-600 border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#0F9D8F] focus:border-[#0F9D8F] outline-none"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow p-6 border-l-4 border-blue-500">
          <p className="text-sm font-medium text-gray-500 uppercase">Current Target</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            {formatCurrency(totalTarget)}
          </p>
          <p className="text-xs text-gray-400 mt-1">All SHIPPED orders</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6 border-l-4 border-green-500">
          <p className="text-sm font-medium text-gray-500 uppercase">Delivered</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {formatCurrency(totalDelivered)}
          </p>
          <p className="text-xs text-gray-400 mt-1">on selected date</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6 border-l-4 border-orange-500">
          <p className="text-sm font-medium text-gray-500 uppercase">Due</p>
          <p className="text-3xl font-bold text-orange-600 mt-2">
            {formatCurrency(totalDue)}
          </p>
          <p className="text-xs text-gray-400 mt-1">from deliveries on selected date</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6 border-l-4 border-red-500">
          <p className="text-sm font-medium text-gray-500 uppercase">Returned</p>
          <p className="text-3xl font-bold text-red-600 mt-2">
            {formatCurrency(totalReturned)}
          </p>
          <p className="text-xs text-gray-400 mt-1">on selected date</p>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0F9D8F]"></div>
        </div>
      ) : stats.length === 0 ? (
        <p className="text-gray-500">No data for this date.</p>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase">
                  Delivery Code
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase">
                  Assigned Boys
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase">
                  Orders
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase">
                  Target (৳)
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase">
                  Delivered (৳)
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase">
                  Due (৳)
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase">
                  Returned (৳)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {stats.map((stat, idx) => (
                <motion.tr
                  key={stat.deliveryCode}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {stat.deliveryCode}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {stat.boys.join(", ")}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">{stat.assignedOrders}</td>
                  <td className="px-4 py-3 text-blue-600 font-medium">
                    {formatCurrency(stat.targetAmount)}
                  </td>
                  <td className="px-4 py-3 text-green-600 font-medium">
                    {formatCurrency(stat.deliveredAmount)}
                  </td>
                  <td className="px-4 py-3 text-orange-600 font-medium">
                    {formatCurrency(stat.dueAmount)}
                  </td>
                  <td className="px-4 py-3 text-red-600 font-medium">
                    {formatCurrency(stat.returnedAmount)}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}