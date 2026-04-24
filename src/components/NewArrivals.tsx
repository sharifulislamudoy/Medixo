// components/NewArrivals.tsx

import { prisma } from "@/lib/prisma";
import ProductSliderWrapper from "@/components/products/ProductSliderWrapper";

export default async function NewArrivals() {
  const products = await prisma.product.findMany({
    where: { status: true },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      name: true,
      slug: true,
      image: true,
      mrp: true,
      sellPrice: true,
      generic: { select: { name: true } },
      brand: { select: { name: true } },
    },
  });

  if (products.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">New Arrivals</h2>
      <ProductSliderWrapper products={products} />
    </section>
  );
}