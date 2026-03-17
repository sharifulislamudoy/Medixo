"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Eye, CheckCircle, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";

interface Order {
  id: string;
  invoiceNo: string;
  orderDate: string;
  customerName: string;
  customerShopName: string | null;
  customerPhone: string;
  totalAmount: number;
  status: string;
}

interface Props {
  initialOrders: Order[];
}

export default function DeliveryBoyOrdersClient({ initialOrders }: Props) {
  const router = useRouter();
  const [orders, setOrders] = useState(initialOrders);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [deliverModal, setDeliverModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"DUE" | "PAID">("PAID");
  const [loading, setLoading] = useState(false);

  const handleMarkDelivered = async () => {
    if (!selectedOrder) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/deliveryboy/orders/${selectedOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to mark delivered");
      toast.success("Order marked as delivered");
      setOrders((prev) => prev.filter((o) => o.id !== selectedOrder.id));
      setDeliverModal(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Desktop Table View (hidden on small screens) */}
      <div className="hidden md:block bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {orders.map((order, index) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-600">{index + 1}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{order.invoiceNo}</td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  <div>
                    {order.customerShopName && (
                      <span className="font-semibold">{order.customerShopName}</span>
                    )}
                    <div>{order.customerName}</div>
                    <div className="text-xs text-gray-500">{order.customerPhone}</div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-[#0F9D8F]">
                  ৳{order.totalAmount.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => window.open(`/orders/${order.id}`, "_blank")}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      title="View Details"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        setDeliverModal(true);
                      }}
                      className="p-1 text-green-600 hover:bg-green-50 rounded"
                      title="Mark as Delivered"
                    >
                      <CheckCircle size={18} />
                    </button>
                    <button
                      onClick={() => router.push(`/orders/${order.id}/return`)}
                      className="p-1 text-orange-600 hover:bg-orange-50 rounded"
                      title="Return Items"
                    >
                      <RotateCcw size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && (
          <div className="text-center py-12 text-gray-500">No orders assigned for delivery.</div>
        )}
      </div>

      {/* Mobile Card View (visible only on small screens) */}
      <div className="block md:hidden space-y-4">
        {orders.map((order, index) => (
          <div key={order.id} className="bg-white rounded-lg shadow p-4 border border-gray-100">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                <span className="text-lg font-bold text-gray-800">{order.invoiceNo}</span>
              </div>
              <span className="text-lg font-bold text-[#0F9D8F]">৳{order.totalAmount.toFixed(2)}</span>
            </div>

            <div className="mb-3">
              {order.customerShopName && (
                <p className="font-semibold text-gray-800">{order.customerShopName}</p>
              )}
              <p className="text-gray-700">{order.customerName}</p>
              <p className="text-sm text-gray-500">{order.customerPhone}</p>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
              <button
                onClick={() => window.open(`/orders/${order.id}`, "_blank")}
                className="p-2 text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100"
                title="View Details"
              >
                <Eye size={18} />
              </button>
              <button
                onClick={() => {
                  setSelectedOrder(order);
                  setDeliverModal(true);
                }}
                className="p-2 text-green-600 bg-green-50 rounded-full hover:bg-green-100"
                title="Mark as Delivered"
              >
                <CheckCircle size={18} />
              </button>
              <button
                onClick={() => router.push(`/orders/${order.id}/return`)}
                className="p-2 text-orange-600 bg-orange-50 rounded-full hover:bg-orange-100"
                title="Return Items"
              >
                <RotateCcw size={18} />
              </button>
            </div>
          </div>
        ))}
        {orders.length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow">
            No orders assigned for delivery.
          </div>
        )}
      </div>

      {/* Deliver Confirmation Modal (unchanged) */}
      <AnimatePresence>
        {deliverModal && selectedOrder && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => !loading && setDeliverModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-6 z-50 max-w-md w-full mx-4"
            >
              <h3 className="text-xl font-bold text-gray-800 mb-4">Confirm Delivery</h3>
              <p className="text-gray-600 mb-4">
                Mark order <span className="font-semibold">{selectedOrder.invoiceNo}</span> as delivered?
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
                  onClick={() => setDeliverModal(false)}
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMarkDelivered}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? "Updating..." : "Confirm"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}