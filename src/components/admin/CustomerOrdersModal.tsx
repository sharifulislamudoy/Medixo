'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Customer {
  customerName: string;
  customerShopName: string | null;
  customerAddress: string;
  customerPhone: string;
}

interface OrderSummary {
  id: string;
  invoiceNo: string;
  orderDate: string;
  totalAmount: number;
  paymentStatus: 'DUE' | 'PAID';
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'RETURNED' | 'CANCELLED';
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  phone: string | null;
}

export default function CustomerOrdersModal({ isOpen, onClose, phone }: Props) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && phone) {
      fetchOrders();
    }
  }, [isOpen, phone]);

  const fetchOrders = async () => {
    if (!phone) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/customers/${encodeURIComponent(phone)}/orders`);
      const data = await res.json();
      if (res.ok) {
        setCustomer(data.customer);
        setOrders(data.orders);
      } else {
        console.error('Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching customer orders:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!phone) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-6xl bg-white rounded-xl shadow-2xl z-50 flex flex-col"
            style={{ maxHeight: '85vh' }}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b flex-shrink-0">
              <h2 className="text-2xl font-bold text-gray-800">Customer Orders</h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0F9D8F]" />
                </div>
              ) : (
                <>
                  {/* Customer Info */}
                  {customer && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                      <h3 className="font-semibold text-gray-800 mb-2">Customer Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="font-medium text-gray-600">Name:</span>{' '}
                          <span className="text-black">{customer.customerName}</span>
                        </div>
                        {customer.customerShopName && (
                          <div>
                            <span className="font-medium text-gray-600">Shop:</span>{' '}
                            <span className="text-black">{customer.customerShopName}</span>
                          </div>
                        )}
                        <div>
                          <span className="font-medium text-gray-600">Phone:</span>{' '}
                          <span className="text-black">{customer.customerPhone}</span>
                        </div>
                        <div className="md:col-span-2">
                          <span className="font-medium text-gray-600">Address:</span>{' '}
                          <span className="text-black">{customer.customerAddress}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Orders Table */}
                  {orders.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No orders found for this customer.</p>
                  ) : (
                    <div className="border rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-100 sticky top-0">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order Date</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {orders.map((order) => {
                              const paid = order.paymentStatus === 'PAID' ? order.totalAmount : 0;
                              const due = order.totalAmount - paid;
                              return (
                                <tr key={order.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-sm text-gray-900">{order.invoiceNo}</td>
                                  <td className="px-4 py-3 text-sm text-gray-600">
                                    {new Date(order.orderDate).toLocaleDateString()}
                                  </td>
                                  <td className="px-4 py-3 text-sm font-medium text-[#0F9D8F]">
                                    ৳{order.totalAmount.toFixed(2)}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-green-600">
                                    ৳{paid.toFixed(2)}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-red-600">
                                    ৳{due.toFixed(2)}
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-1">
                                      <span
                                        className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                                          order.status === 'PENDING'
                                            ? 'bg-yellow-100 text-yellow-800'
                                            : order.status === 'PROCESSING'
                                            ? 'bg-blue-100 text-blue-800'
                                            : order.status === 'SHIPPED'
                                            ? 'bg-purple-100 text-purple-800'
                                            : order.status === 'DELIVERED'
                                            ? 'bg-green-100 text-green-800'
                                            : order.status === 'RETURNED'
                                            ? 'bg-orange-100 text-orange-800'
                                            : 'bg-red-100 text-red-800'
                                        }`}
                                      >
                                        {order.status}
                                      </span>
                                      <span
                                        className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                                          order.paymentStatus === 'PAID'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                        }`}
                                      >
                                        {order.paymentStatus}
                                      </span>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}