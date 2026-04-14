"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import ProductCard from "./ProductCard";

interface ProductSliderWrapperProps {
  products: any[]; // Replace with your actual Product type
}

export default function ProductSliderWrapper({ products }: ProductSliderWrapperProps) {
  return (
    <Swiper
      slidesPerView="auto"
      spaceBetween={20}
      pagination={{ clickable: true }}
      modules={[Pagination]}
      className="!pb-10"
    >
      {products.map((product) => (
        <SwiperSlide key={product.id} className="!w-64">
          <ProductCard product={product} />
        </SwiperSlide>
      ))}
    </Swiper>
  );
}