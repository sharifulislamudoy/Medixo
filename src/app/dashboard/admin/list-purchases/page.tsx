"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Pencil, Trash2, Plus, Eye } from "lucide-react";
import toast from "react-hot-toast";
import Modal from "@/components/ui/Modal";

interface PurchaseItem {
  id: string;
  quantity: number;
  costPrice: number;
  profitMargin: number;
  costMargin?: number;          // 👈 NEW
  sellPrice: number;
  totalCost: number;
  product: { id: string; name: string; sku: string; image?: string };
}

interface Purchase {
  id: string;
  purchaseNo: string;
  purchaseDate: string;
  paymentStatus: "PAID" | "DUE";
  totalAmount: number;
  notes: string | null;
  supplier: { id: string; name: string; shopName: string; phone: string; email?: string };
  items: PurchaseItem[];
}

export default function ListPurchasesPage() {
  const router = useRouter();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Purchase | null>(null);
  const [viewTarget, setViewTarget] = useState<Purchase | null>(null);

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/purchases");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setPurchases(data);
    } catch (error) {
      toast.error("Failed to load purchases");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const toastId = toast.loading("Deleting purchase...");
    try {
      const res = await fetch(`/api/admin/purchases/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Purchase deleted", { id: toastId });
      fetchPurchases();
      setDeleteTarget(null);
    } catch (error) {
      toast.error("Failed to delete", { id: toastId });
    }
  };

  const formatDate = (date: string) => new Date(date).toLocaleDateString();

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
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Purchase History</h1>
        <button
          onClick={() => router.push("/dashboard/admin/add-purchase")}
          className="bg-gradient-to-r from-[#156A98] to-[#0F9D8F] text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md hover:shadow-lg"
        >
          <Plus size={20} /> Add Purchase
        </button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full min-w-[1000px]">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">PO No</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Date</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Supplier</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Total (৳)</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {purchases.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.purchaseNo}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{formatDate(p.purchaseDate)}</td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {p.supplier.shopName || p.supplier.name}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">৳{p.totalAmount.toFixed(2)}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      p.paymentStatus === "PAID"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {p.paymentStatus}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-3">
                    <button
                      onClick={() => setViewTarget(p)}
                      className="text-gray-600 hover:text-gray-800"
                      title="View Details"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => router.push(`/dashboard/admin/edit-purchase/${p.id}`)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(p)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {purchases.length === 0 && (
          <div className="text-center py-12 text-gray-500">No purchases found.</div>
        )}
      </div>

      {/* View Details Modal */}
      <Modal isOpen={!!viewTarget} onClose={() => setViewTarget(null)}>
        {viewTarget && (
          <div className="p-6 max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Purchase Details</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="font-semibold text-gray-800">PO Number:</span> <span className="text-gray-500">{viewTarget.purchaseNo}</span></div>
                <div><span className="font-semibold text-gray-800">Date:</span> <span className="text-gray-500">{formatDate(viewTarget.purchaseDate)}</span></div>
                <div><span className="font-semibold text-gray-800">Supplier:</span> <span className="text-gray-500">{viewTarget.supplier.shopName || viewTarget.supplier.name}</span></div>
                <div><span className="font-semibold text-gray-800">Phone:</span> <span className="text-gray-500">{viewTarget.supplier.phone}</span></div>
                <div><span className="font-semibold text-gray-800">Email:</span> <span className="text-gray-500">{viewTarget.supplier.email || "-"}</span></div>
                <div><span className="font-semibold text-gray-800">Payment Status:</span> 
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${viewTarget.paymentStatus === "PAID" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                    {viewTarget.paymentStatus}
                  </span>
                </div>
                <div className="col-span-2"><span className="font-semibold">Notes:</span> <span className="text-gray-500">{viewTarget.notes || "-"}</span></div>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2 text-gray-800">Products</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-2 py-1 text-gray-800 text-left">Product</th>
                        <th className="px-2 py-1 text-gray-800 text-right">Qty</th>
                        <th className="px-2 py-1 text-gray-800 text-right">Cost (৳)</th>
                        <th className="px-2 py-1 text-gray-800 text-right">Margin %</th>
                        <th className="px-2 py-1 text-gray-800 text-right">Cost Margin %</th>   {/* 👈 NEW */}
                        <th className="px-2 py-1 text-gray-800 text-right">Sell (৳)</th>
                        <th className="px-2 py-1 text-gray-800 text-right">Total (৳)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewTarget.items.map((item) => (
                        <tr key={item.id} className="border-b">
                          <td className="px-2 py-1 text-gray-500 ">{item.product.name}</td>
                          <td className="px-2 py-1 text-gray-500 text-right">{item.quantity}</td>
                          <td className="px-2 py-1 text-gray-500 text-right">{item.costPrice.toFixed(2)}</td>
                          <td className="px-2 py-1 text-gray-500 text-right">{item.profitMargin}%</td>
                          <td className="px-2 py-1 text-gray-500 text-right">{item.costMargin?.toFixed(2) ?? "-"}</td>  {/* 👈 NEW */}
                          <td className="px-2 py-1 text-gray-500 text-right">{item.sellPrice.toFixed(2)}</td>
                          <td className="px-2 py-1 text-gray-500 text-right">{item.totalCost.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="font-bold">
                        <td colSpan={6} className="px-2 py-2 text-right">Grand Total:</td>
                        <td className="px-2 py-2 text-right">৳{viewTarget.totalAmount.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setViewTarget(null)}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete confirmation modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Delete</h3>
          <p className="text-sm text-gray-500">
            Are you sure you want to delete purchase{" "}
            <span className="font-semibold">{deleteTarget?.purchaseNo}</span>? This will revert stock
            changes and cannot be undone.
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => setDeleteTarget(null)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}