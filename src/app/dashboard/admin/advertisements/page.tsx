"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import Modal from "@/components/ui/Modal";
import CreateAdvertisementModal from "@/components/admin/CreateAdvertisementModal";
import EditAdvertisementModal from "@/components/admin/EditAdvertisementModal";

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

export default function AdminAdvertisementsPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);

  const [confirmDelete, setConfirmDelete] = useState<Ad | null>(null);
  const [confirmToggle, setConfirmToggle] = useState<Ad | null>(null);

  const fetchAds = async () => {
    const res = await fetch("/api/admin/advertisement");
    const data = await res.json();
    setAds(data);
  };

  useEffect(() => {
    fetchAds();
  }, []);

  const handleDelete = async (ad: Ad) => {
    const toastId = toast.loading("Deleting...");
    try {
      await fetch(`/api/admin/advertisement/${ad.id}`, { method: "DELETE" });
      toast.success("Deleted", { id: toastId });
      fetchAds();
    } catch {
      toast.error("Failed to delete", { id: toastId });
    }
    setConfirmDelete(null);
  };

  const handleToggle = async (ad: Ad) => {
    const newVis = !ad.isVisible;
    setAds((prev) => prev.map((a) => (a.id === ad.id ? { ...a, isVisible: newVis } : a)));

    const toastId = toast.loading(newVis ? "Showing..." : "Hiding...");
    try {
      const res = await fetch(`/api/admin/advertisement/${ad.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVisible: newVis }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(newVis ? "Visible" : "Hidden", { id: toastId });
      fetchAds();
    } catch {
      setAds((prev) =>
        prev.map((a) => (a.id === ad.id ? { ...a, isVisible: ad.isVisible } : a))
      );
      toast.error("Failed", { id: toastId });
    }
    setConfirmToggle(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Advertisements</h1>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-gradient-to-r from-[#156A98] to-[#0F9D8F] text-white px-6 py-2 rounded-lg shadow-md hover:shadow-lg"
        >
          + Create Advertisement
        </motion.button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase">Image</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase">Title</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase">Category</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase">Visibility</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <AnimatePresence>
              {ads.map((ad, i) => (
                <motion.tr
                  key={ad.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.05 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-4 py-3">
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                      <Image
                        src={ad.imageUrl}
                        alt={ad.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{ad.title}</td>
                  <td className="px-4 py-3 text-sm capitalize">{ad.category}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setConfirmToggle(ad)}
                      className={`relative inline-flex items-center h-6 rounded-full w-11 focus:outline-none ${
                        ad.isVisible ? "bg-green-500" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-200 ${
                          ad.isVisible ? "left-[calc(100%-18px)]" : "left-[2px]"
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex space-x-3">
                      <button
                        onClick={() => {
                          setSelectedAd(ad);
                          setIsEditModalOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(ad)}
                        className="text-red-600 hover:text-red-800"
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
        {ads.length === 0 && (
          <div className="text-center py-12 text-gray-500">No advertisements yet.</div>
        )}
      </div>

      <CreateAdvertisementModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchAds}
      />
      <EditAdvertisementModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedAd(null);
        }}
        onSuccess={fetchAds}
        ad={selectedAd}
      />

      {/* Confirm Delete Modal */}
      <Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)}>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Delete</h3>
          <p className="text-sm text-gray-500">
            Are you sure you want to delete <strong>{confirmDelete?.title}</strong>?
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

      {/* Confirm Toggle Modal */}
      <Modal isOpen={!!confirmToggle} onClose={() => setConfirmToggle(null)}>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Change Visibility</h3>
          <p className="text-sm text-gray-500">
            {confirmToggle?.isVisible ? "Hide" : "Show"}{" "}
            <strong>{confirmToggle?.title}</strong>?
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => setConfirmToggle(null)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={() => confirmToggle && handleToggle(confirmToggle)}
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