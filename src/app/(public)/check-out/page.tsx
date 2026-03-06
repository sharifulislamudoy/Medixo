"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react"; // add this
import toast from "react-hot-toast"; // add this

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCart();
  const { data: session, status } = useSession();
  const [showModal, setShowModal] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Redirect if not authenticated
  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  // Calculate discount (1% if subtotal > 4000)
  const discount = totalPrice > 4000 ? totalPrice * 0.01 : 0;
  const finalTotal = totalPrice - discount;
  const payableTotal = Math.round(finalTotal);

  // Calculate delivery date based on current time
  const getDeliveryDate = (): string => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    if (currentHour > 11 || (currentHour === 11 && currentMinute > 0)) {
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      return tomorrow.toLocaleDateString("bn-BD", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } else {
      return now.toLocaleDateString("bn-BD", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
  };

  const deliveryDate = getDeliveryDate();

  const handlePlaceOrder = async () => {
    if (totalPrice < 500) {
      setShowModal(true);
      return;
    }

    setIsPlacingOrder(true);
    try {
      const orderItems = items.map(item => ({
        id: item.id,
        quantity: item.quantity,
      }));

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: orderItems, totalPrice }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to place order');
      }

      clearCart();
      toast.success('Order placed successfully!');
      router.push('/history');
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const closeModal = () => setShowModal(false);

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Your cart is empty</h1>
        <Link
          href="/products"
          className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-[#156A98] to-[#0F9D8F] text-white font-medium rounded-lg hover:opacity-90"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mb-20">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Checkout</h1>

      {/* Mobile Order Summary */}
      <div className="block md:hidden mb-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Order Summary</h2>
          <div className="grid grid-cols-2 font-medium text-gray-500 text-sm pb-2 border-b border-gray-200 mb-2">
            <div>Item</div>
            <div className="text-right">Amount</div>
          </div>
          <div className="space-y-2">
            <div className="grid grid-cols-2">
              <span className="text-gray-600">Subtotal</span>
              <span className="text-right font-medium text-gray-800">৳{totalPrice.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="grid grid-cols-2 text-green-600">
                <span>Discount (1%)</span>
                <span className="text-right">- ৳{discount.toFixed(2)}</span>
              </div>
            )}
            <div className="grid grid-cols-2 font-semibold border-t border-gray-200 pt-2">
              <span>Total</span>
              <span className="text-right text-[#0F9D8F]">৳{payableTotal}</span>
            </div>
          </div>

          <div className="mt-6 mb-6">
            <p className="text-sm text-gray-500">Estimated delivery date:</p>
            <p className="text-lg font-semibold text-[#0F9D8F]">{deliveryDate}</p>
          </div>
          <button
            onClick={handlePlaceOrder}
            disabled={isPlacingOrder}
            className="w-full py-3 bg-gradient-to-r from-[#156A98] to-[#0F9D8F] text-white font-medium rounded-lg hover:opacity-90 transition disabled:opacity-50"
          >
            {isPlacingOrder ? 'Placing Order...' : 'Place Order'}
          </button>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid md:grid-cols-3 gap-8">
        {/* Left: Items in your order */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Items in your order</h2>
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-4">
                  <div className="relative w-16 h-16 flex-shrink-0">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-contain rounded"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{item.name}</p>
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[#0F9D8F]">
                      ৳{(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Desktop Order Summary */}
        <div className="hidden md:block md:col-span-1">
          <div className="bg-white rounded-xl shadow-md p-6 sticky top-24">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Order Summary</h2>
            <div className="grid grid-cols-2 font-medium text-gray-500 text-sm pb-2 border-b border-gray-200 mb-2">
              <div>Item</div>
              <div className="text-right">Amount</div>
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-2">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-right font-medium text-gray-800">৳{totalPrice.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="grid grid-cols-2 text-green-600">
                  <span>Discount (1%)</span>
                  <span className="text-right">- ৳{discount.toFixed(2)}</span>
                </div>
              )}
              <div className="grid grid-cols-2 font-semibold border-t border-gray-200 pt-2">
                <span>Total</span>
                <span className="text-right text-[#0F9D8F]">৳{finalTotal.toFixed(2)}</span>
              </div>
              <div className="grid grid-cols-2">
                <span className="text-gray-600">Shipping</span>
                <span className="text-right font-medium text-green-600">Free</span>
              </div>
              <div className="grid grid-cols-2 text-gray-800">
                <span>Payable Total</span>
                <span className="text-right font-bold text-[#0F9D8F]">৳{payableTotal}</span>
              </div>
            </div>

            <div className="mt-6 mb-6">
              <p className="text-sm text-gray-500">Estimated delivery date:</p>
              <p className="text-lg font-semibold text-[#0F9D8F]">{deliveryDate}</p>
            </div>
            <button
              onClick={handlePlaceOrder}
              disabled={isPlacingOrder}
              className="w-full py-3 bg-gradient-to-r from-[#156A98] to-[#0F9D8F] text-white font-medium rounded-lg hover:opacity-90 transition disabled:opacity-50"
            >
              {isPlacingOrder ? 'Placing Order...' : 'Place Order'}
            </button>
          </div>
        </div>
      </div>

      {/* Minimum Order Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={closeModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-6 z-50 max-w-md w-full"
            >
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <svg
                    className="h-6 w-6 text-red-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">দুঃখিত</h3>
                <p className="text-gray-600 mb-6">
                  প্রথম অর্ডারের সর্বনিম্ন পরিমাণ ৫০০ টাকা।
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/products"
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-[#156A98] to-[#0F9D8F] text-white rounded-lg hover:opacity-90 text-center"
                    onClick={closeModal}
                  >
                    পণ্য দেখুন
                  </Link>
                  <Link
                    href="/favourite"
                    className="flex-1 px-4 py-2 border border-[#0F9D8F] text-[#0F9D8F] rounded-lg hover:bg-[#0F9D8F]/10 text-center"
                    onClick={closeModal}
                  >
                    পছন্দের তালিকা
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}