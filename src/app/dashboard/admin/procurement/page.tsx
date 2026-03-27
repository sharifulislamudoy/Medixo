'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Package, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

interface ProcurementItem {
  id: string;
  product: {
    name: string;
    sku: string;
    image: string;
  };
  orderedQuantity: number;
  currentStock: number;
  purchasePrice: number;
  mrp: number;
}

interface Procurement {
  id: string;
  prNumber: string;
  createdAt: string;
  status: string;
  items: ProcurementItem[];
}

export default function AdminProcurementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [procurements, setProcurements] = useState<Procurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProcurement, setSelectedProcurement] = useState<Procurement | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedProcurements, setSelectedProcurements] = useState<Set<string>>(new Set());
  const [bulkActionOpen, setBulkActionOpen] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
    if (status === 'authenticated') {
      fetchProcurements();
    }
  }, [status, router]);

  const fetchProcurements = async () => {
    try {
      const res = await fetch('/api/admin/procurement');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setProcurements(data.procurements);
    } catch (error) {
      toast.error('Failed to load procurement requests');
    } finally {
      setLoading(false);
    }
  };

  const handleView = (proc: Procurement) => {
    setSelectedProcurement(proc);
    setViewModalOpen(true);
  };

  const handleSendPurchaseRequest = async () => {
    if (selectedProcurements.size === 0) {
      toast.error('Please select at least one procurement request');
      return;
    }
    setSendingRequest(true);
    try {
      // Placeholder: just simulate sending
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success(`Purchase request sent for ${selectedProcurements.size} procurement(s)`);
      setSelectedProcurements(new Set());
      setBulkActionOpen(false);
    } catch (error) {
      toast.error('Failed to send purchase request');
    } finally {
      setSendingRequest(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedProcurements.size === procurements.length) {
      setSelectedProcurements(new Set());
    } else {
      setSelectedProcurements(new Set(procurements.map((p) => p.id)));
    }
  };

  const toggleSelectProcurement = (id: string) => {
    const newSet = new Set(selectedProcurements);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedProcurements(newSet);
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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Procurement Requests</h1>
        <div className="flex gap-2">
          {/* Bulk Actions Dropdown */}
          <div className="relative">
            <button
              onClick={() => setBulkActionOpen(!bulkActionOpen)}
              disabled={selectedProcurements.size === 0}
              className={`px-4 py-2 rounded-lg flex items-center gap-1 ${
                selectedProcurements.size > 0
                  ? 'bg-[#0F9D8F] text-white hover:bg-[#0c7d72]'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Bulk Actions ({selectedProcurements.size})
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
                    onClick={handleSendPurchaseRequest}
                    disabled={sendingRequest}
                    className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    {sendingRequest ? 'Sending...' : 'Send Purchase Request'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={procurements.length > 0 && selectedProcurements.size === procurements.length}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 text-[#0F9D8F] border-gray-300 rounded focus:ring-[#0F9D8F]"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PR Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created At</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {procurements.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-500">
                  No procurement requests found.
                </td>
              </tr>
            ) : (
              procurements.map((proc) => (
                <tr key={proc.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedProcurements.has(proc.id)}
                      onChange={() => toggleSelectProcurement(proc.id)}
                      className="w-4 h-4 text-[#0F9D8F] border-gray-300 rounded focus:ring-[#0F9D8F]"
                    />
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{proc.prNumber}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(proc.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{proc.items.length} items</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleView(proc)}
                      className="text-[#0F9D8F] hover:text-[#0c7d72] transition"
                      title="View Details"
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* View Procurement Modal */}
      {viewModalOpen && selectedProcurement && (
        <ProcurementViewModal
          isOpen={viewModalOpen}
          onClose={() => setViewModalOpen(false)}
          procurement={selectedProcurement}
        />
      )}
    </motion.div>
  );
}

// Modal Component (same as before, but included here for completeness)
function ProcurementViewModal({
  isOpen,
  onClose,
  procurement,
}: {
  isOpen: boolean;
  onClose: () => void;
  procurement: Procurement;
}) {
  if (!isOpen) return null;

  const totalCost = procurement.items.reduce(
    (sum, item) => sum + item.purchasePrice * item.orderedQuantity,
    0
  );

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-2xl font-bold text-gray-800">
            Procurement {procurement.prNumber}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4">
          <p className="text-gray-600 mb-4">Created: {new Date(procurement.createdAt).toLocaleString()}</p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Product</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Ordered Qty</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Current Stock</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Purchase Price</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">MRP</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {procurement.items.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="px-4 py-2 text-sm text-gray-900">{item.product.name}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{item.orderedQuantity}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{item.currentStock}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">৳{item.purchasePrice.toFixed(2)}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">৳{item.mrp.toFixed(2)}</td>
                    <td className="px-4 py-2 text-sm font-medium text-[#0F9D8F]">
                      ৳{(item.purchasePrice * item.orderedQuantity).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={5} className="px-4 py-2 text-right font-bold text-gray-800">
                    Total
                  </td>
                  <td className="px-4 py-2 font-bold text-[#0F9D8F]">৳{totalCost.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}