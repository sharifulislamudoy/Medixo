"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Modal from "@/components/ui/Modal";
import toast from "react-hot-toast";

interface Marquee {
  id: string;
  text: string;
  isVisible: boolean;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  marquee: Marquee | null;
}

export default function EditMarqueeModal({ isOpen, onClose, onSuccess, marquee }: Props) {
  const [text, setText] = useState("");
  const [isVisible, setIsVisible] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (marquee) {
      setText(marquee.text);
      setIsVisible(marquee.isVisible);
    }
  }, [marquee]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      toast.error("Text is required");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Updating marquee...");

    try {
      const res = await fetch(`/api/admin/marquee/${marquee!.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, isVisible }),
      });

      if (!res.ok) throw new Error("Failed to update");

      toast.success("Marquee updated", { id: toastId });
      onSuccess();
      onClose();
    } catch (error) {
      toast.error("Failed to update marquee", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  if (!marquee) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Edit Marquee Message</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
            <motion.textarea
              whileFocus={{ scale: 1.01 }}
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#0F9D8F] focus:border-[#0F9D8F] outline-none transition text-black"
              required
            />
          </div>

          <label className="flex items-center space-x-3 cursor-pointer">
            <motion.input
              whileTap={{ scale: 0.95 }}
              type="checkbox"
              checked={isVisible}
              onChange={() => setIsVisible(!isVisible)}
              className="w-5 h-5 text-[#0F9D8F] rounded focus:ring-[#0F9D8F]"
            />
            <span className="text-sm text-gray-700">Visible on site</span>
          </label>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#156A98] to-[#0F9D8F] text-white py-3 rounded-lg font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                Updating...
              </>
            ) : (
              "Update Marquee"
            )}
          </motion.button>
        </form>
      </motion.div>
    </Modal>
  );
}