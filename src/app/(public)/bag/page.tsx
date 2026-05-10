// app/bag/page.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/contexts/CartContext";

export default function BagPage() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, totalPrice, totalItems } = useCart();

  const handlePlaceOrder = () => {
    router.push("/check-out");
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Your Bag is Empty</h1>
        <p className="text-gray-600 mb-8">Looks like you haven't added anything to your bag yet.</p>
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Your Bag ({totalItems} items)</h1>

      {/* Place Order Button (desktop only) */}
      <div className="hidden md:flex justify-end mb-6">
        <button
          onClick={handlePlaceOrder}
          className="px-8 py-3 bg-gradient-to-r from-[#156A98] to-[#0F9D8F] text-white font-medium rounded-lg hover:opacity-90 transition"
        >
          Place Order
        </button>
      </div>

      {/* Order Summary - visible only on mobile (above items) */}
      <div className="block md:hidden mb-6">
        <div className="bg-gray-50 rounded-xl p-6">
          <div className="flex justify-between items-center text-lg">
            <span className="font-medium text-gray-700">Subtotal</span>
            <span className="font-bold text-[#0F9D8F]">৳{totalPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Cart Items */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border-b last:border-b-0 hover:bg-gray-50"
          >
            {/* Image + Details row for mobile */}
            <div className="flex items-center gap-4 flex-1">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-contain rounded-lg"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 truncate">
                  {item.name}
                </h3>
                <p className="text-sm text-gray-500">৳{item.price} each</p>
              </div>
            </div>

            {/* Quantity controls + price + remove (row on mobile) */}
            <div className="flex items-center justify-between sm:justify-end gap-4 mt-2 sm:mt-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                  className="p-1 rounded border border-gray-300 text-gray-600 hover:text-[#0F9D8F] disabled:opacity-50"
                >
                  <Minus size={18} />
                </button>
                <span className="w-8 text-center text-black font-medium">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="p-1 rounded border border-gray-300 text-gray-600 hover:text-[#0F9D8F]"
                >
                  <Plus size={18} />
                </button>
              </div>

              <div className="text-right min-w-[80px] sm:min-w-[100px]">
                <p className="font-semibold text-[#0F9D8F]">
                  ৳{(item.price * item.quantity).toFixed(2)}
                </p>
              </div>

              <button
                onClick={() => removeItem(item.id)}
                className="p-2 text-gray-400 hover:text-red-500"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Order Summary - visible only on desktop (below items) */}
      <div className="hidden md:block mt-6">
        <div className="bg-gray-50 rounded-xl p-6">
          <div className="flex justify-between items-center text-lg">
            <span className="font-medium text-gray-700">Subtotal</span>
            <span className="font-bold text-[#0F9D8F]">৳{totalPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Sticky Place Order button (mobile only, above bottom nav) */}
      <div className="fixed bottom-16 left-0 right-0 p-4 bg-white/95 backdrop-blur-sm border-t border-gray-200 z-40 md:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <button
          onClick={handlePlaceOrder}
          className="w-full py-3 bg-gradient-to-r from-[#156A98] to-[#0F9D8F] text-white font-medium rounded-lg hover:opacity-90 transition"
        >
          Place Order
        </button>
      </div>
    </div>
  );
}