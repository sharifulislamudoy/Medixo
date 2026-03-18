"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

// Import Lucide icons
import {
  Home,
  Package,
  ShoppingBag,
  Heart,
  History,
  Wallet,
  ClipboardList,
  LogOut,
  User,
  Search,
  Menu,
  X,
  LucideLoader2,
  LucideLoader,
  Target,
} from "lucide-react";

// Simple product type for search results
interface SearchProduct {
  id: string;
  name: string;
  brand?: { name: string } | null;
}

export default function Navbar() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [allProducts, setAllProducts] = useState<SearchProduct[]>([]);
  const [searchResults, setSearchResults] = useState<SearchProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 🔐 Get the current session (user login info)
  const { data: session, status } = useSession();

  const roleRouteMap: Record<string, string> = {
    ADMIN: "/dashboard/admin",
    SHOP_OWNER: "/dashboard/shop-owner",
    DELIVERY_BOY: "/dashboard/delivery-boy",
    SUPPLIER: "/dashboard/supplier",
  };

  const dashboardRoute =
    roleRouteMap[session?.user?.role as string] || "/dashboard";

  // Navigation items for logged-in users (used in desktop dropdown and bottom nav for customers)
  const loggedInNavItems = [
    { name: "Products", href: "/products", icon: Package },
    { name: "Bag", href: "/bag", icon: ShoppingBag },
    { name: "Favourite", href: "/favourite", icon: Heart },
    { name: "History", href: "/history", icon: History },
  ];

  // Navigation items for delivery boy (used in bottom nav and desktop dropdown)
  const deliveryBoyNavItems = [
    { name: "Orders", href: "/orders", icon: ClipboardList },
    { name: "Leaderboard", href: "/delivery-boy-leaderboard", icon: Target },
    { name: "Cash", href: "/cash", icon: Wallet },
    { name: "History", href: "/delivery-boy-history", icon: History },
  ];

  // Determine which set of items to show in the desktop dropdown based on role
  const dropdownNavItems =
    session?.user?.role === "DELIVERY_BOY"
      ? deliveryBoyNavItems
      : loggedInNavItems;

  // Fetch all products once on mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        setAllProducts(
          data.map((p: any) => ({
            id: p.id,
            name: p.name,
            brand: p.brand,
          }))
        );
      } catch (error) {
        console.error("Failed to fetch products for search", error);
      }
    };
    fetchProducts();
  }, []);

  // Debounced search filter
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    setIsSearching(true);
    setShowSearchDropdown(true);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      const query = searchQuery.toLowerCase();
      const filtered = allProducts
        .filter(
          (product) =>
            product.name.toLowerCase().includes(query) ||
            (product.brand?.name &&
              product.brand.name.toLowerCase().includes(query))
        )
        .slice(0, 5);

      setSearchResults(filtered);
      setIsSearching(false);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, allProducts]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowSearchDropdown(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchFocus = () => {
    if (searchQuery.trim() !== "") {
      setShowSearchDropdown(true);
    }
  };

  const handleResultClick = (productId: string) => {
    setShowSearchDropdown(false);
    setSearchQuery("");
    router.push(`/products/${productId}`);
  };

  // Close mobile menu on window resize above md breakpoint
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsMenuOpen(false);
      }
    };

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const userInitial = session?.user?.name
    ? session.user.name.charAt(0).toUpperCase()
    : "U";

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`sticky top-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-white/95 backdrop-blur-md shadow-lg"
            : "bg-white shadow-sm"
        }`}
      >
        {/* Decorative top border gradient */}
        <div className="h-1 w-full bg-gradient-to-r from-[#156A98] via-[#0F9D8F] to-[#156A98]" />

        {/* First row: Logo, Desktop Nav, Search (md+), Login/Avatar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Hamburger (mobile) + Logo */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Hamburger Menu Button (visible only on mobile) */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={toggleMenu}
                className="md:hidden p-2 rounded-lg text-gray-600 hover:text-[#156A98] hover:bg-[#156A98]/10 focus:outline-none transition-all duration-200"
                aria-label="Toggle menu"
              >
                {isMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </motion.button>

              {/* Logo + Brand Name */}
              <Link
                href="/"
                className="flex items-center gap-2 flex-shrink-0 group"
              >
                <div className="relative">
                  <Image
                    src="/Logo.png"
                    alt="Medi Murt Logo"
                    width={120}
                    height={40}
                    className="h-10 w-auto transition-transform duration-300 group-hover:scale-105"
                    priority
                  />
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="absolute -top-1 -right-1 w-2 h-2 bg-[#0F9D8F] rounded-full"
                  />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-[#156A98] to-[#0F9D8F] bg-clip-text text-transparent hidden sm:inline">
                  Medi Murt
                </span>
              </Link>
            </div>

            {/* Center: Desktop Navigation + Search (md+) */}
            <div className="hidden md:flex items-center flex-1 justify-center gap-4">
              {/* Desktop Navigation Links */}
              <div className="flex items-center space-x-1">
                {["Products", "Services", "About", "Contact"].map(
                  (item, index) => (
                    <motion.div
                      key={item}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link
                        href={`/${item.toLowerCase().replace(/\s+/g, "")}`}
                        className="relative group px-3 py-2 rounded-lg text-gray-700 font-medium hover:text-[#0F9D8F] transition-all duration-200"
                      >
                        <span>{item}</span>
                        <span className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-[#156A98] to-[#0F9D8F] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                      </Link>
                    </motion.div>
                  )
                )}
              </div>

              {/* Search Bar for md+ */}
              <div className="relative max-w-xs w-full" ref={searchRef}>
                <input
                  type="text"
                  placeholder="Search medicines..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={handleSearchFocus}
                  className="w-full text-black border border-gray-200 rounded-full py-2 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-[#0F9D8F]/50 focus:border-[#0F9D8F] transition-all duration-300"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            {/* Right: Login Button OR User Avatar Circle */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {status === "loading" ? (
                <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse" />
              ) : session ? (
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-[#156A98] to-[#0F9D8F] text-white font-bold text-lg flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-300"
                    aria-label="User menu"
                  >
                    {userInitial}
                  </motion.button>

                  {/* Dropdown Menu */}
                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50"
                      >
                        <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-[#156A98]/5 to-[#0F9D8F]/5">
                          <p className="text-sm font-semibold text-gray-800 truncate">
                            {session.user?.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {session.user?.email}
                          </p>
                        </div>

                        {!isMobile ? (
                          <>
                            {/* Role-specific navigation items for desktop */}
                            {dropdownNavItems.map((item) => {
                              const Icon = item.icon;
                              return (
                                <Link
                                  key={item.name}
                                  href={item.href}
                                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#0F9D8F]/10 hover:text-[#0F9D8F] transition-colors duration-200"
                                  onClick={() => setIsDropdownOpen(false)}
                                >
                                  <Icon className="h-4 w-4" />
                                  {item.name}
                                </Link>
                              );
                            })}
                            <Link
                              href={dashboardRoute}
                              className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#0F9D8F]/10 hover:text-[#0F9D8F] transition-colors duration-200"
                              onClick={() => setIsDropdownOpen(false)}
                            >
                              <User className="h-4 w-4" />
                              Dashboard
                            </Link>
                          </>
                        ) : (
                          // On mobile, only show Dashboard in the dropdown
                          <>
                            <Link
                              href={dashboardRoute}
                              className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#0F9D8F]/10 hover:text-[#0F9D8F] transition-colors duration-200"
                              onClick={() => setIsDropdownOpen(false)}
                            >
                              <User className="h-4 w-4" />
                              Dashboard
                            </Link>
                          </>
                        )}

                        <button
                          onClick={() => {
                            setIsDropdownOpen(false);
                            signOut({ callbackUrl: "/login" });
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors duration-200"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign Out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {isDropdownOpen && (
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsDropdownOpen(false)}
                    />
                  )}
                </div>
              ) : (
                <Link href="/login">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative group bg-gradient-to-r from-[#156A98] to-[#0F9D8F] text-white px-5 py-2 rounded-lg font-medium hover:shadow-lg transition-all duration-300 flex items-center gap-2 overflow-hidden"
                  >
                    <span className="absolute inset-0 bg-white/20 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
                    <User className="h-5 w-5 relative z-10" />
                    <span className="relative z-10">Login</span>
                  </motion.button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Second row: Search bar (only visible on mobile) */}
        <div className="block md:hidden max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-3">
          <div className="flex justify-center">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="relative w-full"
              ref={searchRef}
            >
              <input
                type="text"
                placeholder="Search medicines..."
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={handleSearchFocus}
                className="w-full text-black border border-gray-200 rounded-full py-2 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-[#0F9D8F]/50 focus:border-[#0F9D8F] transition-all duration-300 group-hover:shadow-md"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 group-hover:text-[#0F9D8F] transition-colors duration-300" />
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#156A98]/20 to-[#0F9D8F]/20 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300 -z-10" />
            </motion.div>
          </div>
        </div>

        {/* Search Results Dropdown */}
        <AnimatePresence>
          {showSearchDropdown && (searchResults.length > 0 || isSearching) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute max-w-3xl mx-auto top-full left-0 right-0 bg-white shadow-xl border-t border-gray-100 max-h-96 overflow-y-auto z-50"
            >
              <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
                {isSearching ? (
                  <div className="py-4 text-center text-gray-500">
                    Searching...
                  </div>
                ) : (
                  <ul className="lg:max-h-50 max-h-40 overflow-y-auto ">
                    {searchResults.map((product) => (
                      <li key={product.id}>
                        <button
                          onClick={() => handleResultClick(product.id)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between group"
                        >
                          <span className="text-gray-700 group-hover:text-[#0F9D8F]">
                            {product.name}
                          </span>
                          {product.brand?.name && (
                            <span className="text-sm text-gray-400">
                              {product.brand.name}
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Menu (Hamburger) */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden overflow-hidden bg-white/95 backdrop-blur-md border-t border-gray-100"
            >
              <div className="px-4 py-4 space-y-2">
                {["Home", "Products", "Services", "About", "Contact"].map(
                  (item, index) => (
                    <motion.div
                      key={item}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link
                        href={`/${item.toLowerCase().replace(/\s+/g, "")}`}
                        className="block text-gray-700 font-medium hover:text-[#0F9D8F] transition py-2 px-3 rounded-lg hover:bg-[#0F9D8F]/5"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {item}
                      </Link>
                    </motion.div>
                  )
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Overlay to close mobile menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Bottom Navigation for Mobile (visible only when logged in) */}
      {session && isMobile && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 md:hidden"
        >
          <div className="flex justify-around items-center py-2">
            {session.user.role === "DELIVERY_BOY" ? (
              // Delivery Boy items
              deliveryBoyNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex flex-col items-center p-2 text-gray-600 hover:text-[#0F9D8F] transition-colors"
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs mt-1">{item.name}</span>
                  </Link>
                );
              })
            ) : (
              // All other roles (ADMIN, SHOP_OWNER, SUPPLIER)
              <>
                <Link
                  href="/"
                  className="flex flex-col items-center p-2 text-gray-600 hover:text-[#0F9D8F] transition-colors"
                >
                  <Home className="h-5 w-5" />
                  <span className="text-xs mt-1">Home</span>
                </Link>
                {loggedInNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="flex flex-col items-center p-2 text-gray-600 hover:text-[#0F9D8F] transition-colors"
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-xs mt-1">{item.name}</span>
                    </Link>
                  );
                })}
              </>
            )}
          </div>
        </motion.div>
      )}
    </>
  );
}