"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LeaderboardEntry {
  name: string;
  code: string;
  orderCount: number;
  totalAmount: number;
}

interface Props {
  initialData: LeaderboardEntry[];
}

type SortBy = "orders" | "amount";

export default function LeaderboardClient({ initialData }: Props) {
  const [sortBy, setSortBy] = useState<SortBy>("orders");

  const sortedData = [...initialData].sort((a, b) => {
    if (sortBy === "orders") {
      return b.orderCount - a.orderCount;
    } else {
      return b.totalAmount - a.totalAmount;
    }
  });

  const formatCurrency = (amount: number) => `৳${amount.toFixed(2)}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-6 max-w-4xl mx-auto"
    >
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Leaderboard
      </h1>

      {/* Toggle Buttons */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setSortBy("orders")}
          className={`px-6 py-2 rounded-full font-medium transition ${
            sortBy === "orders"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Top by Orders
        </button>
        <button
          onClick={() => setSortBy("amount")}
          className={`px-6 py-2 rounded-full font-medium transition ${
            sortBy === "amount"
              ? "bg-green-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Top by Amount
        </button>
      </div>

      {/* Leaderboard List */}
      <div className="space-y-3">
        <AnimatePresence mode="wait">
          {sortedData.map((entry, index) => (
            <motion.div
              key={entry.code + sortBy} // re‑animate when sort changes
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.03 }}
              className="bg-white rounded-xl shadow p-4 flex items-center gap-4 border-l-4"
              style={{
                borderLeftColor:
                  index === 0
                    ? "#FFD700"
                    : index === 1
                    ? "#C0C0C0"
                    : index === 2
                    ? "#CD7F32"
                    : "#E5E7EB",
              }}
            >
              {/* Rank */}
              <div className="w-8 text-center font-bold text-lg text-gray-600">
                #{index + 1}
              </div>

              {/* Info */}
              <div className="flex-1">
                <p className="font-semibold text-gray-800">{entry.name}</p>
                <p className="text-sm text-gray-500">Code: {entry.code}</p>
              </div>

              {/* Stats */}
              <div className="text-right">
                {sortBy === "orders" ? (
                  <>
                    <p className="text-xl font-bold text-blue-600">
                      {entry.orderCount}
                    </p>
                    <p className="text-xs text-gray-500">orders</p>
                  </>
                ) : (
                  <>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(entry.totalAmount)}
                    </p>
                    <p className="text-xs text-gray-500">total</p>
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {sortedData.length === 0 && (
        <p className="text-gray-500">No delivery data available.</p>
      )}
    </motion.div>
  );
}