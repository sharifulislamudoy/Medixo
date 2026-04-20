'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { ChevronDown, ChevronUp, Save } from 'lucide-react';

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
  requiredQuantity: number;
  bidding: boolean;              // whether bidding is open for this item
  assignments: BidAssignment[];  // existing bid by this supplier (if any)
}

interface Procurement {
  id: string;
  prNumber: string;
  createdAt: string;
  status: boolean; // active/inactive
  items: ProcurementItem[];
}

export default function SupplierBidingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [procurements, setProcurements] = useState<Procurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedProc, setExpandedProc] = useState<string | null>(null);
  const [savingItemId, setSavingItemId] = useState<string | null>(null);

  const [formValues, setFormValues] = useState<Record<string, { quantity: number; costPrice: number }>>({});

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
        const procs = data.procurements || [];
        // Filter again on client side to be absolutely sure only bidding=true items appear
        const filteredProcs = procs.map((proc: Procurement) => ({
          ...proc,
          items: proc.items.filter((item) => item.bidding === true),
        })).filter((proc: Procurement) => proc.items.length > 0);
        
        setProcurements(filteredProcs);
        if (filteredProcs.length > 0) {
          setExpandedProc(filteredProcs[0].id);
        }
        const initial: Record<string, { quantity: number; costPrice: number }> = {};
        filteredProcs.forEach((proc: Procurement) => {
          proc.items.forEach((item) => {
            const existing = item.assignments[0];
            initial[item.id] = {
              quantity: existing?.quantity ?? 0,
              costPrice: existing?.costPrice ?? 0,
            };
          });
        });
        setFormValues(initial);
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

  const handleInputChange = (itemId: string, field: 'quantity' | 'costPrice', value: string) => {
    const num = field === 'quantity' ? parseInt(value) || 0 : parseFloat(value) || 0;
    setFormValues((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: num,
      },
    }));
  };

  const handleSubmitBid = async (procurementItemId: string) => {
    const values = formValues[procurementItemId];
    if (!values) return;

    if (values.quantity <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }
    if (values.costPrice <= 0) {
      toast.error('Cost price must be greater than 0');
      return;
    }

    setSavingItemId(procurementItemId);
    try {
      const res = await fetch('/api/suppliers/biding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          procurementItemId,
          quantity: values.quantity,
          costPrice: values.costPrice,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Bid submitted successfully');
        setProcurements((prev) =>
          prev.map((proc) => ({
            ...proc,
            items: proc.items.map((item) =>
              item.id === procurementItemId
                ? {
                    ...item,
                    assignments: [
                      {
                        quantity: values.quantity,
                        costPrice: values.costPrice,
                      },
                    ],
                  }
                : item
            ),
          }))
        );
      } else {
        toast.error(data.error || 'Failed to submit bid');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setSavingItemId(null);
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
              <div
                className="flex items-center justify-between px-4 md:px-6 py-4 cursor-pointer hover:bg-gray-50 transition"
                onClick={() => toggleExpand(proc.id)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                  <h2 className="text-lg md:text-xl font-semibold text-[#0F9D8F]">{proc.prNumber}</h2>
                  <span className="text-xs md:text-sm text-gray-500">
                    {new Date(proc.createdAt).toLocaleDateString()}
                  </span>
                  {!proc.status && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      Inactive
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 hidden sm:inline">
                    {proc.items.length} item{proc.items.length !== 1 ? 's' : ''}
                  </span>
                  {expandedProc === proc.id ? (
                    <ChevronUp className="text-gray-500" size={20} />
                  ) : (
                    <ChevronDown className="text-gray-500" size={20} />
                  )}
                </div>
              </div>

              <AnimatePresence>
                {expandedProc === proc.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-gray-200"
                  >
                    {/* Mobile Cards */}
                    <div className="block md:hidden p-4 space-y-4">
                      {proc.items.map((item) => {
                        const values = formValues[item.id] || { quantity: 0, costPrice: 0 };
                        const existing = item.assignments[0];
                        const isSaving = savingItemId === item.id;
                        // Only render if bidding is true (redundant safety)
                        if (!item.bidding) return null;
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
                                <h3 className="font-medium text-gray-800 text-sm truncate">
                                  {item.product.name}
                                </h3>
                                <p className="text-xs text-gray-500">SKU: {item.product.sku}</p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  Required: {item.requiredQuantity} units
                                </p>
                              </div>
                            </div>
                            {item.bidding && proc.status ? (
                              <div className="mt-4 space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                      Quantity
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={values.quantity}
                                      onChange={(e) =>
                                        handleInputChange(item.id, 'quantity', e.target.value)
                                      }
                                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-[#0F9D8F] focus:border-[#0F9D8F] outline-none text-gray-800"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                      Cost Price (৳)
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={values.costPrice}
                                      onChange={(e) =>
                                        handleInputChange(item.id, 'costPrice', e.target.value)
                                      }
                                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-[#0F9D8F] focus:border-[#0F9D8F] outline-none text-gray-800"
                                    />
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleSubmitBid(item.id)}
                                  disabled={isSaving}
                                  className="w-full flex items-center justify-center gap-2 py-2 bg-[#0F9D8F] text-white rounded-lg hover:bg-[#0c7d72] disabled:opacity-50 text-sm"
                                >
                                  <Save size={16} />
                                  {isSaving ? 'Submitting...' : existing ? 'Update Bid' : 'Submit Bid'}
                                </button>
                                {existing && (
                                  <p className="text-xs text-gray-500 text-center">
                                    Current bid: {existing.quantity} units @ ৳
                                    {existing.costPrice.toFixed(2)}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <div className="mt-4 text-sm text-gray-500">
                                {!proc.status
                                  ? 'Procurement is inactive'
                                  : !item.bidding
                                  ? 'Bidding closed for this item'
                                  : existing
                                  ? `Bid placed: ${existing.quantity} units @ ৳${existing.costPrice.toFixed(2)}`
                                  : 'No bid placed'}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full min-w-[900px]">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                              Product
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                              SKU
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                              Required Qty
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                              Your Quantity
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                              Your Cost (৳)
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {proc.items.map((item) => {
                            const values = formValues[item.id] || { quantity: 0, costPrice: 0 };
                            const existing = item.assignments[0];
                            const isSaving = savingItemId === item.id;
                            if (!item.bidding) return null;
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
                                  {item.requiredQuantity}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  {item.bidding && proc.status ? (
                                    <input
                                      type="number"
                                      min="0"
                                      value={values.quantity}
                                      onChange={(e) =>
                                        handleInputChange(item.id, 'quantity', e.target.value)
                                      }
                                      className="w-24 px-2 py-1 border border-gray-300 rounded text-sm text-right focus:ring-1 focus:ring-[#0F9D8F] focus:border-[#0F9D8F] outline-none text-gray-800"
                                    />
                                  ) : (
                                    <span className="text-sm text-gray-500">
                                      {existing?.quantity ?? '—'}
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  {item.bidding && proc.status ? (
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={values.costPrice}
                                      onChange={(e) =>
                                        handleInputChange(item.id, 'costPrice', e.target.value)
                                      }
                                      className="w-28 px-2 py-1 border border-gray-300 rounded text-sm text-right focus:ring-1 focus:ring-[#0F9D8F] focus:border-[#0F9D8F] outline-none text-gray-800"
                                    />
                                  ) : (
                                    <span className="text-sm text-gray-500">
                                      {existing ? `৳${existing.costPrice.toFixed(2)}` : '—'}
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {item.bidding && proc.status ? (
                                    <button
                                      onClick={() => handleSubmitBid(item.id)}
                                      disabled={isSaving}
                                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#0F9D8F] text-white text-sm rounded-lg hover:bg-[#0c7d72] disabled:opacity-50"
                                    >
                                      <Save size={14} />
                                      {isSaving ? 'Saving...' : existing ? 'Update' : 'Submit'}
                                    </button>
                                  ) : (
                                    <span className="text-sm text-gray-400">—</span>
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