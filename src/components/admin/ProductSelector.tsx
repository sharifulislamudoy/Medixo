// components/admin/ProductSelector.tsx
"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";

interface Product {
  id: string;
  name: string;
  image: string;
}

interface Props {
  selected: string[];
  onChange: (ids: string[]) => void;
}

export default function ProductSelector({ selected, onChange }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/products?limit=200")
      .then(res => res.json())
      .then(data => setProducts(data));
  }, []);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleProduct = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter(s => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div>
      <div className="relative mb-3">
        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 text-gray-700 pr-4 py-2 border border-gray-300 rounded-lg"
        />
      </div>
      <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-2">
        {filtered.map(product => (
          <label
            key={product.id}
            className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selected.includes(product.id)}
              onChange={() => toggleProduct(product.id)}
              className="rounded"
            />
            <img src={product.image} alt="" className="w-10 h-10 object-cover rounded" />
            <span className="text-sm text-gray-700">{product.name}</span>
          </label>
        ))}
        {filtered.length === 0 && (
          <p className="text-gray-500 text-sm p-2">No products found</p>
        )}
      </div>
      <p className="text-xs text-gray-500 mt-2">{selected.length} product(s) selected</p>
    </div>
  );
}