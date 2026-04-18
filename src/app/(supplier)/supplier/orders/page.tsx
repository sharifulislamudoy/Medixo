'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface Assignment {
  quantity: number;
  costPrice: number;
}

interface ProcurementItem {
  id: string;
  product: {
    name: string;
    sku: string;
    image: string;
  };
  assignments: Assignment[];
}

interface Procurement {
  id: string;
  prNumber: string;
  createdAt: string;
  items: ProcurementItem[];
}

export default function SupplierOrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [procurements, setProcurements] = useState<Procurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedProc, setExpandedProc] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
    if (status === 'authenticated' && session?.user?.role !== 'SUPPLIER') {
      router.push('/dashboard');
    }
    if (status === 'authenticated' && session?.user?.role === 'SUPPLIER') {
      fetchOrders();
    }
  }, [status, session, router]);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/suppliers/orders');
      const data = await res.json();
      if (res.ok) {
        setProcurements(data.procurements);
        if (data.procurements.length > 0) {
          setExpandedProc(data.procurements[0].id);
        }
      } else {
        toast.error(data.error || 'Failed to load orders');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (procId: string) => {
    setExpandedProc(expandedProc === procId ? null : procId);
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
      className="space-y-6 p-4 md:p-6"
    >
      <h1 className="text-3xl font-bold text-gray-800">Assigned Orders</h1>

      {procurements.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No orders assigned to you yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {procurements.map((proc) => (
            <motion.div
              key={proc.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-4 md:px-6 py-4 cursor-pointer hover:bg-gray-50 transition"
                onClick={() => toggleExpand(proc.id)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                  <h2 className="text-lg md:text-xl font-semibold text-[#0F9D8F]">{proc.prNumber}</h2>
                  <span className="text-xs md:text-sm text-gray-500">
                    {new Date(proc.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 hidden sm:inline">
                    {proc.items.length} product{proc.items.length !== 1 ? 's' : ''}
                  </span>
                  <span className="text-xs text-gray-600 sm:hidden">
                    {proc.items.length} item{proc.items.length !== 1 ? 's' : ''}
                  </span>
                  {expandedProc === proc.id ? (
                    <ChevronUp className="text-gray-500" size={20} />
                  ) : (
                    <ChevronDown className="text-gray-500" size={20} />
                  )}
                </div>
              </div>

              {/* Content: Cards (mobile) + Table (desktop) */}
              <AnimatePresence>
                {expandedProc === proc.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-gray-200"
                  >
                    {/* Mobile Card View */}
                    <div className="block md:hidden p-4 space-y-4">
                      {proc.items.map((item) => {
                        const assignment = item.assignments[0];
                        const totalCost = (assignment?.quantity || 0) * (assignment?.costPrice || 0);
                        return (
                          <div key={item.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="flex items-start gap-3">
                              <div className="relative w-12 h-12 flex-shrink-0 bg-white rounded border">
                                <Image
                                  src={item.product.image}
                                  alt={item.product.name}
                                  fill
                                  className="object-contain p-1"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-gray-800 text-sm md:text-base truncate">
                                  {item.product.name}
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">SKU: {item.product.sku}</p>
                              </div>
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-gray-500">Quantity:</span>
                                <span className="ml-2 font-medium text-gray-800">
                                  {assignment?.quantity || 0}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">Cost:</span>
                                <span className="ml-2 font-medium text-gray-800">
                                  ৳{assignment?.costPrice.toFixed(2) || '0.00'}
                                </span>
                              </div>
                              <div className="col-span-2">
                                <span className="text-gray-500">Total:</span>
                                <span className="ml-2 font-semibold text-[#0F9D8F]">
                                  ৳{totalCost.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full min-w-[800px]">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                              Product
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                              Quantity
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                              Cost
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                              Total
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {proc.items.map((item) => {
                            const assignment = item.assignments[0];
                            const totalCost = (assignment?.quantity || 0) * (assignment?.costPrice || 0);
                            return (
                              <tr key={item.id} className="hover:bg-gray-50/80">
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    <div className="relative w-10 h-10 flex-shrink-0 bg-gray-100 rounded border">
                                      <Image
                                        src={item.product.image}
                                        alt={item.product.name}
                                        fill
                                        className="object-contain p-1"
                                      />
                                    </div>
                                    <span className="font-medium text-gray-800">
                                      {item.product.name}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-right text-sm font-medium text-gray-800">
                                  {assignment?.quantity || 0}
                                </td>
                                <td className="px-4 py-3 text-right text-sm font-medium text-gray-800">
                                  ৳{assignment?.costPrice.toFixed(2) || '0.00'}
                                </td>
                                <td className="px-4 py-3 text-right text-sm font-semibold text-[#0F9D8F]">
                                  ৳{totalCost.toFixed(2)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}