"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  returnedQuantity: number;
  missingQuantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    image: string;
    sellPrice: number;
  };
}

interface Order {
  id: string;
  invoiceNo: string;
  items: OrderItem[];
}

interface Props {
  order: Order;
}

export default function MissingClient({ order }: Props) {
  const router = useRouter();
  const [missingQuantities, setMissingQuantities] = useState<Record<string, number>>(
    Object.fromEntries(order.items.map((item) => [item.productId, 0]))
  );
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const maxMissing = (item: OrderItem) =>
    item.quantity - item.returnedQuantity - item.missingQuantity;

  const updateQuantity = (productId: string, delta: number) => {
    setMissingQuantities((prev) => {
      const current = prev[productId] || 0;
      const item = order.items.find((i) => i.productId === productId)!;
      const max = maxMissing(item);
      const newVal = Math.min(max, Math.max(0, current + delta));
      return { ...prev, [productId]: newVal };
    });
  };

  const anyMissing = Object.values(missingQuantities).some((q) => q > 0);
  const totalMissingValue = order.items.reduce(
    (sum, item) => sum + (missingQuantities[item.productId] || 0) * item.price,
    0
  );

  const handleRecordMissing = async () => {
    const itemsToMark = Object.entries(missingQuantities)
      .filter(([_, qty]) => qty > 0)
      .map(([productId, missingQuantity]) => ({ productId, missingQuantity }));

    if (itemsToMark.length === 0) {
      toast.error("No missing items selected");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/deliveryboy/orders/${order.id}/deliver-with-missing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: itemsToMark }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to record missing items");
      toast.success("Missing items recorded successfully");
      router.push("/orders");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  return (
    <>
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 sm:gap-2 text-[#0F9D8F] hover:underline mb-3 sm:mb-4 text-sm sm:text-base"
      >
        <ArrowLeft size={18} /> Back to orders
      </button>

      <div className="bg-white rounded-xl shadow p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <h1 className="text-lg sm:text-2xl font-bold text-gray-800">
            Missing Items – Order #{order.invoiceNo}
          </h1>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {order.items.map((item) => {
            const maxQty = maxMissing(item);
            const currentQty = missingQuantities[item.productId] || 0;
            return (
              <div
                key={item.id}
                className="flex flex-wrap sm:flex-nowrap items-center gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <div className="relative w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0">
                  <Image
                    src={item.product.image}
                    alt={item.product.name}
                    fill
                    className="object-contain rounded"
                  />
                </div>

                <div className="flex-1 min-w-[160px]">
                  <p className="font-medium text-gray-800 text-sm sm:text-base">
                    {item.product.name}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500">
                    Qty: {item.quantity} | Returned: {item.returnedQuantity} | Missing: {item.missingQuantity}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500">৳{item.price}</p>
                </div>

                <div className="flex items-center gap-1 sm:gap-2 ml-auto">
                  <button
                    onClick={() => updateQuantity(item.productId, -1)}
                    disabled={currentQty === 0}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  >
                    –
                  </button>
                  <span className="w-8 sm:w-12 text-center text-black font-medium text-sm sm:text-base">
                    {currentQty}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.productId, 1)}
                    disabled={currentQty >= maxQty}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  >
                    +
                  </button>
                </div>
                <div className="text-right w-16 sm:w-24">
                  <p className="font-semibold text-[#0F9D8F] text-sm sm:text-base">
                    ৳{(currentQty * item.price).toFixed(2)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {anyMissing && (
          <div className="border-t mt-4 sm:mt-6 pt-3 sm:pt-4 flex justify-between items-center font-bold text-base sm:text-lg">
            <span className="text-gray-800">Total Missing Value</span>
            <span className="text-[#0F9D8F]">৳{totalMissingValue.toFixed(2)}</span>
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 mt-4 sm:mt-6">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 sm:px-6 sm:py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm sm:text-base"
          >
            Cancel
          </button>
          <button
            onClick={() => setShowConfirm(true)}
            disabled={loading || !anyMissing}
            className="flex items-center justify-center gap-2 px-4 py-2 sm:px-6 sm:py-2 bg-[#0F9D8F] text-white rounded-lg hover:bg-[#0c7d72] disabled:opacity-50 text-sm sm:text-base"
          >
            <AlertTriangle size={18} />
            Record Missing
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => !loading && setShowConfirm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-5 sm:p-6 z-50 max-w-md w-full mx-4"
            >
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">
                Confirm Missing Items
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4">
                Record missing items for order <span className="font-semibold">{order.invoiceNo}</span>.
                The order will remain in <strong>SHIPPED</strong> status and you can deliver it later.
              </p>
              {anyMissing && (
                <p className="text-sm text-gray-600 mb-4">
                  Missing value: <span className="font-bold">৳{totalMissingValue.toFixed(2)}</span>
                </p>
              )}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  disabled={loading}
                  className="px-4 py-2 sm:flex-1 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRecordMissing}
                  disabled={loading}
                  className="px-4 py-2 sm:flex-1 bg-[#0F9D8F] text-white rounded-lg hover:bg-[#0c7d72] disabled:opacity-50 text-sm sm:text-base"
                >
                  {loading ? "Recording..." : "Confirm"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}