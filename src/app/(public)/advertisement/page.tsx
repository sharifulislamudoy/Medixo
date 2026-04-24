"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

interface Ad {
  id: string;
  title: string;
  slug: string;
  imageUrl: string;
  category: string;
  hyperlink?: string;
}

export default function AdvertisementPage() {
  const [ads, setAds] = useState<Ad[]>([]);

  useEffect(() => {
    fetch("/api/advertisement/visible")
      .then((res) => res.json())
      .then(setAds);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Advertisements</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {ads.map((ad) => {
          const detailLink =
            ad.category === "ANNOUNCEMENT"
              ? `/advertisement/${ad.slug}`
              : ad.hyperlink || "#";

          return (
            <motion.div
              key={ad.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="relative w-full h-48">
                <Image
                  src={ad.imageUrl}
                  alt={ad.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </div>
              <div className="p-4 flex flex-col justify-between h-[calc(100%-12rem)]">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{ad.title}</h3>
                </div>
                <Link
                  href={detailLink}
                  className="self-end mt-2 inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#156A98] to-[#0F9D8F] rounded-lg hover:shadow-md transition"
                >
                  View Details
                </Link>
              </div>
            </motion.div>
          );
        })}
        {ads.length === 0 && (
          <p className="text-center col-span-full text-gray-500">No advertisements yet.</p>
        )}
      </div>
    </div>
  );
}