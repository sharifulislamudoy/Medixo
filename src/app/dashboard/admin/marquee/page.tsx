"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import Modal from "@/components/ui/Modal";
import CreateMarqueeModal from "@/components/admin/CreateMarqueeModal";
import EditMarqueeModal from "@/components/admin/EditMarqueeModal";

interface Marquee {
  id: string;
  text: string;
  isVisible: boolean;
}

export default function MarqueePage() {
  const [marquees, setMarquees] = useState<Marquee[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMarquee, setSelectedMarquee] = useState<Marquee | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Marquee | null>(null);
  const [confirmToggle, setConfirmToggle] = useState<Marquee | null>(null);

  const fetchMarquees = async () => {
    const res = await fetch("/api/admin/marquee");
    const data = await res.json();
    setMarquees(data);
  };

  useEffect(() => {
    fetchMarquees();
  }, []);

  const handleDelete = async (marquee: Marquee) => {
    const toastId = toast.loading("Deleting marquee...");
    try {
      const res = await fetch(`/api/admin/marquee/${marquee.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Marquee deleted", { id: toastId });
      fetchMarquees();
    } catch (error) {
      toast.error("Failed to delete", { id: toastId });
    }
    setConfirmDelete(null);
  };

  const handleToggleVisibility = async (marquee: Marquee) => {
    const newVisibility = !marquee.isVisible;
    // Optimistic update
    setMarquees((prev) =>
      prev.map((m) => (m.id === marquee.id ? { ...m, isVisible: newVisibility } : m))
    );

    const toastId = toast.loading(newVisibility ? "Showing marquee..." : "Hiding marquee...");
    try {
      const res = await fetch(`/api/admin/marquee/${marquee.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...marquee, isVisible: newVisibility }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast.success(newVisibility ? "Marquee is now visible" : "Marquee hidden", { id: toastId });
    } catch (error) {
      // Revert on error
      setMarquees((prev) =>
        prev.map((m) => (m.id === marquee.id ? { ...m, isVisible: marquee.isVisible } : m))
      );
      toast.error("Failed to update visibility", { id: toastId });
    }
    setConfirmToggle(null);
  };

  const handleEdit = (marquee: Marquee) => {
    setSelectedMarquee(marquee);
    setIsEditModalOpen(true);
  };

  const rowVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.05, duration: 0.3 },
    }),
    exit: { opacity: 0, x: -20, transition: { duration: 0.2 } },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Marquee Messages</h1>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-gradient-to-r from-[#156A98] to-[#0F9D8F] text-white px-6 py-2 rounded-lg shadow-md hover:shadow-lg"
        >
          + Add Marquee
        </motion.button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Text</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Visible</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <AnimatePresence>
              {marquees.map((marquee, index) => (
                <motion.tr
                  key={marquee.id}
                  custom={index}
                  variants={rowVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  layout
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-md truncate">{marquee.text}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setConfirmToggle(marquee)}
                      className="relative inline-flex items-center h-6 rounded-full w-11 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#156A98]"
                      style={{ backgroundColor: marquee.isVisible ? "#16a34a" : "#d1d5db" }}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-200 ${
                          marquee.isVisible ? "left-[calc(100%-18px)]" : "left-[2px]"
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleEdit(marquee)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                        aria-label="Edit"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(marquee)}
                        className="text-red-600 hover:text-red-800 transition-colors"
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
        {marquees.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 text-gray-500">
            No marquee messages yet.
          </motion.div>
        )}
      </div>

      <CreateMarqueeModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchMarquees}
      />
      <EditMarqueeModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedMarquee(null);
        }}
        onSuccess={fetchMarquees}
        marquee={selectedMarquee}
      />

      {/* Confirmation Modal for Delete */}
      <Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)}>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Delete</h3>
          <p className="text-sm text-gray-500">
            Are you sure you want to delete this marquee message? This action cannot be undone.
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

      {/* Confirmation Modal for Toggle Visibility */}
      <Modal isOpen={!!confirmToggle} onClose={() => setConfirmToggle(null)}>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Visibility Change</h3>
          <p className="text-sm text-gray-500">
            Are you sure you want to {confirmToggle?.isVisible ? "hide" : "show"} this marquee message?
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => setConfirmToggle(null)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={() => confirmToggle && handleToggleVisibility(confirmToggle)}
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