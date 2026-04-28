"use client";

import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import Link from "next/link";
import Image from "next/image";

interface Ad {
  id: string;
  title: string;
  slug: string;
  imageUrl: string;
  category: string;
  hyperlink?: string;
}

export default function HeroSection() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/advertisement/visible")
      .then((res) => res.json())
      .then((data) => {
        setAds(data);
        setLoading(false);
      })
      .catch(() => {
        // Even if the fetch fails, stop the loading skeleton
        setLoading(false);
      });
  }, []);

  // Show a skeleton placeholder while data is loading
  if (loading) {
    return (
      <div className="w-full">
        <div className="w-full h-[200px] md:h-[300px] lg:h-[450px] 2xl:h-[700px] bg-gray-200 animate-pulse rounded" />
      </div>
    );
  }

  // If no ads are available after loading, render nothing
  if (ads.length === 0) return null;

  return (
    <div className="w-full">
      <Swiper
        modules={[Pagination, Autoplay]}
        pagination={{ clickable: true }}
        autoplay={{ delay: 5000 }}
        loop
        className="h-full"
      >
        {ads.map((ad) => {
          const detailLink =
            ad.category === "ANNOUNCEMENT"
              ? `/advertisement/${ad.slug}`
              : ad.hyperlink || "#";

          return (
            <SwiperSlide key={ad.id}>
              <div className="relative w-full h-[200px] md:h-[300px] lg:h-[450px] 2xl:h-[700px]">
                <Image
                  src={ad.imageUrl}
                  alt={ad.title}
                  fill
                  className="object-cover object-center"
                  priority
                />
                <div className="absolute inset-0 bg-black/5 flex flex-col justify-end p-4 md:p-8">
                  <Link
                    href={detailLink}
                    className="mt-4 self-end text-xs md:text-sm lg:text-lg bg-gradient-to-r from-[#156A98] to-[#0F9D8F] text-white px-4 py-2 md:px-5 md:py-3 lg:px-8 rounded hover:shadow-lg transition-all duration-300"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
  );
}