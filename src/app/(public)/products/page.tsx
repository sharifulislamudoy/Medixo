"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutGrid, Table, ShoppingCart, Minus, Plus, Check } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useFavourites } from "@/contexts/FavouritesContext";

interface Product {
    id: string;
    name: string;
    category: string;
    sku: string;
    mrp: number;
    generic: { name: string } | null;
    brand: { name: string } | null;
    image: string;
    description: string;
    sellPrice: number;
    stock: number;
    availability: boolean;
}

type ViewMode = "card" | "table";

export default function ProductsPage() {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [filtered, setFiltered] = useState<Product[]>([]);
    const [search, setSearch] = useState("");
    const [viewMode, setViewMode] = useState<ViewMode>("card");
    const [isLoading, setIsLoading] = useState(true);
    const { addItem } = useCart();
    const { isFavourite, addFavourite, removeFavourite } = useFavourites();

    // Inline quantity selector state
    const [addingProductId, setAddingProductId] = useState<string | null>(null);
    const [tempQuantity, setTempQuantity] = useState(1);

    // Load products
    useEffect(() => {
        setIsLoading(true);
        fetch("/api/products")
            .then(res => res.json())
            .then(data => {
                setProducts(data);
                setFiltered(data);
                setIsLoading(false);
            })
            .catch(() => setIsLoading(false));
    }, []);

    // Load saved view mode
    useEffect(() => {
        const saved = localStorage.getItem("productViewMode") as ViewMode | null;
        if (saved && (saved === "card" || saved === "table")) {
            setViewMode(saved);
        }
    }, []);

    // Save view mode
    useEffect(() => {
        localStorage.setItem("productViewMode", viewMode);
    }, [viewMode]);

    // Filter products
    useEffect(() => {
        const lower = search.toLowerCase();
        setFiltered(
            products.filter(
                p =>
                    p.name.toLowerCase().includes(lower) ||
                    p.generic?.name.toLowerCase().includes(lower) ||
                    p.brand?.name.toLowerCase().includes(lower)
            )
        );
    }, [search, products]);

    const handleAddClick = (product: Product) => {
        setAddingProductId(product.id);
        setTempQuantity(1);
    };

    const handleConfirmAdd = (product: Product) => {
        addItem(product, tempQuantity);
        setAddingProductId(null);
    };

    const handleCancelAdd = () => {
        setAddingProductId(null);
    };

    const calculateDiscount = (mrp: number, sellPrice: number) => {
        if (mrp <= 0) return 0;
        return Math.round(((mrp - sellPrice) / mrp) * 100);
    };

    const rowVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            transition: { delay: i * 0.03, duration: 0.3 },
        }),
    };

    // --- Skeleton Components ---
    const SkeletonCard = () => (
        <div className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
            <div className="h-48 w-full bg-gray-200" />
            <div className="p-4">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
                <div className="flex justify-between items-center mb-3">
                    <div className="h-6 bg-gray-200 rounded w-20" />
                    <div className="h-4 bg-gray-200 rounded w-16" />
                </div>
                <div className="flex gap-2">
                    <div className="flex-1 h-10 bg-gray-200 rounded" />
                    <div className="flex-1 h-10 bg-gray-200 rounded" />
                </div>
            </div>
        </div>
    );

    const SkeletonTableRow = () => (
        <tr className="animate-pulse">
            <td className="px-6 py-4"><div className="w-12 h-12 bg-gray-200 rounded" /></td>
            <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32" /></td>
            <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24" /></td>
            <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24" /></td>
            <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20" /></td>
            <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16" /></td>
            <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-12" /></td>
        </tr>
    );

    const SkeletonTableMobileRow = () => (
        <tr className="animate-pulse">
            <td className="px-4 py-4"><div className="w-12 h-12 bg-gray-200 rounded" /></td>
            <td className="px-4 py-4">
                <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-32" />
                    <div className="h-3 bg-gray-200 rounded w-24" />
                    <div className="h-3 bg-gray-200 rounded w-16" />
                </div>
            </td>
            <td className="px-4 py-4"><div className="h-8 w-8 bg-gray-200 rounded" /></td>
        </tr>
    );

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        >
            {/* Header with search and toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Products</h1>
                <div className="flex items-center gap-3 justify-between">
                    <input
                        type="text"
                        placeholder="Search & Filter products..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#0F9D8F] focus:border-[#0F9D8F] outline-none text-black"
                    />
                    <div className="flex bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode("card")}
                            className={`p-2 rounded-md transition ${viewMode === "card" ? "bg-white shadow text-[#0F9D8F]" : "text-gray-600"
                                }`}
                        >
                            <LayoutGrid size={20} />
                        </button>
                        <button
                            onClick={() => setViewMode("table")}
                            className={`p-2 rounded-md transition ${viewMode === "table" ? "bg-white shadow text-[#0F9D8F]" : "text-gray-600"
                                }`}
                        >
                            <Table size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Products Display */}
            {viewMode === "card" ? (
                /* ---------- CARD VIEW ---------- */
                <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-6">
                    {isLoading ? (
                        Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
                    ) : (
                        <AnimatePresence>
                            {filtered.map((product, i) => {
                                const discount = calculateDiscount(product.mrp, product.sellPrice);
                                const isAdding = addingProductId === product.id;

                                return (
                                    <motion.div
                                        key={product.id}
                                        custom={i}
                                        variants={rowVariants}
                                        initial="hidden"
                                        animate="visible"
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        layout
                                        className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition cursor-pointer"
                                        onClick={() => router.push(`/products/${product.id}`)}
                                    >
                                        {/* Entire card is clickable except the button area */}
                                        <div className="flex md:flex-col">
                                            <div className="relative h-40 w-1/3 md:w-full">
                                                <Image
                                                    src={product.image}
                                                    alt={product.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                                {discount > 0 && (
                                                    <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                                        {discount}% OFF
                                                    </div>
                                                )}
                                                {/* Favourite button */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (isFavourite(product.id)) {
                                                            removeFavourite(product.id);
                                                        } else {
                                                            addFavourite(product);
                                                        }
                                                    }}
                                                    className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:scale-110 transition z-10"
                                                >
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        fill={isFavourite(product.id) ? "currentColor" : "none"}
                                                        viewBox="0 0 24 24"
                                                        strokeWidth={1.5}
                                                        stroke="currentColor"
                                                        className={`w-5 h-5 ${isFavourite(product.id) ? 'text-red-500' : 'text-gray-600'}`}
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                                                        />
                                                    </svg>
                                                </button>
                                            </div>
                                            <div className="p-4">
                                                <h3 className="font-semibold text-lg text-gray-800 line-clamp-1">
                                                    {product.name}
                                                </h3>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {product.generic?.name} {product.brand?.name && `| ${product.brand.name}`}
                                                </p>
                                                <span className={`text-sm ${product.availability ? 'text-green-600' : 'text-red-500'}`}>
                                                    {product.availability ? 'In Stock' : 'Out of Stock'}
                                                </span>
                                                <div className="flex items-center justify-between mt-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xl font-bold text-[#0F9D8F]">৳{product.sellPrice}</span>
                                                        {product.mrp > product.sellPrice && (
                                                            <span className="text-sm text-gray-400 line-through">৳{product.mrp}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Buttons container - clicks don't navigate */}
                                        <div className="p-1 md:p-4 pb-2" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex gap-2">
                                                {isAdding ? (
                                                    <div className="flex-1 flex items-center justify-between gap-1 bg-gray-100 rounded-lg">
                                                        <button
                                                            onClick={() => setTempQuantity(prev => Math.max(prev - 1, 1))}
                                                            className="p-2  text-gray-600 hover:text-[#0F9D8F]"
                                                            disabled={tempQuantity <= 1}
                                                        >
                                                            <Minus size={18} />
                                                        </button>
                                                        <span className="w-8 text-center text-black font-medium">{tempQuantity}</span>
                                                        <button
                                                            onClick={() => setTempQuantity(prev => prev + 1)}
                                                            className="p-2 text-gray-600 hover:text-[#0F9D8F]"
                                                        >
                                                            <Plus size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleConfirmAdd(product)}
                                                            className="p-2 bg-gradient-to-r from-[#156A98] to-[#0F9D8F] text-white rounded-r-lg hover:opacity-90 w-10"
                                                        >
                                                            <Check size={18} />
                                                        </button>
                                                        <button
                                                            onClick={handleCancelAdd}
                                                            className="p-2 text-gray-500 hover:text-gray-700"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleAddClick(product)}
                                                        className="flex-1 flex items-center justify-center gap-1 bg-gradient-to-r from-[#156A98] to-[#0F9D8F] text-white py-2 rounded-lg hover:opacity-90"
                                                    >
                                                        <ShoppingCart size={18} /> Add
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    )}
                    {!isLoading && filtered.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-500">No products found.</div>
                    )}
                </div>
            ) : (
                /* ---------- TABLE VIEW ---------- */
                <>
                    {/* Desktop Table */}
                    <div className="hidden md:block bg-white rounded-xl shadow overflow-x-auto">
                        <table className="w-full min-w-[900px]">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Image</th>
                                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Name</th>
                                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Generic</th>
                                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Brand</th>
                                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Price</th>
                                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Availability</th>
                                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => <SkeletonTableRow key={i} />)
                                ) : (
                                    <AnimatePresence>
                                        {filtered.map((product, i) => {
                                            const discount = calculateDiscount(product.mrp, product.sellPrice);
                                            const isAdding = addingProductId === product.id;
                                            return (
                                                <motion.tr
                                                    key={product.id}
                                                    custom={i}
                                                    variants={rowVariants}
                                                    initial="hidden"
                                                    animate="visible"
                                                    exit={{ opacity: 0, x: -20 }}
                                                    layout
                                                    className="hover:bg-gray-50 cursor-pointer"
                                                    onClick={() => router.push(`/products/${product.id}`)}
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                                                            <Image src={product.image} alt={product.name} fill className="object-cover" />
                                                            {discount > 0 && (
                                                                <div className="absolute top-0 left-0 bg-red-500 text-white text-[10px] px-1 rounded-br-lg">
                                                                    {discount}%
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{product.name}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">{product.generic?.name || '-'}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">{product.brand?.name || '-'}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">
                                                        <span className="font-semibold text-[#0F9D8F]">৳{product.sellPrice}</span>
                                                        {product.mrp > product.sellPrice && (
                                                            <span className="ml-2 text-xs text-gray-400 line-through">৳{product.mrp}</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm">
                                                        <span className={`text-sm ${product.availability ? 'text-green-600' : 'text-red-500'}`}>
                                                            {product.availability ? 'In Stock' : 'Out of Stock'}
                                                        </span>
                                                    </td>
                                                    {/* Actions column - clicks don't navigate */}
                                                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                                        <div className="flex items-center space-x-3">
                                                            {/* Favourite icon */}
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (isFavourite(product.id)) {
                                                                        removeFavourite(product.id);
                                                                    } else {
                                                                        addFavourite(product);
                                                                    }
                                                                }}
                                                                className="text-gray-500 hover:text-red-500"
                                                            >
                                                                <svg
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    fill={isFavourite(product.id) ? "currentColor" : "none"}
                                                                    viewBox="0 0 24 24"
                                                                    strokeWidth={1.5}
                                                                    stroke="currentColor"
                                                                    className="w-5 h-5"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                                                                    />
                                                                </svg>
                                                            </button>
                                                            {/* Cart */}
                                                            {isAdding ? (
                                                                <div className="flex items-center gap-1 bg-gray-100 rounded-lg">
                                                                    <button
                                                                        onClick={() => setTempQuantity(prev => Math.max(prev - 1, 1))}
                                                                        className="p-1 text-gray-600 hover:text-[#0F9D8F]"
                                                                        disabled={tempQuantity <= 1}
                                                                    >
                                                                        <Minus size={16} />
                                                                    </button>
                                                                    <span className="w-6 text-center text-black text-sm">{tempQuantity}</span>
                                                                    <button
                                                                        onClick={() => setTempQuantity(prev => prev + 1)}
                                                                        className="p-1 text-gray-600 hover:text-[#0F9D8F]"
                                                                    >
                                                                        <Plus size={16} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleConfirmAdd(product)}
                                                                        className="p-1 bg-gradient-to-r from-[#156A98] to-[#0F9D8F] text-white rounded-r-lg"
                                                                    >
                                                                        <Check size={16} />
                                                                    </button>
                                                                    <button
                                                                        onClick={handleCancelAdd}
                                                                        className="p-1 text-gray-500 hover:text-gray-700"
                                                                    >
                                                                        ✕
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    onClick={() => handleAddClick(product)}
                                                                    className="text-green-600 hover:text-green-800"
                                                                >
                                                                    <ShoppingCart size={18} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            );
                                        })}
                                    </AnimatePresence>
                                )}
                            </tbody>
                        </table>
                        {!isLoading && filtered.length === 0 && (
                            <div className="text-center py-12 text-gray-500">No products found.</div>
                        )}
                    </div>

                    {/* Mobile Table (condensed) - improved layout */}
                    <div className="block md:hidden bg-white rounded-xl shadow overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Image</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Product Info</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => <SkeletonTableMobileRow key={i} />)
                                ) : (
                                    <AnimatePresence>
                                        {filtered.map((product, i) => {
                                            const discount = calculateDiscount(product.mrp, product.sellPrice);
                                            const isAdding = addingProductId === product.id;
                                            return (
                                                <motion.tr
                                                    key={product.id}
                                                    custom={i}
                                                    variants={rowVariants}
                                                    initial="hidden"
                                                    animate="visible"
                                                    exit={{ opacity: 0, x: -20 }}
                                                    layout
                                                    className="hover:bg-gray-50 cursor-pointer"
                                                    onClick={() => router.push(`/products/${product.id}`)}
                                                >
                                                    <td className="px-4 py-4 w-1/4">
                                                        <div className="relative w-full h-25 rounded-lg overflow-hidden">
                                                            <Image src={product.image} alt={product.name} fill className="object-cover" />
                                                            {discount > 0 && (
                                                                <div className="absolute top-0 left-0 bg-red-500 text-white text-[10px] px-1 rounded-br-lg">
                                                                    {discount}%
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="pl-2 py-4">
                                                        <div className="space-y-1">
                                                            <div className="font-medium text-gray-900">
                                                                {product.name}
                                                            </div>
                                                            <div className="text-xs text-gray-600">
                                                                {product.generic?.name && <span>{product.generic.name} |</span>}
                                                                {product.brand?.name && <span> {product.brand.name}</span>}
                                                            </div>
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-sm font-semibold text-[#0F9D8F]">৳{product.sellPrice}</span>
                                                                {product.mrp > product.sellPrice && (
                                                                    <span className="text-xs text-gray-400 line-through">৳{product.mrp}</span>
                                                                )}
                                                            </div>
                                                            <span className={`text-xs ${product.availability ? 'text-green-600' : 'text-red-500'}`}>
                                                                {product.availability ? 'In Stock' : 'Out of Stock'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    {/* Actions column - clicks don't navigate, with improved spacing */}
                                                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                                                        <div className="flex flex-col items-center gap-2 min-w-[80px]">
                                                            {/* Favourite icon */}
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (isFavourite(product.id)) {
                                                                        removeFavourite(product.id);
                                                                    } else {
                                                                        addFavourite(product);
                                                                    }
                                                                }}
                                                                className="p-2 text-gray-500 hover:text-red-500"
                                                            >
                                                                <svg
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    fill={isFavourite(product.id) ? "currentColor" : "none"}
                                                                    viewBox="0 0 24 24"
                                                                    strokeWidth={1.5}
                                                                    stroke="currentColor"
                                                                    className="w-5 h-5"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                                                                    />
                                                                </svg>
                                                            </button>
                                                            {/* Cart */}
                                                            {isAdding ? (
                                                                <div className="flex flex-col items-center gap-1 bg-gray-100 rounded-lg p-2 w-full">
                                                                    <div className="flex items-center justify-center gap-2">
                                                                        <button
                                                                            onClick={() => setTempQuantity(prev => Math.max(prev - 1, 1))}
                                                                            className="p-2 text-gray-600 hover:text-[#0F9D8F]"
                                                                            disabled={tempQuantity <= 1}
                                                                        >
                                                                            <Minus size={18} />
                                                                        </button>
                                                                        <span className="w-8 text-center font-medium text-black">{tempQuantity}</span>
                                                                        <button
                                                                            onClick={() => setTempQuantity(prev => prev + 1)}
                                                                            className="p-2 text-gray-600 hover:text-[#0F9D8F]"
                                                                        >
                                                                            <Plus size={18} />
                                                                        </button>
                                                                    </div>
                                                                    <div className="flex gap-2 w-full justify-center">
                                                                        <button
                                                                            onClick={() => handleConfirmAdd(product)}
                                                                            className="p-2 bg-gradient-to-r from-[#156A98] to-[#0F9D8F] text-white rounded-lg flex-1"
                                                                        >
                                                                            <Check size={18} className="mx-auto" />
                                                                        </button>
                                                                        <button
                                                                            onClick={handleCancelAdd}
                                                                            className="p-2 text-gray-500 hover:text-gray-700"
                                                                        >
                                                                            ✕
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    onClick={() => handleAddClick(product)}
                                                                    className="p-3 text-green-600 hover:text-green-800 bg-gray-50 rounded-lg w-full flex justify-center"
                                                                    aria-label="Add to cart"
                                                                >
                                                                    <ShoppingCart size={22} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            );
                                        })}
                                    </AnimatePresence>
                                )}
                            </tbody>
                        </table>
                        {!isLoading && filtered.length === 0 && (
                            <div className="text-center py-12 text-gray-500">No products found.</div>
                        )}
                    </div>
                </>
            )}
        </motion.div>
    );
}