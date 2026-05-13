"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { X, Star } from "lucide-react";
import toast from "react-hot-toast";

interface PendingOrder {
  id: string;
  invoiceNo: string;
}

export default function ReviewModal() {
  const { data: session } = useSession();
  const [pendingOrder, setPendingOrder] = useState<PendingOrder | null>(null);
  const [show, setShow] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Only for SHOP_OWNER
  useEffect(() => {
    if (session?.user?.role !== "SHOP_OWNER") return;

    const checkPending = async () => {
      try {
        const res = await fetch("/api/review/pending");
        if (res.ok) {
          const data = await res.json();
          if (data) {
            setPendingOrder(data);
            setShow(true);
          }
        }
      } catch (e) {
        // ignore errors
      }
    };

    checkPending();
  }, [session]);

  const dismissReview = async () => {
    if (!pendingOrder) return;
    try {
      await fetch(`/api/review/${pendingOrder.id}/dismiss`, {
        method: "PATCH",
      });
    } catch (e) {
      console.error("Failed to dismiss review", e);
    }
    setShow(false);
  };

  const submitReview = async () => {
    if (!pendingOrder || rating < 1) {
      toast.error("Please select a rating");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/review/${pendingOrder.id}/submit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      });
      if (res.ok) {
        toast.success("Thank you for your feedback! 🙏");
      } else {
        toast.error("Failed to submit review.");
      }
    } catch (e) {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
      setShow(false);
    }
  };

  if (!show || !pendingOrder) return null;

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
            onClick={dismissReview}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-6 z-[110] max-w-lg w-[90%] sm:w-full"
          >
            {/* Close button */}
            <button
              onClick={dismissReview}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl sm:text-2xl font-bold text-center text-gray-800 mb-4">
              Medixo-র সাথে থাকার জন্য ধন্যবাদ!
            </h2>
            <p className="text-sm sm:text-base text-gray-600 text-center mb-6">
              আপনার অর্ডারটি সফলভাবে ডেলিভারি করা হয়েছে। আপনি চাইলে আপনার মূল্যবান মতামত দিয়ে আমাদের সাহায্য করতে পারেন।
            </p>

            {/* Stars */}
            <div className="flex justify-center gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="p-1 transition-transform hover:scale-110"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                >
                  <Star
                    size={32}
                    className={`${
                      (hoverRating || rating) >= star
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300"
                    } transition-colors`}
                  />
                </button>
              ))}
            </div>

            {/* Textarea */}
            <textarea
              rows={3}
              placeholder="আপনার মতামত লিখুন (ঐচ্ছিক)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full border text-gray-700 border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-[#0F9D8F] focus:border-[#0F9D8F] outline-none resize-none mb-4"
            />

            {/* Submit & skip buttons */}
            <div className="flex gap-3 justify-center">
              <button
                onClick={dismissReview}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
              >
                Skip
              </button>
              <button
                onClick={submitReview}
                disabled={submitting || rating < 1}
                className="px-6 py-2 bg-gradient-to-r from-[#156A98] to-[#0F9D8F] text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-50 text-sm"
              >
                {submitting ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}