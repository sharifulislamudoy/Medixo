import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import AddToCartButton from "@/components/products/AddToCartButton";
import FavouriteButton from "@/components/products/FavouriteButton";
import { Suspense } from "react";
import ProductSliderWrapper from "@/components/products/ProductSliderWrapper";
import { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

// ---------- METADATA GENERATION (SEO) ----------
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    select: {
      name: true,
      description: true,
      image: true,
      brand: { select: { name: true } },
      generic: { select: { name: true } },
    },
  });

  if (!product) {
    return {
      title: "Product Not Found",
      description: "The requested product could not be found.",
    };
  }

  const title = `${product.name} | Buy Online at Best Price | Medixo`;
  const description = product.description.slice(0, 160);
  const brandName = product.brand?.name || "";
  const genericName = product.generic?.name || "";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://medixo-bd.vercel.app/products/${slug}`,
      images: [
        {
          url: product.image,
          width: 800,
          height: 600,
          alt: product.name,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [product.image],
    },
    keywords: [
      product.name,
      brandName,
      genericName,
      "buy medicine online Bangladesh",
      "wholesale pharmacy",
    ].filter(Boolean),
    alternates: {
      canonical: `/products/${slug}`,
    },
  };
}

// ---------- BREADCRUMB ----------
async function ProductBreadcrumb({ slug }: { slug: string }) {
  const product = await prisma.product.findUnique({
    where: { slug },
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

// ---------- MAIN PRODUCT DETAILS ----------
async function ProductDetails({ slug }: { slug: string }) {
  const product = await prisma.product.findUnique({
    where: { slug },
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
            <p className="text-gray-500 whitespace-pre-line">{product.description}</p>
          </div>
          <AddToCartButton product={product} />
        </div>
      </div>
    </div>
  );
}

// ---------- SIMILAR / SUGGESTED SECTIONS ----------
async function SimilarProducts({ genericId, currentSlug }: { genericId: string; currentSlug: string }) {
  const similar = await prisma.product.findMany({
    where: {
      genericId,
      slug: { not: currentSlug },
      status: true,
    },
    include: { brand: true, generic: true },
    take: 10,
  });

  if (similar.length === 0) return null;

  const withDiscount = similar.map(p => ({
    ...p,
    discount: p.mrp > p.sellPrice ? Math.round(((p.mrp - p.sellPrice) / p.mrp) * 100) : 0
  }));
  const sorted = withDiscount.sort((a, b) => b.discount - a.discount);

  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Similar Products</h2>
      <ProductSliderWrapper products={sorted} />
    </section>
  );
}

async function SuggestedProducts({ brandId, genericId, currentSlug }: { brandId: string; genericId: string; currentSlug: string }) {
  const suggested = await prisma.product.findMany({
    where: {
      brandId,
      slug: { not: currentSlug },
      status: true,
      genericId: { not: genericId },
    },
    include: { brand: true, generic: true },
    take: 10,
  });

  if (suggested.length === 0) return null;

  const withDiscount = suggested.map(p => ({
    ...p,
    discount: p.mrp > p.sellPrice ? Math.round(((p.mrp - p.sellPrice) / p.mrp) * 100) : 0
  }));
  const sorted = withDiscount.sort((a, b) => b.discount - a.discount);

  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Suggested Products</h2>
      <ProductSliderWrapper products={sorted} />
    </section>
  );
}

// ---------- PAGE COMPONENT ----------
export default async function ProductDetailsPage({ params }: Props) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
    select: { genericId: true, brandId: true, slug: true },
  });

  if (!product) notFound();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Suspense fallback={<div className="h-4 bg-gray-200 rounded w-48 mb-6 animate-pulse" />}>
        <ProductBreadcrumb slug={slug} />
      </Suspense>

      <Suspense fallback={<ProductDetailsSkeleton />}>
        <ProductDetails slug={slug} />
      </Suspense>

      <Suspense fallback={<SliderSkeleton title="Similar Products" />}>
        <SimilarProducts genericId={product.genericId!} currentSlug={slug} />
      </Suspense>

      <Suspense fallback={<SliderSkeleton title="Suggested Products" />}>
        <SuggestedProducts brandId={product.brandId!} genericId={product.genericId!} currentSlug={slug} />
      </Suspense>
    </div>
  );
}

// Simple skeleton components (add to the same file)
function ProductDetailsSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
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
  );
}

function SliderSkeleton({ title }: { title: string }) {
  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">{title}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
            <div className="h-40 bg-gray-200" />
            <div className="p-3">
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}