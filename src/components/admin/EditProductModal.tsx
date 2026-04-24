"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Modal from "@/components/ui/Modal";
import Image from "next/image";
import toast from "react-hot-toast";
import { Sparkles } from "lucide-react";

const cloudName = "dohhfubsa";
const uploadPreset = "react_unsigned";

const categories = [
  "MEDICINE",
  "SURGICAL",
  "OTC",
  "HERBAL",
  "DIABETES_CARE",
  "CARDIAC",
  "INJECTABLE",
  "MEDI_DEVICE",
  "OTHER",
];

interface Product {
  id: string;
  name: string;
  category: string;
  mrp: number;
  generic: { name: string } | null;
  brand: { name: string } | null;
  image: string;
  description: string;
  sellPrice: number;
  costPrice: number;
  profitMargin: number;
  costMargin?: number;      // 👈 NEW
  stock: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product: Product | null;
}

export default function EditProductModal({ isOpen, onClose, onSuccess, product }: Props) {
  const [form, setForm] = useState({
    name: "",
    category: "MEDICINE",
    mrp: "",
    genericName: "",
    brandName: "",
    image: "",
    description: "",
    costPrice: "",
    profitMargin: "",
    costMargin: "",      // 👈 NEW
    stock: "",
  });

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genericSuggestions, setGenericSuggestions] = useState<string[]>([]);
  const [brandSuggestions, setBrandSuggestions] = useState<string[]>([]);

  const computedSellPrice = (): string => {
    const cost = parseFloat(form.costPrice);
    const margin = parseFloat(form.profitMargin);
    if (isNaN(cost) || isNaN(margin)) return "0.00";
    return (cost * (1 + margin / 100)).toFixed(2);
  };

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        category: product.category,
        mrp: product.mrp.toString(),
        genericName: product.generic?.name || "",
        brandName: product.brand?.name || "",
        image: product.image,
        description: product.description,
        costPrice: product.costPrice.toString(),
        profitMargin: product.profitMargin.toString(),
        costMargin: product.costMargin != null ? product.costMargin.toString() : "",   // 👈
        stock: product.stock.toString(),
      });
    }
  }, [product]);

  useEffect(() => {
    fetch("/api/generics").then(res => res.json()).then(setGenericSuggestions);
    fetch("/api/brands").then(res => res.json()).then(setBrandSuggestions);
  }, []);

  const uploadImage = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    setUploading(false);
    return data.secure_url;
  };

  const generateDescription = async () => {
    if (!form.name || !form.category) {
      toast.error("Please enter product name and category first");
      return;
    }

    setGenerating(true);
    const toastId = toast.loading("Generating description...");

    try {
      const res = await fetch("/api/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, category: form.category }),
      });

      if (!res.ok) throw new Error("Failed to generate");

      const data = await res.json();
      setForm(prev => ({ ...prev, description: data.description }));
      toast.success("Description generated", { id: toastId });
    } catch (error) {
      toast.error("Failed to generate description", { id: toastId });
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.category || !form.mrp || !form.image || !form.description || !form.costPrice || !form.profitMargin || !form.stock) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Updating product...");

    try {
      const res = await fetch(`/api/admin/products/${product!.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),   // includes costMargin
      });

      if (!res.ok) throw new Error("Failed to update");

      toast.success("Product updated", { id: toastId });
      onSuccess();
      onClose();
    } catch (error) {
      toast.error("Failed to update product", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  if (!product) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="max-h-[80vh] overflow-y-auto p-1"
      >
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Edit Product</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#0F9D8F] focus:border-[#0F9D8F] outline-none text-black"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#0F9D8F] focus:border-[#0F9D8F] outline-none text-black"
              required
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat.replace('_', ' ')}</option>
              ))}
            </select>
          </div>

          {/* MRP */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">MRP *</label>
            <input
              type="number"
              name="mrp"
              value={form.mrp}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#0F9D8F] focus:border-[#0F9D8F] outline-none text-black"
              required
            />
          </div>

          {/* Generic */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Generic</label>
            <input
              type="text"
              name="genericName"
              value={form.genericName}
              onChange={handleChange}
              list="generic-suggestions"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#0F9D8F] focus:border-[#0F9D8F] outline-none text-black"
            />
            <datalist id="generic-suggestions">
              {genericSuggestions.map(g => <option key={g} value={g} />)}
            </datalist>
          </div>

          {/* Brand */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
            <input
              type="text"
              name="brandName"
              value={form.brandName}
              onChange={handleChange}
              list="brand-suggestions"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#0F9D8F] focus:border-[#0F9D8F] outline-none text-black"
            />
            <datalist id="brand-suggestions">
              {brandSuggestions.map(b => <option key={b} value={b} />)}
            </datalist>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Image *</label>
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                if (!e.target.files) return;
                const url = await uploadImage(e.target.files[0]);
                setForm({ ...form, image: url });
              }}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#0F9D8F]/10 file:text-[#0F9D8F] hover:file:bg-[#0F9D8F]/20"
            />
            {uploading && <p className="mt-2 text-xs text-gray-500">Uploading...</p>}
            {form.image && !uploading && (
              <div className="mt-2">
                <p className="text-xs text-green-600 mb-1">Current Image</p>
                <div className="relative w-full h-32 rounded-lg overflow-hidden border border-gray-200">
                  <Image src={form.image} alt="Preview" fill className="object-cover" />
                </div>
              </div>
            )}
          </div>

          {/* Description with Generate Button */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700">Description *</label>
              <button
                type="button"
                onClick={generateDescription}
                disabled={generating || !form.name}
                className="flex items-center gap-1 text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full hover:bg-purple-200 disabled:opacity-50"
              >
                <Sparkles size={16} />
                {generating ? "Generating..." : "Generate with AI"}
              </button>
            </div>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#0F9D8F] focus:border-[#0F9D8F] outline-none text-black"
              required
            />
          </div>

          {/* Cost Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price *</label>
            <input
              type="number"
              name="costPrice"
              value={form.costPrice}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#0F9D8F] focus:border-[#0F9D8F] outline-none text-black"
              required
            />
          </div>

          {/* Profit Margin */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Profit Margin (%) *</label>
            <input
              type="number"
              min="0"
              name="profitMargin"
              value={form.profitMargin}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#0F9D8F] focus:border-[#0F9D8F] outline-none text-black"
              required
            />
          </div>

          {/* Cost Margin (new) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cost Margin (%)</label>
            <input
              type="number"
              min="0"
              name="costMargin"
              value={form.costMargin}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#0F9D8F] focus:border-[#0F9D8F] outline-none text-black"
              placeholder="Optional, defaults to profit margin if empty"
            />
          </div>

          {/* Computed Sell Price (read‑only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sell Price (auto)</label>
            <div className="w-full border border-gray-200 bg-gray-50 rounded-lg px-4 py-2 text-gray-700">
              ৳ {computedSellPrice()}
            </div>
          </div>

          {/* Stock (Quantity) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity *</label>
            <input
              type="number"
              min="0"
              name="stock"
              value={form.stock}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#0F9D8F] focus:border-[#0F9D8F] outline-none text-black"
              required
            />
          </div>

          {/* Submit */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading || uploading || generating}
            className="w-full bg-gradient-to-r from-[#156A98] to-[#0F9D8F] text-white py-3 rounded-lg font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Updating..." : "Update Product"}
          </motion.button>
        </form>
      </motion.div>
    </Modal>
  );
}