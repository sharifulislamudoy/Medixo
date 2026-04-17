'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';

interface ProcurementItem {
  id: string;
  product: { name: string; image: string; sku: string };
  orderQuantity: number;
  mrp: number | null;
  costPrice: number | null;
  sellPrice: number | null;
  requiredQuantity: number;
  bidding: boolean;
}

interface Procurement {
  id: string;
  prNumber: string;
  createdAt: string;
  status: boolean;
  notes: string | null;
  items: ProcurementItem[];
}

export default function ViewProcurementPage() {
  const { id } = useParams();
  const router = useRouter();
  const [procurement, setProcurement] = useState<Procurement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProcurement();
  }, [id]);

  const fetchProcurement = async () => {
    try {
      const res = await fetch(`/api/admin/procurement/${id}`);
      const data = await res.json();
      if (res.ok) setProcurement(data.procurement);
      else toast.error('Failed to load procurement');
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0F9D8F]"></div>
      </div>
    );
  }

  if (!procurement) {
    return (
      <div className="text-center py-12 text-gray-500 text-lg">
        Procurement not found.
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 p-4 md:p-6"
    >
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft size={20} />
        <span className="text-sm font-medium">Back</span>
      </button>

      {/* Header Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 tracking-tight">
              {procurement.prNumber}
            </h1>
            <div className="flex flex-wrap items-center gap-4 mt-2">
              <p className="text-sm text-gray-600">
                <span className="font-medium text-gray-700">Created:</span>{' '}
                {new Date(procurement.createdAt).toLocaleString()}
              </p>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-gray-700">Status:</span>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    procurement.status
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {procurement.status ? (
                    <>
                      <CheckCircle size={12} />
                      Active
                    </>
                  ) : (
                    <>
                      <XCircle size={12} />
                      Inactive
                    </>
                  )}
                </span>
              </div>
            </div>
            {procurement.notes && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Notes:</span> {procurement.notes}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Items Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
          <h2 className="text-lg font-semibold text-gray-800">Items</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  MRP
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Cost
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Sell Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Order Qty
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Required
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Bidding
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {procurement.items.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-gray-50/80 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 flex-shrink-0 bg-gray-100 rounded-lg border border-gray-200 overflow-hidden">
                        <Image
                          src={item.product.image}
                          alt={item.product.name}
                          fill
                          className="object-contain p-1"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-800 truncate">
                          {item.product.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          SKU: {item.product.sku}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-gray-800">
                      {item.mrp != null ? `৳${item.mrp.toFixed(2)}` : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-gray-800">
                      {item.costPrice != null ? `৳${item.costPrice.toFixed(2)}` : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-gray-800">
                      {item.sellPrice != null ? `৳${item.sellPrice.toFixed(2)}` : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-700">
                      {item.orderQuantity}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-semibold text-[#0F9D8F]">
                      {item.requiredQuantity}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        item.bidding
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {item.bidding ? 'Yes' : 'No'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {procurement.items.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No items in this procurement.
          </div>
        )}
      </div>
    </motion.div>
  );
}