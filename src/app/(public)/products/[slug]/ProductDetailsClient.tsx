"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useCart } from "@/contexts/CartContext";
import AddToCartButton from "@/components/products/AddToCartButton";
import FavouriteButton from "@/components/products/FavouriteButton";

interface ProductWithRelations {
  id: string;
  name: string;
  slug: string;
  category: string;
  image: string;
  mrp: number;
  sellPrice: number;
  description: string;
  availability: boolean;
  generic: { name: string } | null;
  brand: { name: string } | null;
  stock: { quantity: number } | null;
}

interface Props {
  product: ProductWithRelations;
}

export default function ProductDetailsClient({ product }: Props) {
  const { addItem } = useCart();
  const [isMobile, setIsMobile] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const discount = product.mrp > product.sellPrice
    ? Math.round(((product.mrp - product.sellPrice) / product.mrp) * 100)
    : 0;

  // Get first 4 words of description
  const getShortDescription = (text: string) => {
    const words = text.split(/\s+/);
    return words.slice(0, 4).join(" ") + (words.length > 4 ? "..." : "");
  };

  const toggleDescription = () => setShowFullDescription(!showFullDescription);

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="md:flex">
          <div className="md:w-1/2 relative h-80 md:h-auto">
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-contain p-4"
              priority
            />
            {discount > 0 && (
              <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold z-10">
                {discount}% OFF
              </div>
            )}
            <div className="absolute top-4 right-4 z-10">
              <FavouriteButton product={product} />
            </div>
          </div>

          <div className="md:w-1/2 p-4">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{product.name}</h1>
            <p className="text-gray-600 mb-4">
              {product.generic?.name} {product.brand?.name && `by ${product.brand.name}`}
            </p>
            <div className="flex items-center gap-4 mb-6">
              <span className="text-3xl font-bold text-[#0F9D8F]">৳{product.sellPrice}</span>
              {product.mrp > product.sellPrice && (
                <span className="text-xl text-gray-400 line-through">৳{product.mrp}</span>
              )}
            </div>
            <div className="space-y-3 mb-6">
              <p><span className="font-medium text-black">Category:</span> <span className="font-medium text-gray-500">{product.category.replace('_', ' ')}</span></p>
              <p><span className="font-medium text-black">Availability:</span>
                <span className={`ml-2 ${product.availability ? 'text-green-600' : 'text-red-500'}`}>
                  {product.availability ? 'In Stock' : 'Out of Stock'}
                </span>
              </p>
            </div>
            <div className="mb-6">
              <h3 className="font-medium text-black mb-2">Description</h3>
              <p className="text-gray-500 whitespace-pre-line">
                {showFullDescription ? product.description : getShortDescription(product.description)}
              </p>
              {product.description.split(/\s+/).length > 4 && (
                <button
                  onClick={toggleDescription}
                  className="mt-2 text-[#0F9D8F] hover:underline font-medium"
                >
                  {showFullDescription ? "Read Less" : "Read More"}
                </button>
              )}
            </div>
            <div className={isMobile ? "hidden" : "block"}>
              <AddToCartButton product={product} />
            </div>
          </div>
        </div>
      </div>

      {isMobile && (
        <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-40 md:hidden">
          <AddToCartButton product={product} sticky />
        </div>
      )}
    </>
  );
}