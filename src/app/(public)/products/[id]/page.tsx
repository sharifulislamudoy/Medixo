import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import AddToCartButton from "@/components/products/AddToCartButton";
import FavouriteButton from "@/components/products/FavouriteButton";
import { Suspense } from "react";
import ProductSliderWrapper from "@/components/products/ProductSliderWrapper";
import ProductCard from "@/components/products/ProductCard"; // for skeleton fallback if needed

interface Props {
  params: Promise<{ id: string }>;
}

// Skeleton for product details
function ProductDetailsSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-48 mb-6" />
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="md:flex">
          <div className="md:w-1/2 h-80 md:h-auto bg-gray-200" />
          <div className="md:w-1/2 p-6 md:p-8">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
            <div className="h-10 bg-gray-200 rounded w-32 mb-6" />
            <div className="space-y-3 mb-6">
              <div className="h-4 bg-gray-200 rounded w-40" />
              <div className="h-4 bg-gray-200 rounded w-36" />
              <div className="h-4 bg-gray-200 rounded w-28" />
            </div>
            <div className="h-20 bg-gray-200 rounded mb-6" />
            <div className="h-12 bg-gray-200 rounded w-40" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Skeleton for product cards (used in related sections)
function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
      <div className="h-40 bg-gray-200" />
      <div className="p-3">
        <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
        <div className="h-5 bg-gray-200 rounded w-20" />
      </div>
    </div>
  );
}

// Breadcrumb component that fetches the product name
async function ProductBreadcrumb({ id }: { id: string }) {
  const product = await prisma.product.findUnique({
    where: { id },
    select: { name: true },
  });

  if (!product) return null;

  return (
    <nav className="text-sm mb-6">
      <Link href="/" className="text-gray-500 hover:text-[#0F9D8F]">Home</Link>
      <span className="mx-2 text-gray-400">/</span>
      <Link href="/products" className="text-gray-500 hover:text-[#0F9D8F]">Products</Link>
      <span className="mx-2 text-gray-400">/</span>
      <span className="text-gray-700">{product.name}</span>
    </nav>
  );
}

// Main product details (fetched data)
async function ProductDetails({ id }: { id: string }) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      generic: true,
      brand: true,
      stock: true,
    },
  });

  if (!product) notFound();

  const discount = product.mrp > product.sellPrice
    ? Math.round(((product.mrp - product.sellPrice) / product.mrp) * 100)
    : 0;

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="md:flex">
        {/* Left column: Image with favourite button overlay */}
        <div className="md:w-1/2 relative h-80 md:h-auto">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-contain p-4"
          />
          {discount > 0 && (
            <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold z-10">
              {discount}% OFF
            </div>
          )}
          {/* Favourite button placed on the image (top right) */}
          <div className="absolute top-4 right-4 z-10">
            <FavouriteButton product={product} />
          </div>
        </div>

        {/* Right column: Details and Add to Cart */}
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
            <p className="text-gray-500 whitespace-pre-line">{product.description}</p>
          </div>
          {/* Only Add to Cart remains here */}
          <AddToCartButton product={product} />
        </div>
      </div>
    </div>
  );
}

// Similar products section (fetches data, sorts by discount, and renders Swiper)
async function SimilarProducts({ genericId, currentId }: { genericId: string; currentId: string }) {
  const similar = await prisma.product.findMany({
    where: {
      genericId,
      id: { not: currentId },
      status: true,
    },
    include: { brand: true, generic: true },
    take: 10,
  });

  if (similar.length === 0) return null;

  // Calculate discount and sort descending
  const productsWithDiscount = similar.map(p => ({
    ...p,
    discount: p.mrp > p.sellPrice ? Math.round(((p.mrp - p.sellPrice) / p.mrp) * 100) : 0
  }));
  const sorted = productsWithDiscount.sort((a, b) => b.discount - a.discount);

  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Similar Products</h2>
      <ProductSliderWrapper products={sorted} />
    </section>
  );
}

// Suggested products section (same brand, different generic)
async function SuggestedProducts({ brandId, genericId, currentId }: { brandId: string; genericId: string; currentId: string }) {
  const suggested = await prisma.product.findMany({
    where: {
      brandId,
      id: { not: currentId },
      status: true,
      genericId: { not: genericId },
    },
    include: { brand: true, generic: true },
    take: 10,
  });

  if (suggested.length === 0) return null;

  const productsWithDiscount = suggested.map(p => ({
    ...p,
    discount: p.mrp > p.sellPrice ? Math.round(((p.mrp - p.sellPrice) / p.mrp) * 100) : 0
  }));
  const sorted = productsWithDiscount.sort((a, b) => b.discount - a.discount);

  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Suggested Products</h2>
      <ProductSliderWrapper products={sorted} />
    </section>
  );
}

export default async function ProductDetailsPage({ params }: Props) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    select: { genericId: true, brandId: true },
  });

  if (!product) notFound();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Suspense fallback={
        <nav className="text-sm mb-6">
          <Link href="/" className="text-gray-500 hover:text-[#0F9D8F]">Home</Link>
          <span className="mx-2 text-gray-400">/</span>
          <Link href="/products" className="text-gray-500 hover:text-[#0F9D8F]">Products</Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-700">Loading...</span>
        </nav>
      }>
        <ProductBreadcrumb id={id} />
      </Suspense>

      <Suspense fallback={<ProductDetailsSkeleton />}>
        <ProductDetails id={id} />
      </Suspense>

      <Suspense fallback={
        <div className="mt-12">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        </div>
      }>
        <SimilarProducts genericId={product.genericId!} currentId={id} />
      </Suspense>

      <Suspense fallback={
        <div className="mt-12">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        </div>
      }>
        <SuggestedProducts brandId={product.brandId!} genericId={product.genericId!} currentId={id} />
      </Suspense>
    </div>
  );
}