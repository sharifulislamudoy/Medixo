"use client";

import { motion } from "framer-motion";

interface HistoryItem {
  date: string;
  deliveredCount: number;
  deliveredAmount: number;
  returnedAmount: number;
}

interface Props {
  history: HistoryItem[];
}

export default function HistoryClient({ history }: Props) {
  const formatCurrency = (amount: number) => `৳${amount.toFixed(2)}`;
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-BD", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-6 max-w-4xl mx-auto"
    >
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Delivery History
      </h1>

      {history.length === 0 ? (
        <p className="text-gray-500">No history available.</p>
      ) : (
        <div className="space-y-4">
          {history.map((item, idx) => (
            <motion.div
              key={item.date}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white rounded-xl shadow p-6 border-l-4 border-blue-500"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    {formatDate(item.date)}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {item.deliveredCount} order
                    {item.deliveredCount !== 1 ? "s" : ""} delivered
                  </p>
                </div>
                <div className="mt-4 md:mt-0 flex flex-col md:flex-row gap-6">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Delivered Amount</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(item.deliveredAmount)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Returned Amount</p>
                    <p className="text-xl font-bold text-orange-600">
                      {formatCurrency(item.returnedAmount)}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}