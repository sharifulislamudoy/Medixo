'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface BidAssignment {
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
  assignments: BidAssignment[]; // existing bids by this supplier (if any)
}

interface Procurement {
  id: string;
  prNumber: string;
  createdAt: string;
  items: ProcurementItem[];
}

export default function SupplierBidingPage() {
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
      fetchBiddingItems();
    }
  }, [status, session, router]);

  const fetchBiddingItems = async () => {
    try {
      const res = await fetch('/api/suppliers/biding');
      const data = await res.json();
      if (res.ok) {
        setProcurements(data.procurements);
        if (data.procurements.length > 0) {
          setExpandedProc(data.procurements[0].id);
        }
      } else {
        toast.error(data.error || 'Failed to load bidding items');
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
      <h1 className="text-3xl font-bold text-gray-800">Bidding Requests</h1>

      {procurements.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No open bidding items available.</p>
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
                className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-gray-50 transition"
                onClick={() => toggleExpand(proc.id)}
              >
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-semibold text-[#0F9D8F]">{proc.prNumber}</h2>
                  <span className="text-sm text-gray-500">
                    {new Date(proc.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {proc.items.length} item{proc.items.length !== 1 ? 's' : ''}
                  </span>
                  {expandedProc === proc.id ? (
                    <ChevronUp className="text-gray-500" size={20} />
                  ) : (
                    <ChevronDown className="text-gray-500" size={20} />
                  )}
                </div>
              </div>

              {/* Items Table */}
              <AnimatePresence>
                {expandedProc === proc.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-gray-200"
                  >
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[700px]">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                              Product
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                              SKU
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                              Your Bid Quantity
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                              Your Bid Price
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {proc.items.map((item) => {
                            const assignment = item.assignments[0];
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
                                <td className="px-4 py-3 text-sm text-gray-600">{item.product.sku}</td>
                                <td className="px-4 py-3 text-right text-sm font-medium text-gray-800">
                                  {assignment?.quantity || '—'}
                                </td>
                                <td className="px-4 py-3 text-right text-sm font-medium text-gray-800">
                                  {assignment?.costPrice ? `৳${assignment.costPrice.toFixed(2)}` : '—'}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  {assignment ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      Bid Placed
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                      Open for Bid
                                    </span>
                                  )}
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