"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, RotateCcw, Truck, XCircle } from "lucide-react";
import toast from "react-hot-toast";

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  returnedQuantity: number;
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

export default function ReturnClient({ order }: Props) {
  const router = useRouter();
  const [returnQuantities, setReturnQuantities] = useState<Record<string, number>>(
    Object.fromEntries(order.items.map((item) => [item.productId, 0]))
  );
  const [loading, setLoading] = useState(false);
  const [showDeliverConfirm, setShowDeliverConfirm] = useState(false);
  const [showFullReturnConfirm, setShowFullReturnConfirm] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"DUE" | "PAID">("PAID");

  const maxReturnable = (item: OrderItem) => item.quantity - item.returnedQuantity;

  const updateQuantity = (productId: string, delta: number) => {
    setReturnQuantities((prev) => {
      const current = prev[productId] || 0;
      const item = order.items.find((i) => i.productId === productId)!;
      const max = maxReturnable(item);
      const newVal = Math.min(max, Math.max(0, current + delta));
      return { ...prev, [productId]: newVal };
    });
  };

  const anyReturn = Object.values(returnQuantities).some((q) => q > 0);
  const totalRefund = order.items.reduce(
    (sum, item) => sum + (returnQuantities[item.productId] || 0) * item.price,
    0
  );

  // Handle full return (without delivery)
  const handleFullReturn = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/deliveryboy/orders/${order.id}/full-return`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to process full return");
      toast.success("Order fully returned");
      router.push("/orders");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
      setShowFullReturnConfirm(false);
    }
  };

  // Handle partial return + delivery
  const handleDeliver = async () => {
    const itemsToReturn = Object.entries(returnQuantities)
      .filter(([_, qty]) => qty > 0)
      .map(([productId, returnedQuantity]) => ({ productId, returnedQuantity }));

    setLoading(true);
    try {
      const res = await fetch(`/api/deliveryboy/orders/${order.id}/deliver-with-return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus, items: itemsToReturn }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to deliver");
      toast.success("Order delivered successfully");
      router.push("/orders");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
      setShowDeliverConfirm(false);
    }
  };

  return (
    <>
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-[#0F9D8F] hover:underline mb-4"
      >
        <ArrowLeft size={18} /> Back to orders
      </button>

      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Return Items – Order #{order.invoiceNo}
          </h1>
          <button
            onClick={() => setShowFullReturnConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            <XCircle size={18} /> Full Return (no delivery)
          </button>
        </div>

        <div className="space-y-4">
          {order.items.map((item) => {
            const maxQty = maxReturnable(item);
            const currentQty = returnQuantities[item.productId] || 0;
            return (
              <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="relative w-16 h-16 flex-shrink-0">
                  <Image
                    src={item.product.image}
                    alt={item.product.name}
                    fill
                    className="object-contain rounded"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{item.product.name}</p>
                  <p className="text-sm text-gray-500">
                    Ordered: {item.quantity} | Already returned: {item.returnedQuantity}
                  </p>
                  <p className="text-sm text-gray-500">Price: ৳{item.price}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.productId, -1)}
                    disabled={currentQty === 0}
                    className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    –
                  </button>
                  <span className="w-12 text-center text-black font-medium">
                    {currentQty}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.productId, 1)}
                    disabled={currentQty >= maxQty}
                    className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>
                <div className="text-right w-24">
                  <p className="font-semibold text-[#0F9D8F]">
                    ৳{(currentQty * item.price).toFixed(2)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {anyReturn && (
          <div className="border-t mt-6 pt-4 flex justify-between items-center font-bold text-lg">
            <span className="text-gray-800">Total Refund</span>
            <span className="text-[#0F9D8F]">৳{totalRefund.toFixed(2)}</span>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => setShowDeliverConfirm(true)}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            <Truck size={18} />
            Deliver (with selected returns)
          </button>
        </div>
      </div>

      {/* Full Return Confirmation Modal */}
      <AnimatePresence>
        {showFullReturnConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => !loading && setShowFullReturnConfirm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-6 z-50 max-w-md w-full mx-4"
            >
              <h3 className="text-xl font-bold text-gray-800 mb-4">Confirm Full Return</h3>
              <p className="text-gray-600 mb-6">
                This will return all items in order <span className="font-semibold">{order.invoiceNo}</span> and mark it as <strong>RETURNED</strong> (not delivered). Are you sure?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowFullReturnConfirm(false)}
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFullReturn}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? "Processing..." : "Confirm Full Return"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Deliver Confirmation Modal (unchanged) */}
      <AnimatePresence>
        {showDeliverConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => !loading && setShowDeliverConfirm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-6 z-50 max-w-md w-full mx-4"
            >
              <h3 className="text-xl font-bold text-gray-800 mb-4">Confirm Delivery</h3>
              <p className="text-gray-600 mb-4">
                Mark order <span className="font-semibold">{order.invoiceNo}</span> as delivered
                {anyReturn ? " with selected returns" : ""}?
              </p>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Status
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as "DUE" | "PAID")}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#0F9D8F] focus:border-[#0F9D8F] outline-none text-black"
                >
                  <option value="PAID">Paid</option>
                  <option value="DUE">Due</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeliverConfirm(false)}
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeliver}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? "Processing..." : "Confirm"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}