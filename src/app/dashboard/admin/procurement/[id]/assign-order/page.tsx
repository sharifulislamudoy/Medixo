'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { Search, Filter, Save, ChevronDown, X, Check } from 'lucide-react';
import { Combobox } from '@headlessui/react'; // or use a custom select; we'll use a simple select with search

// Types
interface Assignment {
  supplierId: string;
  supplierName: string;
  supplierShop: string | null;
  quantity: number;
  costPrice: number;
}

interface ProcurementItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  sku: string;
  brandName: string | null;
  mrp: number;
  costPrice: number;
  sellPrice: number;
  orderQuantity: number;
  currentStock: number;
  requiredQuantity: number;
  bidding: boolean;
  assignments: Assignment[];
}

interface Supplier {
  id: string;
  name: string;
  shopName: string | null;
  email: string;
}

export default function AssignProcurementPage() {
  const { id } = useParams();
  const router = useRouter();
  const [items, setItems] = useState<ProcurementItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<ProcurementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);

  // Supplier selection
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);

  // Selected items for bulk assignment
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

  // Draft key for localStorage
  const draftKey = `procurement-assign-${id}`;

  // Load data
  useEffect(() => {
    fetchProcurement();
    fetchSuppliers();
  }, [id]);

  const fetchProcurement = async () => {
    try {
      const res = await fetch(`/api/admin/procurement/${id}/assign`);
      const data = await res.json();
      if (res.ok) {
        const itemsData = data.procurement.items;
        // Try to load draft from localStorage
        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft) {
          try {
            const draft = JSON.parse(savedDraft);
            setItems(draft);
            setFilteredItems(draft);
            extractBrands(draft);
          } catch {
            setItems(itemsData);
            setFilteredItems(itemsData);
            extractBrands(itemsData);
          }
        } else {
          setItems(itemsData);
          setFilteredItems(itemsData);
          extractBrands(itemsData);
        }
      } else {
        toast.error('Failed to load procurement');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async (search = '') => {
    try {
      const res = await fetch(`/api/admin/suppliers?q=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (res.ok) setSuppliers(data.suppliers);
    } catch (error) {
      console.error('Failed to fetch suppliers');
    }
  };

  const extractBrands = (itemList: ProcurementItem[]) => {
    const brandMap = new Map<string, { id: string; name: string }>();
    itemList.forEach((item) => {
      if (item.brandName && !brandMap.has(item.brandName)) {
        brandMap.set(item.brandName, { id: item.brandName, name: item.brandName });
      }
    });
    setBrands(Array.from(brandMap.values()));
  };

  // Save draft to localStorage whenever items change
  useEffect(() => {
    if (items.length > 0) {
      localStorage.setItem(draftKey, JSON.stringify(items));
    }
  }, [items, draftKey]);

  // Filter items
  useEffect(() => {
    let filtered = items;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.productName.toLowerCase().includes(term) ||
          p.sku.toLowerCase().includes(term)
      );
    }
    if (selectedBrand) {
      filtered = filtered.filter((p) => p.brandName === selectedBrand);
    }
    setFilteredItems(filtered);
  }, [searchTerm, selectedBrand, items]);

  // Toggle item selection
  const toggleSelectItem = (itemId: string) => {
    const newSet = new Set(selectedItemIds);
    if (newSet.has(itemId)) newSet.delete(itemId);
    else newSet.add(itemId);
    setSelectedItemIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedItemIds.size === filteredItems.length) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(filteredItems.map((i) => i.id)));
    }
  };

  // Assign selected items to current supplier
  const assignToSelectedSupplier = () => {
    if (!selectedSupplier) {
      toast.error('Please select a supplier first');
      return;
    }
    if (selectedItemIds.size === 0) {
      toast.error('Please select at least one product');
      return;
    }

    setItems((prev) =>
      prev.map((item) => {
        if (!selectedItemIds.has(item.id)) return item;

        // Check if assignment already exists for this supplier
        const existingIndex = item.assignments.findIndex(
          (a) => a.supplierId === selectedSupplier.id
        );

        let newAssignments;
        if (existingIndex >= 0) {
          // Update existing (quantity and cost remain as is, but we might want to keep them)
          newAssignments = [...item.assignments];
        } else {
          // Add new assignment with default quantity = requiredQuantity, cost = costPrice
          newAssignments = [
            ...item.assignments,
            {
              supplierId: selectedSupplier.id,
              supplierName: selectedSupplier.name,
              supplierShop: selectedSupplier.shopName,
              quantity: item.requiredQuantity,
              costPrice: item.costPrice,
            },
          ];
        }
        return { ...item, assignments: newAssignments };
      })
    );
    // Clear selections after assignment
    setSelectedItemIds(new Set());
  };

  // Update assignment fields for a specific product and supplier
  const updateAssignment = (
    itemId: string,
    supplierId: string,
    field: 'quantity' | 'costPrice',
    value: number
  ) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const assignments = item.assignments.map((a) =>
          a.supplierId === supplierId ? { ...a, [field]: value } : a
        );
        return { ...item, assignments };
      })
    );
  };

  // Remove assignment
  const removeAssignment = (itemId: string, supplierId: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        return {
          ...item,
          assignments: item.assignments.filter((a) => a.supplierId !== supplierId),
        };
      })
    );
  };

  // Calculate remaining and extra quantities per item
  const getRemainingAndExtra = (item: ProcurementItem) => {
    const totalAssigned = item.assignments.reduce((sum, a) => sum + a.quantity, 0);
    const remaining = Math.max(0, item.requiredQuantity - totalAssigned);
    const extra = Math.max(0, totalAssigned - item.requiredQuantity);
    return { totalAssigned, remaining, extra };
  };

  // Save to server
  const handleSave = async () => {
    setSaving(true);
    try {
      // Prepare payload
      const allAssignments: any[] = [];
      items.forEach((item) => {
        item.assignments.forEach((a) => {
          allAssignments.push({
            procurementItemId: item.id,
            supplierId: a.supplierId,
            quantity: a.quantity,
            costPrice: a.costPrice,
          });
        });
      });

      const res = await fetch(`/api/admin/procurement/${id}/assign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignments: allAssignments }),
      });

      if (res.ok) {
        toast.success('Assignments saved successfully');
        localStorage.removeItem(draftKey);
        router.push('/dashboard/admin/procurement');
      } else {
        toast.error('Failed to save assignments');
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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Assign Orders to Suppliers</h1>
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-600 hover:text-gray-800"
        >
          ← Back
        </button>
      </div>

      {/* Supplier Selector & Bulk Assign */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[300px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Supplier
            </label>
            <div className="relative">
              <Combobox value={selectedSupplier} onChange={setSelectedSupplier}>
                <div className="relative">
                  <Combobox.Input
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#0F9D8F] focus:border-[#0F9D8F] outline-none text-black"
                    placeholder="Search supplier by name or shop..."
                    onChange={(e) => {
                      setSupplierSearch(e.target.value);
                      fetchSuppliers(e.target.value);
                    }}
                    displayValue={(supplier: Supplier) =>
                      supplier ? `${supplier.name} ${supplier.shopName ? `(${supplier.shopName})` : ''}` : ''
                    }
                  />
                  <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </Combobox.Button>
                </div>
                <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                  {suppliers.length === 0 && supplierSearch !== '' ? (
                    <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                      Nothing found.
                    </div>
                  ) : (
                    suppliers.map((supplier) => (
                      <Combobox.Option
                        key={supplier.id}
                        value={supplier}
                        className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-10 pr-4 ${
                            active ? 'bg-[#0F9D8F] text-white' : 'text-gray-900'
                          }`
                        }
                      >
                        {({ selected, active }) => (
                          <>
                            <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                              {supplier.name} {supplier.shopName && `(${supplier.shopName})`}
                            </span>
                            {selected ? (
                              <span
                                className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                  active ? 'text-white' : 'text-[#0F9D8F]'
                                }`}
                              >
                                <Check className="h-5 w-5" aria-hidden="true" />
                              </span>
                            ) : null}
                          </>
                        )}
                      </Combobox.Option>
                    ))
                  )}
                </Combobox.Options>
              </Combobox>
            </div>
          </div>
          <button
            onClick={assignToSelectedSupplier}
            disabled={!selectedSupplier || selectedItemIds.size === 0}
            className="px-4 py-2 bg-[#0F9D8F] text-white rounded-lg hover:bg-[#0c7d72] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Assign to Selected ({selectedItemIds.size})
          </button>
        </div>
      </div>

      {/* Search & Brand Filter */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search product name or SKU..."
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
              <option key={b.id} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full min-w-[1400px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-3 py-3 w-10">
                <input
                  type="checkbox"
                  checked={filteredItems.length > 0 && selectedItemIds.size === filteredItems.length}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 text-[#0F9D8F] border-gray-300 rounded focus:ring-[#0F9D8F]"
                />
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Product</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">MRP</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Cost</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Sell</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Order Qty</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Stock</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Required</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Ordered To</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Remain</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Extra</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <AnimatePresence>
              {filteredItems.map((item) => {
                const { totalAssigned, remaining, extra } = getRemainingAndExtra(item);
                return (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="hover:bg-gray-50/80"
                  >
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selectedItemIds.has(item.id)}
                        onChange={() => toggleSelectItem(item.id)}
                        className="w-4 h-4 text-[#0F9D8F] border-gray-300 rounded focus:ring-[#0F9D8F]"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="relative w-8 h-8 flex-shrink-0 bg-gray-100 rounded border">
                          <Image
                            src={item.productImage}
                            alt={item.productName}
                            fill
                            className="object-contain p-1"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate max-w-[200px]">
                            {item.productName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {item.sku} {item.brandName && `• ${item.brandName}`}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-700">৳{item.mrp.toFixed(2)}</td>
                    <td className="px-3 py-3 text-sm text-gray-700">৳{item.costPrice.toFixed(2)}</td>
                    <td className="px-3 py-3 text-sm text-gray-700">৳{item.sellPrice.toFixed(2)}</td>
                    <td className="px-3 py-3 text-sm text-gray-700">{item.orderQuantity}</td>
                    <td className="px-3 py-3 text-sm text-gray-700">{item.currentStock}</td>
                    <td className="px-3 py-3 text-sm font-medium text-gray-800">{item.requiredQuantity}</td>
                    <td className="px-3 py-3">
                      <div className="space-y-2 min-w-[220px]">
                        {item.assignments.map((assignment) => (
                          <div
                            key={assignment.supplierId}
                            className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-800 truncate">
                                {assignment.supplierName}
                                {assignment.supplierShop && ` (${assignment.supplierShop})`}
                              </p>
                              <div className="flex items-center gap-1 mt-1">
                                <input
                                  type="number"
                                  min="0"
                                  value={assignment.quantity}
                                  onChange={(e) =>
                                    updateAssignment(
                                      item.id,
                                      assignment.supplierId,
                                      'quantity',
                                      parseInt(e.target.value) || 0
                                    )
                                  }
                                  className="w-16 px-1 py-0.5 text-gray-600 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[#0F9D8F]"
                                  placeholder="Qty"
                                />
                                <input
                                  type="number"
                                  min="0"
                                  value={assignment.costPrice}
                                  onChange={(e) =>
                                    updateAssignment(
                                      item.id,
                                      assignment.supplierId,
                                      'costPrice',
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  className="w-20 px-1 py-0.5 text-xs text-gray-600 border border-gray-300 rounded focus:ring-1 focus:ring-[#0F9D8F]"
                                  placeholder="Cost"
                                />
                              </div>
                            </div>
                            <button
                              onClick={() => removeAssignment(item.id, assignment.supplierId)}
                              className="text-gray-400 hover:text-red-500"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                        {item.assignments.length === 0 && (
                          <span className="text-xs text-gray-400 italic">Not assigned</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-sm">
                      <span className={remaining > 0 ? 'text-orange-600 font-medium' : 'text-gray-600'}>
                        {remaining}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-sm">
                      <span className={extra > 0 ? 'text-red-600 font-medium' : 'text-gray-600'}>{extra}</span>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
        {filteredItems.length === 0 && (
          <div className="text-center py-12 text-gray-500">No items match the filters.</div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-[#0F9D8F] text-white rounded-lg hover:bg-[#0c7d72] disabled:opacity-50 flex items-center gap-2"
        >
          <Save size={18} />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </motion.div>
  );
}