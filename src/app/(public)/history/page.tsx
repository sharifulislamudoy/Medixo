'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface OrderSummary {
  id: string;
  invoiceNo: string;
  orderDate: string;
  totalAmount: number;
  status: string;
}

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product: {
    name: string;
    image: string;
  };
}

interface OrderDetails {
  id: string;
  invoiceNo: string;
  orderDate: string;
  deliveryDate: string;
  customerName: string;
  customerShopName?: string;
  customerAddress: string;
  customerPhone: string;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  totalAmount: number;
  items: OrderItem[];
}

export default function HistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Details modal state
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editItems, setEditItems] = useState<{ productId: string; name: string; image: string; quantity: number; price: number }[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
    if (status === 'authenticated') {
      fetchOrders();
    }
  }, [status, router]);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders/history');
      const data = await res.json();
      if (res.ok) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderClick = async (orderId: string) => {
    setSelectedOrderId(orderId);
    setModalOpen(true);
    setLoadingDetails(true);

    try {
      const res = await fetch(`/api/orders/${orderId}`);
      const data = await res.json();
      if (res.ok) {
        setOrderDetails(data.order);
      } else {
        console.error(data.error);
      }
    } catch (error) {
      console.error('Failed to fetch order details', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedOrderId(null);
    setOrderDetails(null);
  };

  // Cancel order
  const handleCancelOrder = async () => {
    if (!orderDetails || orderDetails.status !== 'PENDING') return;

    // Show confirmation toast with action
    toast((t) => (
      <span>
        Are you sure you want to cancel this order?
        <div className="flex gap-2 mt-2">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              setLoadingDetails(true); // simple loading state inside modal
              try {
                const res = await fetch(`/api/orders/${orderDetails.id}`, {
                  method: 'PATCH',
                });
                if (res.ok) {
                  toast.success('Order cancelled successfully');
                  closeModal();
                  fetchOrders(); // refresh list
                } else {
                  const data = await res.json();
                  toast.error(data.error || 'Failed to cancel order');
                }
              } catch (error) {
                toast.error('An error occurred');
              } finally {
                setLoadingDetails(false);
              }
            }}
            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Yes, cancel
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            No
          </button>
        </div>
      </span>
    ), { duration: 10000 }); // keep until action
  };

  // Open edit modal
  const handleEditClick = () => {
    if (!orderDetails) return;
    const items = orderDetails.items.map(item => ({
      productId: item.productId,
      name: item.product.name,
      image: item.product.image,
      quantity: item.quantity,
      price: item.price,
    }));
    setEditItems(items);
    setEditModalOpen(true);
  };

  // Adjust quantity in edit modal
  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 0) return;
    setEditItems(prev =>
      prev.map(item =>
        item.productId === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  // Save edited order
  const handleSaveEdit = async () => {
    if (!orderDetails) return;
    const updatedItems = editItems
      .filter(item => item.quantity > 0)
      .map(item => ({
        productId: item.productId,
        quantity: item.quantity,
      }));

    if (updatedItems.length === 0) {
      toast.error('Order must have at least one item');
      return;
    }

    setSavingEdit(true);
    try {
      const res = await fetch(`/api/orders/${orderDetails.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: updatedItems }),
      });
      if (res.ok) {
        toast.success('Order updated successfully');
        setEditModalOpen(false);
        closeModal();
        fetchOrders(); // refresh list
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to update order');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setSavingEdit(false);
    }
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-black">Order History</h1>
      {orders.length === 0 ? (
        <p className="text-gray-600">No orders yet.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {orders.map(order => (
            <div
              key={order.id}
              onClick={() => handleOrderClick(order.id)}
              className="border rounded-lg p-4 shadow hover:shadow-md cursor-pointer transition bg-white"
            >
              <h2 className="font-semibold text-black">Invoice: {order.invoiceNo}</h2>
              <p className="text-sm text-gray-600">
                Date: {new Date(order.orderDate).toLocaleDateString()}
              </p>
              <p className="text-lg font-bold text-[#0F9D8F]">৳{order.totalAmount}</p>
              <p
                className={`text-sm mt-2 ${
                  order.status === 'PENDING'
                    ? 'text-yellow-600'
                    : order.status === 'PROCESSING'
                    ? 'text-blue-600'
                    : order.status === 'DELIVERED'
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                Status: {order.status}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Order Details Modal */}
      <AnimatePresence>
        {modalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={closeModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-6 z-50 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Order Details</h2>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {loadingDetails ? (
                <div className="text-center py-8 text-black">Loading details...</div>
              ) : orderDetails ? (
                <div>
                  {/* Order info */}
                  <div className="border-b pb-4 mb-4">
                    <p><span className="font-semibold text-black">Invoice:</span> <span className='text-gray-600'>{orderDetails.invoiceNo}</span></p>
                    <p><span className="font-semibold text-black">Order Date:</span> <span className='text-gray-600'>{new Date(orderDetails.orderDate).toLocaleString()}</span></p>
                    <p><span className="font-semibold text-black">Delivery Date:</span> <span className='text-gray-600'>{new Date(orderDetails.deliveryDate).toLocaleDateString()}</span></p>
                    <p><span className="font-semibold text-black">Status:</span> 
                      <span className={`ml-2 ${
                        orderDetails.status === 'PENDING' ? 'text-yellow-600' :
                        orderDetails.status === 'PROCESSING' ? 'text-blue-600' :
                        orderDetails.status === 'DELIVERED' ? 'text-green-600' :
                        'text-red-600'
                      }`}>{orderDetails.status}</span>
                    </p>
                    <p><span className="font-semibold text-black">Payment:</span> <span className='text-gray-600'>{orderDetails.paymentMethod} ({orderDetails.paymentStatus})</span></p>
                  </div>

                  {/* Customer info */}
                  <div className="border-b pb-4 mb-4">
                    <h3 className="font-semibold text-black text-lg mb-2">Customer Details</h3>
                    <p><span className="font-medium text-black">Name:</span> <span className='text-gray-600'>{orderDetails.customerName}</span></p>
                    {orderDetails.customerShopName && <p><span className="font-medium text-black">Shop:</span> <span className='text-gray-600'>{orderDetails.customerShopName}</span></p>}
                    <p><span className="font-medium text-black">Address:</span> <span className='text-gray-600'>{orderDetails.customerAddress}</span></p>
                    <p><span className="font-medium text-black">Phone:</span> <span className='text-gray-600'>{orderDetails.customerPhone}</span></p>
                  </div>

                  {/* Items */}
                  <h3 className="font-semibold text-black text-lg mb-2">Items</h3>
                  <div className="space-y-3">
                    {orderDetails.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <div className="relative w-12 h-12 flex-shrink-0">
                          <Image
                            src={item.product.image}
                            alt={item.product.name}
                            fill
                            className="object-contain rounded"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{item.product.name}</p>
                          <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-[#0F9D8F]">৳{(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div className="border-t mt-4 pt-4 flex justify-between font-bold text-lg">
                    <span className='text-black'>Total</span>
                    <span className="text-[#0F9D8F]">৳{orderDetails.totalAmount.toFixed(2)}</span>
                  </div>

                  {/* Action Buttons for PENDING orders */}
                  {orderDetails.status === 'PENDING' && (
                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={handleEditClick}
                        className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                      >
                        Edit Order
                      </button>
                      <button
                        onClick={handleCancelOrder}
                        className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition"
                      >
                        Cancel Order
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-red-500">Failed to load order details.</p>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Edit Order Modal */}
      <AnimatePresence>
        {editModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setEditModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-6 z-50 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Edit Order</h2>
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <p className="text-sm text-gray-500 mb-4">Adjust quantities (set to 0 to remove).</p>

              <div className="space-y-4">
                {editItems.map((item) => (
                  <div key={item.productId} className="flex items-center gap-3">
                    <div className="relative w-12 h-12 flex-shrink-0">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-contain rounded"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{item.name}</p>
                      <p className="text-sm text-gray-500">Price: ৳{item.price}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                      >
                        –
                      </button>
                      <span className="w-12 text-center text-black">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t mt-6 pt-4 flex justify-between font-bold text-lg">
                <span className='text-black'>New Total</span>
                <span className="text-[#0F9D8F]">
                  ৳{editItems.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}
                </span>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={savingEdit}
                  className="flex-1 bg-[#0F9D8F] text-white py-2 rounded-lg hover:bg-[#0c7d72] transition disabled:opacity-50"
                >
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}