'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreVertical, Eye, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';
import DeleteProcurementModal from '@/components/admin/DeleteProcurementModal';

interface Procurement {
  id: string;
  prNumber: string;
  createdAt: string;
  status: boolean;
  items: any[];
}

export default function ProcurementListPage() {
  const router = useRouter();
  const [procurements, setProcurements] = useState<Procurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedProcurement, setSelectedProcurement] = useState<Procurement | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    fetchProcurements();
  }, []);

  const fetchProcurements = async () => {
    try {
      const res = await fetch('/api/admin/procurement');
      const data = await res.json();
      if (res.ok) setProcurements(data.procurements);
      else toast.error('Failed to load procurements');
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (proc: Procurement) => {
    setToggling(proc.id);
    try {
      const res = await fetch(`/api/admin/procurement/${proc.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: !proc.status, items: proc.items }),
      });
      if (res.ok) {
        toast.success(`Status ${!proc.status ? 'activated' : 'deactivated'}`);
        fetchProcurements();
      } else {
        toast.error('Failed to update status');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setToggling(null);
    }
  };

  const handleDelete = (proc: Procurement) => {
    setSelectedProcurement(proc);
    setDeleteModalOpen(true);
    setActiveDropdown(null);
  };

  const confirmDelete = async () => {
    if (!selectedProcurement) return;
    try {
      const res = await fetch(`/api/admin/procurement/${selectedProcurement.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Procurement deleted');
        setDeleteModalOpen(false);
        fetchProcurements();
      } else {
        toast.error('Failed to delete');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 p-4"
    >
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Procurements</h1>
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase">PR Number</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase">Date & Time</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <AnimatePresence>
              {procurements.map((proc) => (
                <motion.tr
                  key={proc.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-4 py-3 font-medium text-[#0F9D8F]">{proc.prNumber}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(proc.createdAt).toLocaleDateString()}<br />
                    {new Date(proc.createdAt).toLocaleTimeString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleStatus(proc)}
                      disabled={toggling === proc.id}
                      className="focus:outline-none"
                    >
                      {proc.status ? (
                        <ToggleRight className="text-green-600" size={28} />
                      ) : (
                        <ToggleLeft className="text-gray-400" size={28} />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3 relative">
                    <button
                      onClick={() => setActiveDropdown(activeDropdown === proc.id ? null : proc.id)}
                      className="bg-gradient-to-r from-[#156A98] to-[#0F9D8F] text-white p-1 rounded-full hover:opacity-90"
                    >
                      <MoreVertical size={18} />
                    </button>
                    <AnimatePresence>
                      {activeDropdown === proc.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-10"
                        >
                          <button
                            onClick={() => router.push(`/dashboard/admin/procurement/${proc.id}`)}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Eye size={16} /> View
                          </button>
                          <button
                            onClick={() => router.push(`/dashboard/admin/procurement/${proc.id}/edit`)}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Edit size={16} /> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(proc)}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={16} /> Delete
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
        {procurements.length === 0 && (
          <div className="text-center py-12 text-gray-500">No procurements found.</div>
        )}
      </div>

      <DeleteProcurementModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        prNumber={selectedProcurement?.prNumber || ''}
      />
    </motion.div>
  );
}