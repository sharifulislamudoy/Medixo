"use client";

import { useState, useEffect, useRef } from "react";
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
  sku?: string;
}

interface Ad {
  id: string;
  title: string;
  slug: string;
  imageUrl: string;
  detailImage?: string;
  description?: string;
  category: string;
  hyperlink?: string;
  isVisible: boolean;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  ad: Ad | null;
}

export default function EditAdvertisementModal({ isOpen, onClose, onSuccess, ad }: Props) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<"ANNOUNCEMENT" | "PRODUCT">("ANNOUNCEMENT");
  const [isVisible, setIsVisible] = useState(true);

  const [bannerImage, setBannerImage] = useState("");
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const [description, setDescription] = useState("");
  const [detailImage, setDetailImage] = useState("");
  const [uploadingDetail, setUploadingDetail] = useState(false);

  const [productSearch, setProductSearch] = useState("");
  const [searchResults, setSearchResults] = useState<ProductOption[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductOption | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(false);

  const uploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: formData }
    );
    const data = await res.json();
    return data.secure_url;
  };

  // Pre-fill fields when ad changes
  useEffect(() => {
    if (ad) {
      setTitle(ad.title);
      setCategory(ad.category as any);
      setIsVisible(ad.isVisible);
      setBannerImage(ad.imageUrl);
      setDescription(ad.description || "");
      setDetailImage(ad.detailImage || "");

      if (ad.category === "PRODUCT" && ad.hyperlink) {
        const slug = ad.hyperlink.replace("/products/", "");
        if (slug) {
          setSelectedProduct({ id: "", name: "", slug, sku: "" });
        }
      } else {
        setSelectedProduct(null);
      }
    }
  }, [ad]);

  // Product search (same as create)
  useEffect(() => {
    if (productSearch.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/admin/products/search?search=${encodeURIComponent(productSearch)}`
        );
        const data = await res.json();
        setSearchResults(data.products || []);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [productSearch]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setProductSearch("");
        setSearchResults([]);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleProductSelect = (product: ProductOption) => {
    setSelectedProduct(product);
    setProductSearch("");
    setSearchResults([]);
  };

  const clearProductSelection = () => setSelectedProduct(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !bannerImage || !ad) {
      toast.error("Required fields missing");
      return;
    }
    if (category === "PRODUCT" && !selectedProduct) {
      toast.error("Please select a product");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Updating advertisement...");

    const payload = {
      title,
      imageUrl: bannerImage,
      category,
      isVisible,
      hyperlink: category === "PRODUCT" ? `/products/${selectedProduct!.slug}` : null,
      detailImage: category === "ANNOUNCEMENT" ? detailImage : null,
      description: category === "ANNOUNCEMENT" ? description : null,
    };

    try {
      const res = await fetch(`/api/admin/advertisement/${ad.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Updated", { id: toastId });
      onSuccess();
      onClose();
    } catch {
      toast.error("Failed to update", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  if (!ad) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="space-y-5 max-h-[80vh] overflow-y-auto"
      >
        <h2 className="text-2xl font-bold text-gray-800">Edit Advertisement</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-gray-700 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#0F9D8F] focus:border-[#0F9D8F] outline-none"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full text-gray-700 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#0F9D8F] focus:border-[#0F9D8F] outline-none"
            >
              <option value="ANNOUNCEMENT">Announcement</option>
              <option value="PRODUCT">Product</option>
            </select>
          </div>

          {/* Banner Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Banner Image *</label>
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                if (!e.target.files) return;
                setUploadingBanner(true);
                const url = await uploadImage(e.target.files[0]);
                setBannerImage(url);
                setUploadingBanner(false);
              }}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#0F9D8F]/10 file:text-[#0F9D8F] hover:file:bg-[#0F9D8F]/20"
            />
            {uploadingBanner && <p className="text-xs text-gray-500 mt-1">Uploading...</p>}
            {bannerImage && !uploadingBanner && (
              <div className="mt-2">
                <p className="text-xs text-green-600 mb-1">✅ Current Image</p>
                <div className="relative w-full h-32 rounded-lg overflow-hidden border">
                  <Image src={bannerImage} alt="Banner" fill className="object-cover" />
                </div>
              </div>
            )}
          </div>

          {/* Announcement extra fields */}
          {category === "ANNOUNCEMENT" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-gray-700 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#0F9D8F] focus:border-[#0F9D8F] outline-none"
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Detail Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    if (!e.target.files) return;
                    setUploadingDetail(true);
                    const url = await uploadImage(e.target.files[0]);
                    setDetailImage(url);
                    setUploadingDetail(false);
                  }}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#0F9D8F]/10 file:text-[#0F9D8F] hover:file:bg-[#0F9D8F]/20"
                />
                {uploadingDetail && <p className="text-xs text-gray-500 mt-1">Uploading...</p>}
                {detailImage && !uploadingDetail && (
                  <div className="mt-2">
                    <p className="text-xs text-green-600 mb-1">✅ Detail Image</p>
                    <div className="relative w-full h-32 rounded-lg overflow-hidden border">
                      <Image src={detailImage} alt="Detail" fill className="object-cover" />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Product search */}
          {category === "PRODUCT" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Product *</label>
              <div className="relative" ref={searchContainerRef}>
                {selectedProduct ? (
                  <div className="flex items-center gap-2 bg-gray-100 border border-gray-300 rounded-lg px-3 py-2">
                    <span className="text-sm truncate flex-1">{selectedProduct.name} → /products/{selectedProduct.slug}</span>
                    <button type="button" onClick={clearProductSelection} className="text-red-500 hover:text-red-700 text-lg leading-none">×</button>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search product name or SKU..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#0F9D8F] focus:border-[#0F9D8F] outline-none"
                  />
                )}
                <AnimatePresence>
                  {searchResults.length > 0 && productSearch.trim().length >= 2 && !selectedProduct && (
                    <motion.ul
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg mt-1 shadow-xl max-h-48 overflow-y-auto"
                    >
                      {searchResults.map((p) => (
                        <li
                          key={p.id}
                          className="px-4 py-2 hover:bg-[#0F9D8F]/10 cursor-pointer flex items-center justify-between"
                          onClick={() => handleProductSelect(p)}
                        >
                          <span className="text-sm text-gray-700">{p.name}</span>
                          {p.sku && <span className="text-xs text-gray-400 ml-2">{p.sku}</span>}
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
                {isSearching && <p className="text-xs text-gray-400 mt-1">Searching...</p>}
              </div>
            </div>
          )}

          {/* Visibility */}
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isVisible}
              onChange={() => setIsVisible(!isVisible)}
              className="w-5 h-5 text-[#0F9D8F] rounded focus:ring-[#0F9D8F]"
            />
            <span className="text-sm text-gray-700">Visible on site</span>
          </label>

          <button
            type="submit"
            disabled={loading || uploadingBanner || uploadingDetail}
            className="w-full bg-gradient-to-r from-[#156A98] to-[#0F9D8F] text-white py-3 rounded-lg font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Updating...
              </>
            ) : (
              "Update Advertisement"
            )}
          </button>
        </form>
      </motion.div>
    </Modal>
  );
}