"use client";

import Image from "next/image";
import Link from "next/link";

interface ProductCardProps {
  product: {
    id: string;
    slug: string;          
    name: string;
    image: string;
    mrp: number;
    sellPrice: number;
    generic?: { name: string } | null;
    brand?: { name: string } | null;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const discount = product.mrp > product.sellPrice
    ? Math.round(((product.mrp - product.sellPrice) / product.mrp) * 100)
    : 0;

  return (
    <Link href={`/products/${product.slug}`} className="group">   {/* ✅ slug */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
        <div className="relative h-40 w-full">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition"
          />
          {discount > 0 && (
            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {discount}% OFF
            </div>
          )}
        </div>
        <div className="p-3">
          <h3 className="font-semibold text-gray-800 line-clamp-1">{product.name}</h3>
          <p className="text-sm text-gray-600 mt-1">
            {product.generic?.name} | {product.brand?.name}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-lg font-bold text-[#0F9D8F]">৳{product.sellPrice}</span>
            {product.mrp > product.sellPrice && (
              <span className="text-xs text-gray-400 line-through">৳{product.mrp}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}