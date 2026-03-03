"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

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
  // Fixed: useRef initialized with null and proper type
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

  // Fetch all products once on mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        // Store minimal data needed for search
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
        .slice(0, 5); // limit to 5 results

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

    handleResize(); // set initial value
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  // 🔤 Get first letter of user's name (fallback to "U" if name is missing)
  const userInitial = session?.user?.name
    ? session.user.name.charAt(0).toUpperCase()
    : "U";

  // Navigation items for logged-in users (used in desktop dropdown and mobile bottom nav)
  const loggedInNavItems = [
    { name: "Products", href: "/products", icon: "💊" },
    { name: "Bag", href: "/bag", icon: "🛒" },
    { name: "Favourite", href: "/favourite", icon: "❤️" },
    { name: "History", href: "/history", icon: "📜" },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled
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
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {isMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
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
                <svg
                  className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Right: Login Button OR User Avatar Circle */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {status === "loading" ? (
                // Show a small placeholder while session loads
                <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse" />
              ) : session ? (
                // 👤 User is LOGGED IN → Show Avatar Circle with dropdown
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
                        {/* User info at top of dropdown */}
                        <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-[#156A98]/5 to-[#0F9D8F]/5">
                          <p className="text-sm font-semibold text-gray-800 truncate">
                            {session.user?.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {session.user?.email}
                          </p>
                        </div>

                        {/* Conditionally render items based on screen size */}
                        {!isMobile ? (
                          // Desktop: Show all logged-in nav items + Dashboard + Sign Out
                          <>
                            {loggedInNavItems.map((item) => (
                              <Link
                                key={item.name}
                                href={item.href}
                                className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-[#0F9D8F]/10 hover:text-[#0F9D8F] transition-colors duration-200"
                                onClick={() => setIsDropdownOpen(false)}
                              >
                                <span className="mr-2">{item.icon}</span>
                                {item.name}
                              </Link>
                            ))}
                            <Link
                              href={dashboardRoute}
                              className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-[#0F9D8F]/10 hover:text-[#0F9D8F] transition-colors duration-200"
                              onClick={() => setIsDropdownOpen(false)}
                            >
                              Dashboard
                            </Link>
                          </>
                        ) : (
                          // Mobile: Show only Dashboard + Sign Out
                          <>
                            <Link
                              href={dashboardRoute}
                              className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-[#0F9D8F]/10 hover:text-[#0F9D8F] transition-colors duration-200"
                              onClick={() => setIsDropdownOpen(false)}
                            >
                              Dashboard
                            </Link>
                          </>
                        )}

                        {/* Sign Out button (common for both) */}
                        <button
                          onClick={() => {
                            setIsDropdownOpen(false);
                            signOut({ callbackUrl: "/login" });
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors duration-200"
                        >
                          Sign Out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Click outside to close dropdown */}
                  {isDropdownOpen && (
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsDropdownOpen(false)}
                    />
                  )}
                </div>
              ) : (
                // 🔒 User is NOT logged in → Show Login Button
                <Link href="/login">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative group bg-gradient-to-r from-[#156A98] to-[#0F9D8F] text-white px-5 py-2 rounded-lg font-medium hover:shadow-lg transition-all duration-300 flex items-center gap-2 overflow-hidden"
                  >
                    <span className="absolute inset-0 bg-white/20 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
                    <svg
                      className="h-5 w-5 relative z-10"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
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
              ref={searchRef} // reuse same ref to capture clicks for dropdown
            >
              <input
                type="text"
                placeholder="Search medicines..."
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={handleSearchFocus}
                className="w-full text-black border border-gray-200 rounded-full py-2 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-[#0F9D8F]/50 focus:border-[#0F9D8F] transition-all duration-300 group-hover:shadow-md"
              />
              <svg
                className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 group-hover:text-[#0F9D8F] transition-colors duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#156A98]/20 to-[#0F9D8F]/20 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300 -z-10" />
            </motion.div>
          </div>
        </div>

        {/* Search Results Dropdown (global, appears below navbar) */}
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
            {/* Home */}
            <Link
              href="/"
              className="flex flex-col items-center p-2 text-gray-600 hover:text-[#0F9D8F] transition-colors"
            >
              <span className="text-xl">🏠</span>
              <span className="text-xs mt-1">Home</span>
            </Link>

            {/* Logged-in nav items */}
            {loggedInNavItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex flex-col items-center p-2 text-gray-600 hover:text-[#0F9D8F] transition-colors"
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-xs mt-1">{item.name}</span>
              </Link>
            ))}
          </div>
        </motion.div>
      )}
    </>
  );
}