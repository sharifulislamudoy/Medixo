"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface ReturnedItem {
  productName: string;
  productImage: string;
  totalReturned: number;
  totalValue: number;
}

interface Props {
  assignedTotal: number;
  collectedTotal: number;
  returnedTotal: number;
  returnedItems: ReturnedItem[];
}

export default function CashSummaryClient({
  assignedTotal,
  collectedTotal,
  returnedTotal,
  returnedItems,
}: Props) {
  const formatCurrency = (amount: number) => `৳${amount.toFixed(2)}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-6 max-w-6xl mx-auto"
    >
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Today's Cash Summary
      </h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Assigned Card */}
        <div className="bg-white rounded-xl shadow p-6 border-l-4 border-blue-500">
          <p className="text-sm font-medium text-gray-500 uppercase">
            Assigned Today
          </p>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            {formatCurrency(assignedTotal)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            SHIPPED orders you are carrying
          </p>
        </div>

        {/* Collected Card */}
        <div className="bg-white rounded-xl shadow p-6 border-l-4 border-green-500">
          <p className="text-sm font-medium text-gray-500 uppercase">
            Collected Today
          </p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {formatCurrency(collectedTotal)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Cash received from PAID deliveries (after returns)
          </p>
        </div>

        {/* Returned Card */}
        <div className="bg-white rounded-xl shadow p-6 border-l-4 border-orange-500">
          <p className="text-sm font-medium text-gray-500 uppercase">
            Returned Today
          </p>
          <p className="text-3xl font-bold text-orange-600 mt-2">
            {formatCurrency(returnedTotal)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Value of items returned (all statuses)
          </p>
        </div>
      </div>

      {/* Returned Items Summary */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Returned Items Details
        </h2>
        {returnedItems.length === 0 ? (
          <p className="text-gray-500">No items returned today.</p>
        ) : (
          <div className="space-y-4">
            {returnedItems.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
              >
                <div className="relative w-12 h-12 flex-shrink-0">
                  <Image
                    src={item.productImage}
                    alt={item.productName}
                    fill
                    className="object-contain rounded"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">
                    {item.productName}
                  </p>
                  <p className="text-sm text-gray-500">
                    Returned: {item.totalReturned}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-orange-600">
                    {formatCurrency(item.totalValue)}
                  </p>
                </div>
              </div>
            ))}
            <div className="border-t pt-4 flex justify-between font-bold">
              <span>Total Returned Value</span>
              <span className="text-orange-600">
                {formatCurrency(returnedTotal)}
              </span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}