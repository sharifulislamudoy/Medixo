"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";

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
  Download,
  XCircle,
  Target,
  CircleDollarSign,
  Bell, // <-- added
} from "lucide-react";


interface SearchProduct {
  id: string;
  slug: string;
  name: string;
  brand?: { name: string } | null;
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [allProducts, setAllProducts] = useState<SearchProduct[]>([]);
  const [searchResults, setSearchResults] = useState<SearchProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { data: session, status } = useSession();
  const userRole = session?.user?.role;
  const isLoggedIn = !!session;
  const isDeliveryBoy = userRole === "DELIVERY_BOY";

  const roleRouteMap: Record<string, string> = {
    ADMIN: "/dashboard/admin",
    SHOP_OWNER: "/dashboard/shop-owner",
    DELIVERY_BOY: "/dashboard/delivery-boy",
    SUPPLIER: "/dashboard/supplier",
  };

  const dashboardRoute =
    roleRouteMap[session?.user?.role as string] || "/dashboard";

  const loggedInNavItems = [
    { name: "Products", href: "/products", icon: Package },
    { name: "Bag", href: "/bag", icon: ShoppingBag },
    { name: "Favourite", href: "/favourite", icon: Heart },
    { name: "History", href: "/history", icon: History },
  ];

  const deliveryBoyNavItems = [
    { name: "Orders", href: "/orders", icon: ClipboardList },
    { name: "Cash", href: "/cash", icon: Wallet },
    { name: "Leaderboard", href: "/delivery-boy-leaderboard", icon: Target },
    { name: "History", href: "/delivery-boy-history", icon: History },
    { name: "Earnings", href: "/earning", icon: CircleDollarSign },
  ];

  const dropdownNavItems = isDeliveryBoy ? deliveryBoyNavItems : loggedInNavItems;

  const desktopNavItems = [
    { name: "Products", href: "/products", activeWhen: "/products" },
    { name: "Services", href: "/services", activeWhen: "/services" },
    { name: "About", href: "/about", activeWhen: "/about" },
    { name: "Contact", href: "/contact", activeWhen: "/contact" },
  ];

