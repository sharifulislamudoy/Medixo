'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreVertical, Eye, Edit, Tag, Trash2, Info, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import ViewOrderModal from '@/components/admin/ViewOrderModal';
import EditOrderModal from '@/components/admin/EditOrderModal';
import StatusModal from '@/components/admin/StatusModal';
import DeleteOrderModal from '@/components/admin/DeleteOrderModal';
import ReturnedItemsModal from '@/components/admin/ReturnedItemsModal';
import CustomerOrdersModal from '@/components/admin/CustomerOrdersModal';

interface Order {
  id: string;
  invoiceNo: string;
  orderDate: string;
  deliveryDate: string;
  customerName: string;
  customerShopName: string | null;
  customerAddress: string;
  customerPhone: string;
  totalAmount: number;
  originalTotal?: number | null;
  discountAmount?: number;
  paymentMethod: string;
  paymentStatus: 'DUE' | 'PAID';
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'RETURNED' | 'CANCELLED';
  items: OrderItem[];
  deliveryCode?: { code: string } | null;
}

interface OrderItem {
  id: string;
  productId: string;
  product: {
    name: string;
    image: string;
    sku: string;
  };
  returnedQuantity: number;
  quantity: number;
  price: number;
}

export default function AdminOrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filtered, setFiltered] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnedItems, setReturnedItems] = useState<any[]>([]);
  const [loadingReturns, setLoadingReturns] = useState(false);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [bulkActionOpen, setBulkActionOpen] = useState(false);
  const [creatingProcurement, setCreatingProcurement] = useState(false);

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
      const res = await fetch('/api/admin/orders');
      if (!res.ok) {
        if (res.status === 401) {
          toast.error('Unauthorized');
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch');
      }
      const data = await res.json();
      setOrders(data.orders);
      setFiltered(data.orders);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  // Enhanced search: also matches product name and SKU inside order items
  useEffect(() => {
    const lower = search.toLowerCase().trim();
    setFiltered(
      orders.filter((order) => {
        // Basic fields match
        const matchesBasic =
          order.invoiceNo.toLowerCase().includes(lower) ||
          order.customerName.toLowerCase().includes(lower) ||
          order.customerPhone.includes(lower) ||
          (order.deliveryCode?.code?.toLowerCase() || '').includes(lower);

        // Product name / SKU match inside any item
        const matchesProduct = order.items.some(
          (item) =>
            item.product.name.toLowerCase().includes(lower) ||
            item.product.sku.toLowerCase().includes(lower)
        );

        const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
        return (matchesBasic || matchesProduct) && matchesStatus;
      })
    );
    setSelectedOrders(new Set());
  }, [search, orders, statusFilter]);

  const toggleSelectAll = () => {
    if (selectedOrders.size === filtered.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(filtered.map((o) => o.id)));
    }
  };

  const toggleSelectOrder = (id: string) => {
    const newSet = new Set(selectedOrders);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedOrders(newSet);
  };

  const handleView = (order: Order) => {
    setSelectedOrder(order);
    setViewModalOpen(true);
    setActiveDropdown(null);
  };

  const handleEdit = (order: Order) => {
    setSelectedOrder(order);
    setEditModalOpen(true);
    setActiveDropdown(null);
  };

  const handleStatus = (order: Order) => {
    setSelectedOrder(order);
    setStatusModalOpen(true);
    setActiveDropdown(null);
  };

  const handleDeleteClick = (order: Order) => {
    setSelectedOrder(order);
    setDeleteModalOpen(true);
    setActiveDropdown(null);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedOrder) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Order deleted successfully');
      setDeleteModalOpen(false);
      fetchOrders();
    } catch (error) {
      toast.error('Failed to delete order');
    } finally {
      setDeleting(false);
    }
  };

  const handleViewReturns = async (orderId: string) => {
    setLoadingReturns(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/returns`);
      const data = await res.json();
      if (res.ok) {
        setReturnedItems(data.returnedItems);
        setReturnModalOpen(true);
      } else {
        toast.error('Failed to load returned items');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setLoadingReturns(false);
    }
  };

  const handleCustomerClick = (phone: string) => {
    setSelectedPhone(phone);
    setCustomerModalOpen(true);
  };

  const handleCreateProcurement = async () => {
    if (selectedOrders.size === 0) {
      toast.error('Please select at least one order');
      return;
    }
    setCreatingProcurement(true);
    try {
      const res = await fetch('/api/admin/procurement/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: Array.from(selectedOrders) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success(`Procurement ${data.procurement.prNumber} created`);
      setSelectedOrders(new Set());
      setBulkActionOpen(false);
    } catch (error) {
      toast.error('Failed to create procurement');
    } finally {
      setCreatingProcurement(false);
    }
  };

  const rowVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.03, duration: 0.3 },
    }),
    exit: { opacity: 0, x: -20, transition: { duration: 0.2 } },
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0F9D8F]"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <h1 className="text-3xl font-bold text-gray-800">Orders</h1>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${statusFilter === 'ALL'
                ? 'bg-gray-800 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter('PENDING')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${statusFilter === 'PENDING'
                ? 'bg-gray-500 text-white'
                : 'bg-gray-300 text-white hover:bg-gray-500'
              }`}
          >
            Pending
          </button>
          <button
            onClick={() => setStatusFilter('PROCESSING')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${statusFilter === 'PROCESSING'
                ? 'bg-orange-500 text-white'
                : 'bg-orange-100 text-orange-500 hover:bg-orange-200'
              }`}
          >
            Processing
          </button>
          <button
            onClick={() => setStatusFilter('SHIPPED')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${statusFilter === 'SHIPPED'
                ? 'bg-blue-500 text-white'
                : 'bg-blue-100 text-blue-500 hover:bg-blue-200'
              }`}
          >
            Shipped
          </button>
          <button
            onClick={() => setStatusFilter('DELIVERED')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${statusFilter === 'DELIVERED'
                ? 'bg-green-500 text-white'
                : 'bg-green-100 text-green-800 hover:bg-green-200'
              }`}
          >
            Delivered
          </button>
          <button
            onClick={() => setStatusFilter('RETURNED')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${statusFilter === 'RETURNED'
                ? 'bg-purple-500 text-white'
                : 'bg-purple-100 text-purple-500 hover:bg-purple-200'
              }`}
          >
            Returned
          </button>
          <button
            onClick={() => setStatusFilter('CANCELLED')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${statusFilter === 'CANCELLED'
                ? 'bg-red-500 text-white'
                : 'bg-red-100 text-red-800 hover:bg-red-200'
              }`}
          >
            Cancelled
          </button>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search by invoice, customer, phone, delivery code, or PRODUCT NAME..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#0F9D8F] focus:border-[#0F9D8F] outline-none text-black w-100"
          />
          <div className="relative">
            <button
              onClick={() => setBulkActionOpen(!bulkActionOpen)}
              disabled={selectedOrders.size === 0}
              className={`px-4 py-2 rounded-lg flex items-center gap-1 ${
                selectedOrders.size > 0
                  ? 'bg-[#0F9D8F] text-white hover:bg-[#0c7d72]'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Bulk Actions ({selectedOrders.size})
              <ChevronDown size={16} />
            </button>
            <AnimatePresence>
              {bulkActionOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10"
                >
                  <button
                    onClick={handleCreateProcurement}
                    disabled={creatingProcurement}
                    className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    {creatingProcurement ? 'Creating...' : 'Create Procurement'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full min-w-[1400px]">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={filtered.length > 0 && selectedOrders.size === filtered.length}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 text-[#0F9D8F] border-gray-300 rounded focus:ring-[#0F9D8F]"
                />
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase">Invoice</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase">Order Time</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase">Customer Info</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase">Total</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase">Paid</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase">Due</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase">Delivery No</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <AnimatePresence>
              {filtered.map((order, index) => {
                const paid = order.paymentStatus === 'PAID' ? order.totalAmount : 0;
                const due = order.totalAmount - paid;
                const orderDateObj = new Date(order.orderDate);
                const orderDate = orderDateObj.toLocaleDateString();
                const orderTime = orderDateObj.toLocaleTimeString();
                const discount = order.discountAmount || 0;
                const originalTotal = order.originalTotal || order.totalAmount;

                return (
                  <motion.tr
                    key={order.id}
                    custom={index}
                    variants={rowVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    layout
                    className="hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedOrders.has(order.id)}
                        onChange={() => toggleSelectOrder(order.id)}
                        className="w-4 h-4 text-[#0F9D8F] border-gray-300 rounded focus:ring-[#0F9D8F]"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{order.invoiceNo}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <span>{orderDate}</span>
                      <br />
                      <span>{orderTime}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <div className="space-y-1">
                        {order.customerShopName && <div className="font-bold">{order.customerShopName}</div>}
                        <div>{order.customerName}</div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-500">{order.customerPhone}</span>
                          <button
                            onClick={() => handleCustomerClick(order.customerPhone)}
                            className="text-gray-400 hover:text-[#0F9D8F] transition"
                            title="View customer orders"
                          >
                            <Info size={14} />
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-[#0F9D8F]">৳{order.totalAmount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-green-600">৳{paid.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-red-600">৳{due.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {order.deliveryCode?.code || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
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
                      <div className='mt-2'>
                        {order.items.some((item) => item.returnedQuantity > 0) ? (
                          <button
                            onClick={() => handleViewReturns(order.id)}
                            className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                          >
                            {order.items.reduce((sum, item) => sum + item.returnedQuantity, 0)} items
                          </button>
                        ) : (
                          <span className="text-gray-400"></span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 relative">
                      <button
                        onClick={() => setActiveDropdown(activeDropdown === order.id ? null : order.id)}
                        className="bg-gradient-to-r from-[#156A98] to-[#0F9D8F] text-white p-1 rounded-full hover:opacity-90 transition"
                      >
                        <MoreVertical size={18} />
                      </button>
                      <AnimatePresence>
                        {activeDropdown === order.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10"
                          >
                            <button
                              onClick={() => handleView(order)}
                              className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <Eye size={16} /> View Order
                            </button>
                            <button
                              onClick={() => handleEdit(order)}
                              className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <Edit size={16} /> Edit Order
                            </button>
                            <button
                              onClick={() => handleStatus(order)}
                              className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <Tag size={16} /> Edit Status
                            </button>
                            <button
                              onClick={() => handleDeleteClick(order)}
                              className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              <Trash2 size={16} /> Delete Order
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
        {filtered.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500">No orders found.</div>
        )}
      </div>

      <ViewOrderModal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        order={selectedOrder}
      />
      <EditOrderModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        order={selectedOrder}
        onSuccess={() => {
          fetchOrders();
          setEditModalOpen(false);
        }}
      />
      <StatusModal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        order={selectedOrder}
        onSuccess={() => {
          fetchOrders();
          setStatusModalOpen(false);
        }}
      />
      <DeleteOrderModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        invoiceNo={selectedOrder?.invoiceNo || ''}
        loading={deleting}
      />
      <ReturnedItemsModal
        isOpen={returnModalOpen}
        onClose={() => setReturnModalOpen(false)}
        items={returnedItems}
        loading={loadingReturns}
      />
      <CustomerOrdersModal
        isOpen={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        phone={selectedPhone}
      />
    </motion.div>
  );
}