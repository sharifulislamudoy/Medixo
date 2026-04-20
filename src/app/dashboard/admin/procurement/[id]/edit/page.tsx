'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { Search, Filter, Save, ArrowLeft } from 'lucide-react';

interface ProcurementItem {
  id?: string;
  productId: string;
  productName: string;
  productImage: string;
  sku: string;
  brandName: string | null;
  mrp: number | null;
  costPrice: number | null;
  sellPrice: number | null;
  orderQuantity: number;
  requiredQuantity: number;
  bidding: boolean;
}

interface Brand {
  id: string;
  name: string;
}

export default function EditProcurementPage() {
  const { id } = useParams();
  const router = useRouter();
  const [items, setItems] = useState<ProcurementItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<ProcurementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [brands, setBrands] = useState<Brand[]>([]);
  const [saving, setSaving] = useState(false);
  const [procurementStatus, setProcurementStatus] = useState(true);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchProcurement();
  }, [id]);

  const fetchProcurement = async () => {
    try {
      const res = await fetch(`/api/admin/procurement/${id}`);
      const data = await res.json();
      if (res.ok) {
        setProcurementStatus(data.procurement.status);
        setNotes(data.procurement.notes || '');
        const mappedItems = data.procurement.items.map((item: any) => ({
          productId: item.productId,
          productName: item.product.name,
          productImage: item.product.image,
          sku: item.product.sku,
          brandName: item.product.brand?.name || null,
          mrp: item.mrp,
          costPrice: item.costPrice,
          sellPrice: item.sellPrice,
          orderQuantity: item.orderQuantity,
          requiredQuantity: item.requiredQuantity,
          bidding: item.bidding,
        }));
        setItems(mappedItems);
        setFilteredItems(mappedItems);
        extractBrands(mappedItems);
      } else {
        toast.error('Failed to load procurement');
        router.push('/dashboard/admin/procurement');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const extractBrands = (itemList: ProcurementItem[]) => {
    const brandMap = new Map<string, Brand>();
    itemList.forEach(item => {
      if (item.brandName && !brandMap.has(item.brandName)) {
        brandMap.set(item.brandName, { id: item.brandName, name: item.brandName });
      }
    });
    setBrands(Array.from(brandMap.values()));
  };

  useEffect(() => {
    let filtered = items;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.productName.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term)
      );
    }
    if (selectedBrand) {
      filtered = filtered.filter(p => p.brandName === selectedBrand);
    }
    setFilteredItems(filtered);
  }, [searchTerm, selectedBrand, items]);

  const updateItemField = (productId: string, field: keyof ProcurementItem, value: any) => {
    setItems(prev => prev.map(p =>
      p.productId === productId ? { ...p, [field]: value } : p
    ));
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/procurement/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, status: procurementStatus, notes }),
      });
      if (res.ok) {
        toast.success('Procurement updated');
        router.push('/dashboard/admin/procurement');
      } else {
        toast.error('Failed to update');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setSaving(false);
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-4 md:p-6">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft size={20} />
        <span className="text-sm font-medium">Back</span>
      </button>

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Edit Procurement</h1>
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by product name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0F9D8F] focus:border-[#0F9D8F] outline-none text-black"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0F9D8F] focus:border-[#0F9D8F] outline-none bg-white text-black"
          >
            <option value="">All Brands</option>
            {brands.map((b) => (
              <option key={b.id} value={b.name}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">Status:</span>
          <select
            value={procurementStatus ? 'true' : 'false'}
            onChange={(e) => setProcurementStatus(e.target.value === 'true')}
            className="border border-gray-300 text-black rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-[#0F9D8F] focus:border-[#0F9D8F] outline-none bg-white"
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
        <div className="flex-1 w-full">
          <input
            type="text"
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full text-gray-500 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0F9D8F] focus:border-[#0F9D8F] outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Product</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">MRP</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Cost</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Sell Price</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Order Qty</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Required</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Bidding</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredItems.map((item) => (
                <tr key={item.productId} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 flex-shrink-0 bg-gray-100 rounded-lg border border-gray-200 overflow-hidden">
                        <Image src={item.productImage} alt={item.productName} fill className="object-contain p-1" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-800 truncate">{item.productName}</p>
                        <p className="text-xs text-gray-500 mt-0.5">SKU: {item.sku}</p>
                        {item.brandName && <p className="text-xs text-gray-400">{item.brandName}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      step="0.01"
                      value={item.mrp ?? ''}
                      onChange={(e) => updateItemField(item.productId, 'mrp', parseFloat(e.target.value) || null)}
                      className="w-28 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-[#0F9D8F] focus:border-[#0F9D8F] outline-none text-gray-800"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      step="0.01"
                      value={item.costPrice ?? ''}
                      onChange={(e) => updateItemField(item.productId, 'costPrice', parseFloat(e.target.value) || null)}
                      className="w-28 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-[#0F9D8F] focus:border-[#0F9D8F] outline-none text-gray-800"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      step="0.01"
                      value={item.sellPrice ?? ''}
                      onChange={(e) => updateItemField(item.productId, 'sellPrice', parseFloat(e.target.value) || null)}
                      className="w-28 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-[#0F9D8F] focus:border-[#0F9D8F] outline-none text-gray-800"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-gray-700">{item.orderQuantity}</span>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min="0"
                      value={item.requiredQuantity}
                      onChange={(e) => updateItemField(item.productId, 'requiredQuantity', parseInt(e.target.value) || 0)}
                      className="w-28 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-[#0F9D8F] focus:border-[#0F9D8F] outline-none text-gray-800"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={item.bidding}
                      onChange={(e) => updateItemField(item.productId, 'bidding', e.target.checked)}
                      className="w-4 h-4 text-[#0F9D8F] border-gray-300 rounded focus:ring-[#0F9D8F]"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredItems.length === 0 && (
          <div className="text-center py-12 text-gray-500">No items match the filters.</div>
        )}
      </div>

      <div className="flex justify-end gap-4">
        <button onClick={() => router.back()} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
          Cancel
        </button>
        <button onClick={handleSubmit} disabled={saving} className="px-6 py-2 bg-[#0F9D8F] text-white rounded-lg hover:bg-[#0c7d72] disabled:opacity-50 flex items-center gap-2 transition-colors">
          <Save size={18} />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </motion.div>
  );
}