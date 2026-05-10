"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";

interface Product {
  id: string;
  name: string;
  image: string;
  sellPrice: number;
}

interface AddToCartButtonProps {
  product: Product;
  sticky?: boolean;
}

export default function AddToCartButton({ product, sticky = false }: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState<number>(1);
  const { addItem } = useCart();

  const handleQuantityChange = (value: number) => {
    const safe = Math.max(1, Math.floor(value));
    setQuantity(safe);
  };

  const increment = () => setQuantity((prev) => prev + 1);
  const decrement = () => setQuantity((prev) => Math.max(prev - 1, 1));

  const handleAdd = () => {
    addItem(product, quantity);
    setQuantity(1);
  };

  const quantityInput = (
    <div className="flex items-center">
      <button
        type="button"
        onClick={decrement}
        disabled={quantity <= 1}
        className="px-2 py-2 text-gray-600 hover:text-[#0F9D8F] disabled:opacity-50"
      >
        <Minus size={20} />
      </button>
      <input
        type="number"
        min="1"
        value={quantity}
        onChange={(e) => handleQuantityChange(Number(e.target.value))}
        className="w-14 text-center border-0 bg-transparent text-black font-medium text-lg [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={increment}
        className="px-2 py-2 text-gray-600 hover:text-[#0F9D8F]"
      >
        <Plus size={20} />
      </button>
    </div>
  );

  if (sticky) {
    return (
      <div className="flex items-center gap-3 w-full">
        <div className="flex items-center border border-gray-300 rounded-lg bg-white">
          {quantityInput}
        </div>
        <button
          onClick={handleAdd}
          className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#156A98] to-[#0F9D8F] text-white py-3 px-6 rounded-lg hover:opacity-90 font-medium"
        >
          <ShoppingCart size={20} />
          Add to Cart
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center border border-gray-300 rounded-lg">
        {quantityInput}
      </div>
      <button
        onClick={handleAdd}
        className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#156A98] to-[#0F9D8F] text-white py-2 px-6 rounded-lg hover:opacity-90"
      >
        <ShoppingCart size={20} />
        Add to Cart
      </button>
    </div>
  );
}