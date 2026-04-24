"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Modal from "@/components/ui/Modal";
import CreateProductModal from "@/components/admin/CreateProductModal";
import EditProductModal from "@/components/admin/EditProductModal";

interface Product {
  id: string;
  name: string;
  category: string;
  sku: string;
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
  status: boolean;
  availability: boolean;
  createdAt: string;
}

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);
  const [confirmToggle, setConfirmToggle] = useState<{
    product: Product;
    field: "status" | "availability";
    newValue: boolean;
  } | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/products");
      if (!res.ok) {
        if (res.status === 401) {
          toast.error("You are not authorized. Please log in as admin.");
          router.push("/login");
          return;
        }
        throw new Error(`Failed to fetch: ${res.status}`);
      }
      const data = await res.json();
      setProducts(data);
      setFiltered(data);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const lower = search.toLowerCase();
    setFiltered(
      products.filter(
        (p) =>
          p.name.toLowerCase().includes(lower) ||
          p.sku.toLowerCase().includes(lower) ||
          p.generic?.name.toLowerCase().includes(lower) ||
          p.brand?.name.toLowerCase().includes(lower)
      )
    );
  }, [search, products]);

  const handleDelete = async (product: Product) => {
    const toastId = toast.loading("Deleting product...");
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        if (res.status === 401) {
          toast.error("Unauthorized. Please log in again.", { id: toastId });
          router.push("/login");
          return;
        }
        throw new Error("Failed to delete");
      }
      toast.success("Product deleted", { id: toastId });
      fetchProducts();
    } catch (error) {
      toast.error("Failed to delete", { id: toastId });
    }
    setConfirmDelete(null);
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setIsEditModalOpen(true);
  };

  const handleToggle = async (product: Product, field: "status" | "availability") => {
    const newValue = !product[field];
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, [field]: newValue } : p))
    );
    setFiltered((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, [field]: newValue } : p))
    );

    const toastId = toast.loading(`Updating ${field}...`);
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: newValue }),
      });
      if (!res.ok) {
        if (res.status === 401) {
          toast.error("Unauthorized. Please log in again.", { id: toastId });
          router.push("/login");
          return;
        }
        const error = await res.json();
        throw new Error(error.error || "Failed to update");
      }
      toast.success(`${field} updated`, { id: toastId });
      fetchProducts();
    } catch (error: any) {
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, [field]: !newValue } : p))
      );
      setFiltered((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, [field]: !newValue } : p))
      );
      toast.error(error.message || "Failed to update", { id: toastId });
    }
    setConfirmToggle(null);
  };

  const rowVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.03, duration: 0.3 },
    }),
    exit: { opacity: 0, x: -20, transition: { duration: 0.2 } },
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Products</h1>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#0F9D8F] focus:border-[#0F9D8F] outline-none text-black"
          />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-gradient-to-r from-[#156A98] to-[#0F9D8F] text-white px-6 py-2 rounded-lg shadow-md hover:shadow-lg whitespace-nowrap"
          >
            + Add Product
          </motion.button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full min-w-[1200px]">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-2 py-2 text-left text-sm font-medium text-gray-500 uppercase">Image</th>
              <th className="px-2 py-2 text-left text-sm font-medium text-gray-500 uppercase">Name</th>
              <th className="px-2 py-2 text-left text-sm font-medium text-gray-500 uppercase">SKU</th>
              <th className="px-2 py-2 text-left text-sm font-medium text-gray-500 uppercase">Brand</th>
              <th className="px-2 py-2 text-left text-sm font-medium text-gray-500 uppercase">MRP</th>
              <th className="px-2 py-2 text-left text-sm font-medium text-gray-500 uppercase">Cost</th>
              <th className="px-2 py-2 text-left text-sm font-medium text-gray-500 uppercase">Sell</th>
              <th className="px-2 py-2 text-left text-sm font-medium text-gray-500 uppercase">Margin %</th>
              <th className="px-2 py-2 text-left text-sm font-medium text-gray-500 uppercase">Cost Margin %</th> {/* 👈 NEW */}
              <th className="px-2 py-2 text-left text-sm font-medium text-gray-500 uppercase">Stock</th>
              <th className="px-2 py-2 text-left text-sm font-medium text-gray-500 uppercase">Status</th>
              <th className="px-2 py-2 text-left text-sm font-medium text-gray-500 uppercase">In Stock</th>
              <th className="px-2 py-2 text-left text-sm font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <AnimatePresence>
              {filtered.map((product, index) => (
                <motion.tr
                  key={product.id}
                  custom={index}
                  variants={rowVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  layout
                  className="hover:bg-gray-50"
                >
                  <td className="px-2 py-2">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </td>
                  <td className="px-2 py-2 text-sm font-medium text-gray-900">{product.name}</td>
                  <td className="px-2 py-2 text-sm text-gray-600">{product.sku}</td>
                  <td className="px-2 py-2 text-sm text-gray-600">{product.brand?.name || '-'}</td>
                  <td className="px-2 py-2 text-sm text-gray-600">৳{product.mrp}</td>
                  <td className="px-2 py-2 text-sm text-gray-600">৳{product.costPrice}</td>
                  <td className="px-2 py-2 text-sm text-gray-600">৳{product.sellPrice}</td>
                  <td className="px-2 py-2 text-sm text-gray-600">{product.profitMargin}%</td>
                  <td className="px-2 py-2 text-sm text-gray-600">{product.costMargin != null ? `${product.costMargin}%` : '-'}</td> {/* 👈 NEW */}
                  <td className="px-2 py-2 text-sm text-gray-600">{product.stock}</td>
                  {/* Status Toggle */}
                  <td className="px-2 py-2">
                    <button
                      onClick={() =>
                        setConfirmToggle({
                          product,
                          field: "status",
                          newValue: !product.status,
                        })
                      }
                      className={`relative inline-flex items-center h-6 rounded-full w-11 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#156A98] ${
                        product.status ? "bg-green-600" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-200 ${
                          product.status ? "left-[calc(100%-18px)]" : "left-[2px]"
                        }`}
                      />
                    </button>
                  </td>
                  {/* Availability Toggle */}
                  <td className="px-2 py-2">
                    <button
                      onClick={() =>
                        setConfirmToggle({
                          product,
                          field: "availability",
                          newValue: !product.availability,
                        })
                      }
                      className={`relative inline-flex items-center h-6 rounded-full w-11 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#156A98] ${
                        product.availability ? "bg-green-600" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-200 ${
                          product.availability ? "left-[calc(100%-18px)]" : "left-[2px]"
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleEdit(product)}
                        className="text-blue-600 hover:text-blue-800"
                        aria-label="Edit"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(product)}
                        className="text-red-600 hover:text-red-800"
                        aria-label="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
        {filtered.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 text-gray-500"
          >
            No products found.
          </motion.div>
        )}
      </div>

      {/* Modals */}
      <CreateProductModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchProducts}
      />
      <EditProductModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedProduct(null);
        }}
        onSuccess={fetchProducts}
        product={selectedProduct}
      />

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)}>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Delete</h3>
          <p className="text-sm text-gray-500">
            Are you sure you want to delete <span className="font-semibold">{confirmDelete?.name}</span>?
            This action cannot be undone.
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => setConfirmDelete(null)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={() => confirmDelete && handleDelete(confirmDelete)}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* Toggle Confirmation Modal */}
      <Modal isOpen={!!confirmToggle} onClose={() => setConfirmToggle(null)}>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Change</h3>
          <p className="text-sm text-gray-500">
            Are you sure you want to set{" "}
            <span className="font-semibold">{confirmToggle?.product.name}</span>'s{" "}
            <span className="font-semibold">{confirmToggle?.field}</span> to{" "}
            <span className="font-semibold">
              {confirmToggle?.newValue ? "ON" : "OFF"}
            </span>?
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => setConfirmToggle(null)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={() =>
                confirmToggle && handleToggle(confirmToggle.product, confirmToggle.field)
              }
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#156A98] to-[#0F9D8F] rounded-lg hover:opacity-90"
            >
              Confirm
            </button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}