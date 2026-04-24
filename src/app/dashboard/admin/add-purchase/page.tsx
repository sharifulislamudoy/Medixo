"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import toast from "react-hot-toast";

interface Supplier {
  id: string;
  name: string;
  shopName: string;
  phone: string;
}

interface ProductOption {
  id: string;
  name: string;
  sku: string;
  mrp: number;
  costPrice: number;
  profitMargin: number;
  sellPrice: number;
  stock: number;
  image: string;
  nextPurchasePrice?: number;
}

interface PurchaseItem {
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  costPrice: number;
  profitMargin: number;
  sellPrice: number;
  totalCost: number;
  mrp: number;
  nextPurchasePrice?: number;
}

const roundToTwo = (num: number): number => {
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

export default function AddPurchasePage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentStatus, setPaymentStatus] = useState<"PAID" | "DUE">("DUE");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [updateProductDefaults, setUpdateProductDefaults] = useState(false);
  const [loading, setLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProducts, setFilteredProducts] = useState<ProductOption[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Debounce timer ref
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchSuppliers();

    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuppliers = async () => {
    const res = await fetch("/api/suppliers");
    const data = await res.json();
    setSuppliers(data);
  };

  // Fetch suggestions from the API with debounce
  const fetchSuggestions = useCallback(async (term: string) => {
    if (!term || term.trim().length < 2) {
      setFilteredProducts([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch("/api/products/search-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: term }),
      });
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setFilteredProducts(data.products || []);
    } catch (error) {
      console.error(error);
      toast.error("Search failed");
      setFilteredProducts([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced effect
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(searchTerm);
    }, 300); // 300ms debounce
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [searchTerm, fetchSuggestions]);

  const addProductFromSuggestion = (product: ProductOption) => {
    if (items.some((item) => item.productId === product.id)) {
      toast.error("Product already added");
      return;
    }
    const costPrice = product.nextPurchasePrice ?? product.costPrice;
    const profitMargin = product.profitMargin;
    const sellPrice = roundToTwo(costPrice * (1 + profitMargin / 100));
    const nextPurchasePrice = roundToTwo(sellPrice * (99 - profitMargin) / 100);

    setItems([
      ...items,
      {
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        quantity: 1,
        costPrice: roundToTwo(costPrice),
        profitMargin,
        sellPrice,
        totalCost: roundToTwo(costPrice),
        mrp: product.mrp,
        nextPurchasePrice,
      },
    ]);
    setSearchTerm("");
    setShowSuggestions(false);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updated = [...items];
    let numericValue = parseFloat(value);
    if (isNaN(numericValue)) numericValue = 0;

    if (field === "quantity") {
      updated[index].quantity = Math.floor(numericValue);
    } else if (field === "costPrice") {
      updated[index].costPrice = roundToTwo(numericValue);
    } else if (field === "profitMargin") {
      updated[index].profitMargin = numericValue;
    } else if (field === "mrp") {
      updated[index].mrp = roundToTwo(numericValue);
    } else if (field === "nextPurchasePrice") {
      updated[index].nextPurchasePrice = roundToTwo(numericValue);
    }

    const { costPrice, profitMargin } = updated[index];
    updated[index].sellPrice = roundToTwo(costPrice * (1 + profitMargin / 100));
    updated[index].totalCost = roundToTwo(updated[index].quantity * costPrice);

    if (field !== "nextPurchasePrice") {
      updated[index].nextPurchasePrice = roundToTwo(updated[index].sellPrice * (99 - profitMargin) / 100);
    }
    setItems(updated);
  };

  const getTotalAmount = () => {
    return items.reduce((sum, item) => sum + item.totalCost, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) {
      toast.error("Please select a supplier");
      return;
    }
    if (items.length === 0) {
      toast.error("Add at least one product");
      return;
    }
    for (const item of items) {
      if (!item.productId || item.quantity <= 0 || item.costPrice <= 0) {
        toast.error("Please fill all product fields correctly");
        return;
      }
    }

    setLoading(true);
    const toastId = toast.loading("Creating purchase...");
    try {
      const res = await fetch("/api/admin/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: selectedSupplier,
          purchaseDate,
          paymentStatus,
          notes,
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            costPrice: roundToTwo(item.costPrice),
            profitMargin: item.profitMargin,
            mrp: roundToTwo(item.mrp),
            nextPurchasePrice: item.nextPurchasePrice ? roundToTwo(item.nextPurchasePrice) : null,
          })),
          updateProductDefaults,
        }),
      });
      if (!res.ok) throw new Error("Failed to create");
      toast.success("Purchase created", { id: toastId });
      router.push("/dashboard/admin/list-purchases");
    } catch (error) {
      toast.error("Failed to create purchase", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto space-y-6 pb-20"
    >
      <h1 className="text-3xl font-bold text-gray-800">Add New Purchase</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Supplier & Basic Info */}
        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier *</label>
              <select
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#0F9D8F] focus:border-[#0F9D8F] outline-none"
                required
              >
                <option value="">Select supplier</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.shopName || s.name} ({s.phone})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#0F9D8F] focus:border-[#0F9D8F] outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as "PAID" | "DUE")}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#0F9D8F] focus:border-[#0F9D8F] outline-none"
              >
                <option value="DUE">Due</option>
                <option value="PAID">Paid</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#0F9D8F] focus:border-[#0F9D8F] outline-none"
              />
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Products</h2>

          {/* Search Input */}
          <div className="relative mb-4" ref={searchRef}>
            <input
              type="text"
              placeholder="Search product by name or SKU..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#0F9D8F] focus:border-[#0F9D8F] outline-none"
            />
            {isSearching && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
                Loading suggestions...
              </div>
            )}
            {showSuggestions && !isSearching && filteredProducts.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                    onClick={() => addProductFromSuggestion(product)}
                  >
                    <div>
                      <div className="font-medium text-gray-900">{product.name}</div>
                      <div className="text-xs text-gray-500">SKU: {product.sku} | Stock: {product.stock}</div>
                    </div>
                    <button type="button" className="text-[#0F9D8F] text-sm">+ Add</button>
                  </div>
                ))}
              </div>
            )}
            {showSuggestions && !isSearching && searchTerm.trim().length >= 2 && filteredProducts.length === 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
                No products found. Try a different search term.
              </div>
            )}
          </div>

          {/* Products Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-2 py-2 text-left text-sm font-medium text-gray-700">Product</th>
                  <th className="px-2 py-2 text-left text-sm font-medium text-gray-700">Qty</th>
                  <th className="px-2 py-2 text-left text-sm font-medium text-gray-700">Cost (৳)</th>
                  <th className="px-2 py-2 text-left text-sm font-medium text-gray-700">Margin %</th>
                  <th className="px-2 py-2 text-left text-sm font-medium text-gray-700">Sell (৳)</th>
                  <th className="px-2 py-2 text-left text-sm font-medium text-gray-700">MRP (৳)</th>
                  <th className="px-2 py-2 text-left text-sm font-medium text-gray-700">Total (৳)</th>
                  <th className="px-2 py-2 text-left text-sm font-medium text-gray-700">Next Purchase (৳)</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-200">
                    <td className="px-2 py-2">
                      <div className="font-medium text-gray-900">{item.productName}</div>
                      <div className="text-xs text-gray-500">{item.productSku}</div>
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        min="0"
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                        className="w-24 border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 focus:ring-1 focus:ring-[#0F9D8F] focus:border-[#0F9D8F] outline-none"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        min="0"
                        value={item.costPrice}
                        onChange={(e) => updateItem(idx, "costPrice", e.target.value)}
                        className="w-28 border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 focus:ring-1 focus:ring-[#0F9D8F] focus:border-[#0F9D8F] outline-none"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        min="0"
                        value={item.profitMargin}
                        onChange={(e) => updateItem(idx, "profitMargin", e.target.value)}
                        className="w-24 border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 focus:ring-1 focus:ring-[#0F9D8F] focus:border-[#0F9D8F] outline-none"
                      />
                    </td>
                    <td className="px-2 py-2 text-sm text-gray-900">{item.sellPrice.toFixed(2)}</td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        min="0"
                        value={item.mrp}
                        onChange={(e) => updateItem(idx, "mrp", e.target.value)}
                        className="w-28 border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 focus:ring-1 focus:ring-[#0F9D8F] focus:border-[#0F9D8F] outline-none"
                      />
                    </td>
                    <td className="px-2 py-2 text-sm text-gray-900">{item.totalCost.toFixed(2)}</td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        min="0"
                        value={item.nextPurchasePrice?.toFixed(2) ?? ""}
                        onChange={(e) => updateItem(idx, "nextPurchasePrice", e.target.value)}
                        className="w-28 border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 focus:ring-1 focus:ring-[#0F9D8F] focus:border-[#0F9D8F] outline-none"
                        placeholder="Auto"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {items.length === 0 && (
            <div className="text-center py-6 text-gray-500">No products added. Search and add products above.</div>
          )}

          <div className="mt-4 text-right font-bold text-lg text-gray-900">
            Total Amount: ৳{getTotalAmount().toFixed(2)}
          </div>

          <div className="mt-4 flex items-center gap-2">
            <input
              type="checkbox"
              id="updateDefaults"
              checked={updateProductDefaults}
              onChange={(e) => setUpdateProductDefaults(e.target.checked)}
              className="rounded border-gray-300 text-[#0F9D8F] focus:ring-[#0F9D8F]"
            />
            <label htmlFor="updateDefaults" className="text-sm text-gray-700">
              Update product's default cost price, profit margin & MRP with these values
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-gradient-to-r from-[#156A98] to-[#0F9D8F] text-white rounded-lg shadow-md disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Purchase"}
          </button>
        </div>
      </form>
    </motion.div>
  );
}