// components/HomeSections.tsx
"use client";

import { useEffect, useState } from "react";
import ProductSliderWrapper from "@/components/products/ProductSliderWrapper";

interface SectionProduct {
  id: string;
  name: string;
  slug: string;
  image: string;
  mrp: number;
  sellPrice: number;
  discount: number;
  generic: { name: string } | null;
  brand: { name: string } | null;
}

interface HomeSection {
  id: string;
  title: string;
  description?: string;
  products: SectionProduct[];
}

export default function HomeSections() {
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/home-sections")
      .then(res => res.json())
      .then(data => {
        setSections(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
        {[1, 2].map(i => (
          <div key={i} className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-4" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="bg-white rounded-lg shadow p-4">
                  <div className="h-40 bg-gray-200 rounded mb-3" />
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (sections.length === 0) return null;

  return (
    <div className="space-y-12 pb-12 mt-10">
      {sections.map(section => (
        <section key={section.id} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{section.title}</h2>
          {section.description && (
            <p className="text-gray-600 mb-6">{section.description}</p>
          )}
          <ProductSliderWrapper products={section.products} />
        </section>
      ))}
    </div>
  );
}