  const getMobileMenuItems = () => {
    if (!isLoggedIn) {
      return [
        { name: "Home", href: "/", activeWhen: "/" },
        { name: "Products", href: "/products", activeWhen: "/products" },
        { name: "Services", href: "/services", activeWhen: "/services" },
        { name: "About", href: "/about", activeWhen: "/about" },
        { name: "Contact", href: "/contact", activeWhen: "/contact" },
      ];
    }
    const base = [
      { name: "Services", href: "/services", activeWhen: "/services" },
      { name: "About", href: "/about", activeWhen: "/about" },
      { name: "Contact", href: "/contact", activeWhen: "/contact" },
    ];
    if (!isDeliveryBoy) return base;
    return base;
  };

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  // Fetch all products for search (same as before)
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        if (Array.isArray(data)) {
          setAllProducts(
            data.map((p: any) => ({
              id: p.id,
              slug: p.slug,
              name: p.name,
              brand: p.brand,
            }))
          );
        } else {
          console.error("API returned non-array:", data);
          setAllProducts([]);
        }
      } catch (error) {
        console.error("Failed to fetch products for search", error);
        setAllProducts([]);
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
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      const query = searchQuery.toLowerCase();
      const filtered = allProducts
        .filter(
          (product) =>
            product.name.toLowerCase().includes(query) ||
            (product.brand?.name && product.brand.name.toLowerCase().includes(query))
        )
        .slice(0, 5);
      setSearchResults(filtered);
      setIsSearching(false);
    }, 300);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery, allProducts]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowSearchDropdown(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  // PWA detection (unchanged)
  useEffect(() => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    if (isStandalone) {
      setIsAppInstalled(true);
      setIsInstallable(false);
    }
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isAppInstalled) setIsInstallable(true);
    };
    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsAppInstalled(true);
        setIsInstallable(false);
      }
    };
    mediaQuery.addEventListener('change', handleDisplayModeChange);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, [isAppInstalled]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstallable(false);
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value);
  const handleSearchFocus = () => {
    if (searchQuery.trim() !== "") setShowSearchDropdown(true);
  };

  const handleResultClick = (productSlug: string) => {
    setShowSearchDropdown(false);
    setSearchQuery("");
    router.push(`/products/${productSlug}`);
  };

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setIsMenuOpen(false);
    };
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    handleResize();
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const userInitial = session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "U";

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`sticky top-0 z-50 transition-all duration-300 ${
          isScrolled ? "bg-white/95 backdrop-blur-md shadow-lg" : "bg-white shadow-sm"
        }`}
      >
        <div className="h-1 w-full bg-gradient-to-r from-[#156A98] via-[#0F9D8F] to-[#156A98]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Hamburger + Logo */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={toggleMenu}
                className="md:hidden p-2 rounded-lg text-gray-600 hover:text-[#156A98] hover:bg-[#156A98]/10 focus:outline-none transition-all duration-200"
                aria-label="Toggle menu"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </motion.button>
              <Link href="/" className="flex items-center gap-2 flex-shrink-0 group">
                <div className="relative">
                  <Image
                    src="/Logo.png"
                    alt="Medixo Logo"
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
                  Medixo
                </span>
              </Link>
            </div>

            {/* Center: Desktop Navigation + Search */}
            <div className="hidden md:flex items-center flex-1 justify-center gap-4">
              <div className="flex items-center space-x-1">
                {desktopNavItems.map((item, index) => {
                  if (isDeliveryBoy && item.name === "Products") return null;
                  return (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link
                        href={item.href}
                        className={`relative group px-3 py-2 rounded-lg font-medium transition-all duration-200 ${
                          isActive(item.activeWhen) ? "text-[#0F9D8F]" : "text-gray-700 hover:text-[#0F9D8F]"
                        }`}
                      >
                        <span>{item.name}</span>
                        <span
                          className={`absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-[#156A98] to-[#0F9D8F] transform transition-transform duration-300 origin-left ${
                            isActive(item.activeWhen) ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                          }`}
                        />
                      </Link>
                    </motion.div>
                  );
                })}
              </div>

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

            {/* Right: Install + Ad Link + Login/Avatar */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {!isAppInstalled && isInstallable && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleInstall}
                  className="relative group bg-gradient-to-r from-[#156A98] to-[#0F9D8F] text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all duration-300 flex items-center gap-2 overflow-hidden"
                >
                  <span className="absolute inset-0 bg-white/20 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
                  <Download className="h-5 w-5 relative z-10" />
                  <span className="relative z-10 hidden sm:inline">Download</span>
                </motion.button>
              )}

              {/* Advertisement icon (shown for all logged-in users) */}
              {session && (
                <Link
                  href="/advertisement"
                  className="relative p-2 rounded-lg text-gray-600 hover:text-[#156A98] hover:bg-[#156A98]/10 transition-colors"
                  aria-label="Advertisements"
                >
                  <Bell className="h-6 w-6" />
                </Link>
              )}

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
                          <p className="text-sm font-semibold text-gray-800 truncate">{session.user?.name}</p>
                          <p className="text-xs text-gray-500 truncate">{session.user?.email}</p>
                        </div>

                        {!isMobile ? (
                          <>
                            {dropdownNavItems.map((item) => {
                              const Icon = item.icon;
                              return (
                                <Link
                                  key={item.name}
                                  href={item.href}
                                  className={`flex items-center gap-2 px-4 py-2.5 text-sm transition-colors duration-200 ${
                                    isActive(item.href) ? "text-[#0F9D8F] bg-[#0F9D8F]/10" : "text-gray-700 hover:bg-[#0F9D8F]/10 hover:text-[#0F9D8F]"
                                  }`}
                                  onClick={() => setIsDropdownOpen(false)}
                                >
                                  <Icon className="h-4 w-4" />
                                  {item.name}
                                </Link>
                              );
                            })}
                            <Link
                              href={dashboardRoute}
                              className={`flex items-center gap-2 px-4 py-2.5 text-sm transition-colors duration-200 ${
                                isActive(dashboardRoute) ? "text-[#0F9D8F] bg-[#0F9D8F]/10" : "text-gray-700 hover:bg-[#0F9D8F]/10 hover:text-[#0F9D8F]"
                              }`}
                              onClick={() => setIsDropdownOpen(false)}
                            >
                              <User className="h-4 w-4" />
                              Dashboard
                            </Link>
                          </>
                        ) : (
                          <Link
                            href={dashboardRoute}
                            className={`flex items-center gap-2 px-4 py-2.5 text-sm transition-colors duration-200 ${
                              isActive(dashboardRoute) ? "text-[#0F9D8F] bg-[#0F9D8F]/10" : "text-gray-700 hover:bg-[#0F9D8F]/10 hover:text-[#0F9D8F]"
                            }`}
                            onClick={() => setIsDropdownOpen(false)}
                          >
                            <User className="h-4 w-4" />
                            Dashboard
                          </Link>
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

                  {isDropdownOpen && <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />}
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

        {/* Mobile Search Bar */}
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
                className="w-full text-black border border-gray-200 rounded-full py-2 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-[#0F9D8F]/50 focus:border-[#0F9D8F] transition-all duration-300"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
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
                  <div className="py-4 text-center text-gray-500">Searching...</div>
                ) : (
                  <ul className="lg:max-h-50 max-h-40 overflow-y-auto">
                    {searchResults.map((product) => (
                      <li key={product.id}>
                        <button
                          onClick={() => handleResultClick(product.slug)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between group"
                        >
                          <span className="text-gray-700 group-hover:text-[#0F9D8F]">{product.name}</span>
                          {product.brand?.name && (
                            <span className="text-sm text-gray-400">{product.brand.name}</span>
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

        {/* Mobile Hamburger Menu */}
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
                {getMobileMenuItems().map((item, index) => (
                  <motion.div
                    key={item.name}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      href={item.href}
                      className={`block font-medium transition py-2 px-3 rounded-lg ${
                        isActive(item.activeWhen)
                          ? "text-[#0F9D8F] bg-[#0F9D8F]/10"
                          : "text-gray-700 hover:text-[#0F9D8F] hover:bg-[#0F9D8F]/5"
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Overlay for mobile menu */}
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

      {/* iOS Installation Modal */}
      <AnimatePresence>
        {showIOSModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowIOSModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">Install Medixo</h3>
                <button onClick={() => setShowIOSModal(false)} className="text-gray-400 hover:text-gray-600">
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              <p className="text-gray-600 mb-4">To install this app on your iPhone/iPad, follow these steps:</p>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-6">
                <li>Tap the <span className="inline-flex items-center bg-gray-100 px-2 py-1 rounded">Share</span> icon</li>
                <li>Scroll down and tap <span className="font-semibold">Add to Home Screen</span></li>
                <li>Tap <span className="font-semibold">Add</span> in the top right corner</li>
              </ol>
              <button
                onClick={() => setShowIOSModal(false)}
                className="w-full bg-gradient-to-r from-[#156A98] to-[#0F9D8F] text-white py-2 rounded-lg font-medium hover:shadow-lg transition-all"
              >
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation (Mobile) */}
      {session && isMobile && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 md:hidden"
        >
          <div className="flex justify-around items-center py-1">
            {isDeliveryBoy ? (
              deliveryBoyNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex flex-col items-center p-2 transition-colors ${
                      isActive(item.href) ? "text-[#0F9D8F]" : "text-gray-600 hover:text-[#0F9D8F]"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs mt-1">{item.name}</span>
                  </Link>
                );
              })
            ) : (
              <>
                <Link
                  href="/"
                  className={`flex flex-col items-center p-2 transition-colors ${
                    isActive("/") ? "text-[#0F9D8F]" : "text-gray-600 hover:text-[#0F9D8F]"
                  }`}
                >
                  <Home className="h-5 w-5" />
                  <span className="text-xs mt-1">Home</span>
                </Link>
                <Link
                  href="/products"
                  className={`flex flex-col items-center p-2 transition-colors ${
                    isActive("/products") ? "text-[#0F9D8F]" : "text-gray-600 hover:text-[#0F9D8F]"
                  }`}
                >
                  <Package className="h-5 w-5" />
                  <span className="text-xs mt-1">Products</span>
                </Link>
                <Link href="/bag" className="relative -mt-6 flex flex-col items-center">
                  <div className="bg-gradient-to-r from-[#156A98] to-[#0F9D8F] p-3 rounded-full shadow-lg transform transition-all duration-300 hover:scale-110">
                    <ShoppingBag className="h-7 w-7 text-white" />
                  </div>
                  <span className="text-xs mt-1 font-medium text-gray-700">Bag</span>
                </Link>
                <Link
                  href="/favourite"
                  className={`flex flex-col items-center p-2 transition-colors ${
                    isActive("/favourite") ? "text-[#0F9D8F]" : "text-gray-600 hover:text-[#0F9D8F]"
                  }`}
                >
                  <Heart className="h-5 w-5" />
                  <span className="text-xs mt-1">Favourite</span>
                </Link>
                <Link
                  href="/history"
                  className={`flex flex-col items-center p-2 transition-colors ${
                    isActive("/history") ? "text-[#0F9D8F]" : "text-gray-600 hover:text-[#0F9D8F]"
                  }`}
                >
                  <History className="h-5 w-5" />
                  <span className="text-xs mt-1">History</span>
                </Link>
              </>
            )}
          </div>
        </motion.div>
      )}
    </>
  );
}