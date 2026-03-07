"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface ModalData {
  id: string;
  title: string;
  imageUrl: string;
  hyperlink?: string;
}

const STORAGE_KEY = "promotion_modal_seen";
const EXPIRY_TIME = 1000 * 60 * 60 * 6; // 6 hours

export default function PromotionModalViewer() {
  const [modal, setModal] = useState<ModalData | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const checkStorage = () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return true;

      try {
        const { timestamp } = JSON.parse(stored);
        return Date.now() - timestamp > EXPIRY_TIME;
      } catch {
        return true;
      }
    };

    const fetchModal = async () => {
      if (!checkStorage()) return;

      const res = await fetch("/api/promotion-modal");
      const data = await res.json();

      if (data) {
        setModal(data);
        setOpen(true);
      }
    };

    fetchModal();
  }, []);

  const handleClose = () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ timestamp: Date.now() })
    );
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && modal && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 pointer-events-auto mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleClose}
                className="absolute top-3 right-3 text-black text-xl"
                aria-label="Close"
              >
                ✕
              </button>

              <h2 className="text-xl font-bold text-black text-center mb-4 pr-6">{modal.title}</h2>

              <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden">
                <Image
                  src={modal.imageUrl}
                  alt={modal.title}
                  fill
                  className="object-cover"
                />
              </div>

              {modal.hyperlink && (
                <a
                  href={modal.hyperlink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleClose}
                  className="block bg-gradient-to-r from-[#156A98] to-[#0F9D8F] text-white text-center py-2 rounded-lg hover:opacity-90 transition"
                >
                  Order Now
                </a>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}