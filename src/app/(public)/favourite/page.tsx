// app/favourite/page.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useFavourites } from "@/contexts/FavouritesContext";
import { Heart, ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";

export default function FavouritePage() {
  const { favourites, removeFavourite } = useFavourites();
  const { addItem } = useCart();

  if (favourites.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <Heart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h1 className="text-3xl font-bold text-gray-800 mb-4">No Favourites Yet</h1>
        <p className="text-gray-600 mb-8">Start adding items to your favourites!</p>
        <Link
          href="/products"
          className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-[#156A98] to-[#0F9D8F] text-white font-medium rounded-lg hover:opacity-90"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mb-20">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Your Favourites</h1>

      {/* Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {favourites.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition"
          >
            <div className="relative h-40 sm:h-48 w-full">
              <Image
                src={item.image}
                alt={item.name}
                fill
                className="object-contain p-2"
              />
              {/* Remove from favourites button */}
              <button
                onClick={() => removeFavourite(item.id)}
                className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition"
                aria-label="Remove from favourites"
              >
                <Heart className="w-4 h-4 fill-red-500 text-red-500" />
              </button>
            </div>
            <div className="p-3 sm:p-4">
              <h3 className="font-semibold text-base sm:text-lg text-gray-800 line-clamp-1">
                {item.name}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                {item.generic?.name} {item.brand?.name && `| ${item.brand.name}`}
              </p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-lg sm:text-xl font-bold text-[#0F9D8F]">
                  ৳{item.price}
                </span>
                <button
                  onClick={() => addItem(item, 1)}
                  className="p-2 bg-gradient-to-r from-[#156A98] to-[#0F9D8F] text-white rounded-lg hover:opacity-90 transition"
                  aria-label="Add to cart"
                >
                  <ShoppingCart size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}