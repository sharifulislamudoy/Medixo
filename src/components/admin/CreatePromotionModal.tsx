"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Modal from "@/components/ui/Modal";
import Image from "next/image";
import toast from "react-hot-toast";

const cloudName = "dohhfubsa";
const uploadPreset = "react_unsigned";

interface ProductOption {
  id: string;
  name: string;
  slug: string;
  image?: string;
  sku?: string;
  sellPrice?: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreatePromotionModal({ isOpen, onClose, onSuccess }: Props) {
  const [title, setTitle] = useState("");
  const [hyperlink, setHyperlink] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Product search states
  const [productSearch, setProductSearch] = useState("");
  const [searchResults, setSearchResults] = useState<ProductOption[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductOption | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Debounced product search
  useEffect(() => {
    if (productSearch.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/products/search?search=${encodeURIComponent(productSearch)}`);
        const data = await res.json();
        if (data.products) {
          setSearchResults(data.products);
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [productSearch]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setProductSearch("");
        setSearchResults([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleProductSelect = (product: ProductOption) => {
    setSelectedProduct(product);
    setHyperlink(`/products/${product.slug}`);
    setProductSearch("");
    setSearchResults([]);
  };

  const clearProductSelection = () => {
    setSelectedProduct(null);
    setHyperlink("");
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !imageUrl) {
      toast.error("Title and image are required");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Creating promotion modal...");

    try {
      const res = await fetch("/api/admin/promotion-modal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, imageUrl, hyperlink }),
      });

      if (!res.ok) throw new Error("Failed to create");

      toast.success("Promotion modal created", { id: toastId });
      onSuccess();
      onClose();
      // Reset form
      setTitle("");
      setHyperlink("");
      setImageUrl("");
      setProductSearch("");
      setSelectedProduct(null);
    } catch (error) {
      toast.error("Failed to create promotion modal", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Create Promotion Modal</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <motion.input
              whileFocus={{ scale: 1.01 }}
              type="text"
              placeholder="e.g. Special Offer"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#0F9D8F] focus:border-[#0F9D8F] outline-none transition text-black"
              required
            />
          </div>

          {/* Product Search for Hyperlink */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Link to Product (optional)
            </label>
            <div className="relative" ref={searchContainerRef}>
              {/* Show selected product chip */}
              {selectedProduct ? (
                <div className="flex items-center gap-2 bg-gray-100 border border-gray-300 rounded-lg px-3 py-2">
                  <span className="text-sm text-gray-700 font-medium truncate flex-1">
                    {selectedProduct.name} → /products/{selectedProduct.slug}
                  </span>
                  <button
                    type="button"
                    onClick={clearProductSelection}
                    className="text-red-500 hover:text-red-700 text-lg leading-none"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <motion.input
                  whileFocus={{ scale: 1.01 }}
                  type="text"
                  placeholder="Search product by name or SKU..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#0F9D8F] focus:border-[#0F9D8F] outline-none transition text-black"
                />
              )}

              {/* Dropdown suggestions */}
              <AnimatePresence>
                {searchResults.length > 0 && productSearch.trim().length >= 2 && !selectedProduct && (
                  <motion.ul
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg mt-1 shadow-xl max-h-48 overflow-y-auto"
                  >
                    {searchResults.map((product) => (
                      <li
                        key={product.id}
                        className="px-4 py-2 hover:bg-[#0F9D8F]/10 cursor-pointer flex items-center justify-between"
                        onClick={() => handleProductSelect(product)}
                      >
                        <span className="text-sm text-gray-700">{product.name}</span>
                        {product.sku && <span className="text-xs text-gray-400 ml-2">{product.sku}</span>}
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>

              {isSearching && (
                <p className="mt-1 text-xs text-gray-400">Searching...</p>
              )}
            </div>

            {/* Hidden hyperlink field (auto-filled from product selection) */}
            <input type="hidden" value={hyperlink} />
            {hyperlink && (
              <p className="mt-1 text-xs text-gray-500 truncate">
                Hyperlink: {hyperlink}
              </p>
            )}
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Banner Image *</label>
            <motion.input
              whileHover={{ scale: 1.01 }}
              type="file"
              accept="image/*"
              onChange={async (e) => {
                if (!e.target.files) return;
                const url = await uploadImage(e.target.files[0]);
                setImageUrl(url);
              }}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#0F9D8F]/10 file:text-[#0F9D8F] hover:file:bg-[#0F9D8F]/20 transition"
              required
            />
            {uploading && <p className="mt-2 text-xs text-gray-500">Uploading...</p>}
            {imageUrl && !uploading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-2"
              >
                <p className="text-xs text-green-600 mb-1">✅ Uploaded successfully</p>
                <div className="relative w-full h-32 rounded-lg overflow-hidden border border-gray-200">
                  <Image src={imageUrl} alt="Preview" fill className="object-cover" />
                </div>
              </motion.div>
            )}
          </div>

          {/* Submit */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading || uploading}
            className="w-full bg-gradient-to-r from-[#156A98] to-[#0F9D8F] text-white py-3 rounded-lg font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  ></path>
                </svg>
                Creating...
              </>
            ) : (
              "Create Promotion Modal"
            )}
          </motion.button>
        </form>
      </motion.div>
    </Modal>
  );
}