'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { Search, Filter, Send, Save } from 'lucide-react';

interface ProcurementProduct {
  productId: string;
  productName: string;
  productImage: string;
  sku: string;
  brandName: string | null;
  mrp: number;
  costPrice: number;
  sellPrice: number;
  currentStock: number;
  orderQuantity: number;
  requiredQuantity: number;
  bidding: boolean;
}

interface Brand {
  id: string;
  name: string;
}

export default function NewProcurementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderIds = searchParams.get('orderIds')?.split(',') || [];

  const [products, setProducts] = useState<ProcurementProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProcurementProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [brands, setBrands] = useState<Brand[]>([]);
  const [saving, setSaving] = useState(false);

  // Load draft from localStorage on mount
  useEffect(() => {
    const draftKey = `procurement-draft-${orderIds.join('-')}`;
    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setProducts(parsed);
        setFilteredProducts(parsed);
        // Extract unique brands from draft
        extractBrandsFromProducts(parsed);
        setLoading(false);
      } catch (e) {
        fetchAggregatedData();
      }
    } else {
      fetchAggregatedData();
    }
  }, []);

  const fetchAggregatedData = async () => {
    try {
      const res = await fetch('/api/admin/procurement/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds }),
      });
      const data = await res.json();
      if (res.ok) {
        // Calculate required quantity = orderQuantity + Math.abs(currentStock)
        const productsWithRequired = data.products.map((p: any) => ({
          ...p,
          requiredQuantity: p.orderQuantity + Math.abs(p.currentStock),
          bidding: false,
        }));
        setProducts(productsWithRequired);
        setFilteredProducts(productsWithRequired);
        // Extract unique brands from products
        extractBrandsFromProducts(productsWithRequired);
        // Save initial draft
        const draftKey = `procurement-draft-${orderIds.join('-')}`;
        localStorage.setItem(draftKey, JSON.stringify(productsWithRequired));
      } else {
        toast.error(data.error || 'Failed to load products');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Extract unique brands from product list
  const extractBrandsFromProducts = (productList: ProcurementProduct[]) => {
    const brandMap = new Map<string, Brand>();
    productList.forEach(p => {
      if (p.brandName && !brandMap.has(p.brandName)) {
        brandMap.set(p.brandName, { id: p.brandName, name: p.brandName });
      }
    });
    setBrands(Array.from(brandMap.values()));
  };

  // Save draft to localStorage whenever products change
  useEffect(() => {
    if (products.length > 0) {
      const draftKey = `procurement-draft-${orderIds.join('-')}`;
      localStorage.setItem(draftKey, JSON.stringify(products));
      // Update brands when products change (e.g., after manual edits that might affect brand? not needed)
    }
  }, [products, orderIds]);

  // Filter products based on search and brand
  useEffect(() => {
    let filtered = products;
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
    setFilteredProducts(filtered);
  }, [searchTerm, selectedBrand, products]);

  // Update a field for a specific product
  const updateProductField = (productId: string, field: keyof ProcurementProduct, value: any) => {
    setProducts(prev => prev.map(p =>
      p.productId === productId ? { ...p, [field]: value } : p
    ));
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/procurement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: products }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Procurement ${data.procurement.prNumber} created`);
        // Clear draft
        localStorage.removeItem(`procurement-draft-${orderIds.join('-')}`);
        router.push('/dashboard/admin/procurement');
      } else {
        toast.error(data.error || 'Failed to create procurement');
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 p-4"
    >
      <h1 className="text-3xl font-bold text-gray-800">Create Procurement</h1>

      {/* Search & Filter Bar */}
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
            {brands.map(brand => (
              <option key={brand.id} value={brand.name}>{brand.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full min-w-[1200px]">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase">Product</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase">MRP</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase">Cost</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase">Sell Price</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase">Order Qty</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase">Stock</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase">Required</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase">Bidding</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredProducts.map((prod) => (
              <tr key={prod.productId} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 flex-shrink-0">
                      <Image src={prod.productImage} alt={prod.productName} fill className="object-contain rounded" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{prod.productName}</p>
                      <p className="text-xs text-gray-500">{prod.sku} {prod.brandName && `• ${prod.brandName}`}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    step="0.01"
                    value={prod.mrp}
                    onChange={(e) => updateProductField(prod.productId, 'mrp', parseFloat(e.target.value) || 0)}
                    className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-[#0F9D8F] focus:border-[#0F9D8F] text-black"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    step="0.01"
                    value={prod.costPrice}
                    onChange={(e) => updateProductField(prod.productId, 'costPrice', parseFloat(e.target.value) || 0)}
                    className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-[#0F9D8F] focus:border-[#0F9D8F] text-black"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    step="0.01"
                    value={prod.sellPrice}
                    onChange={(e) => updateProductField(prod.productId, 'sellPrice', parseFloat(e.target.value) || 0)}
                    className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-[#0F9D8F] focus:border-[#0F9D8F] text-black"
                  />
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">{prod.orderQuantity}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{prod.currentStock}</td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    min="0"
                    value={prod.requiredQuantity}
                    onChange={(e) => updateProductField(prod.productId, 'requiredQuantity', parseInt(e.target.value) || 0)}
                    className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-[#0F9D8F] focus:border-[#0F9D8F] text-black"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={prod.bidding}
                    onChange={(e) => updateProductField(prod.productId, 'bidding', e.target.checked)}
                    className="w-4 h-4 text-[#0F9D8F] border-gray-300 rounded focus:ring-[#0F9D8F]"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredProducts.length === 0 && (
          <div className="text-center py-12 text-gray-500">No products match the filters.</div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <button
          onClick={() => router.back()}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving || products.length === 0}
          className="px-6 py-2 bg-[#0F9D8F] text-white rounded-lg hover:bg-[#0c7d72] disabled:opacity-50 flex items-center gap-2"
        >
          <Send size={18} />
          {saving ? 'Sending...' : 'Send Request'}
        </button>
      </div>
    </motion.div>
  );
}