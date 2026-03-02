"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/dashboard/admin" },
    { name: "Promotion", href: "/dashboard/admin/promotion-modal" },
    { name: "Advertisement", href: "/dashboard/admin/advertisements" },
    { name: "Users", href: "/dashboard/admin/users" },
    { name: "Products", href: "/dashboard/admin/products" },
    
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top gradient bar */}
      <div className="h-1 w-full bg-gradient-to-r from-[#156A98] via-[#0F9D8F] to-[#156A98]" />

      {/* Responsive container: column on mobile, row on md+ */}
      <div className="flex flex-col md:flex-row">
        {/* Sidebar - full width on mobile, 1/4 on desktop */}
        <aside className="w-full md:w-1/6 bg-white shadow-lg md:min-h-screen p-4 md:p-6">
          <div className="mb-6 md:mb-8">
            <Link href={'/'}>
              <h2 className="text-lg md:text-xl font-bold bg-gradient-to-r from-[#156A98] to-[#0F9D8F] bg-clip-text text-transparent">
                Admin
              </h2>
            </Link>
            <p className="text-xs md:text-sm text-gray-500 mt-1">
              Manage your platform
            </p>
          </div>

          {/* Navigation - horizontal scroll on mobile if needed, stacked on desktop */}
          <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0 md:space-y-2">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href === "/dashboard/admin/users" &&
                  pathname?.startsWith("/dashboard/admin/users"));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex-shrink-0 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                      ? "bg-gradient-to-r from-[#156A98]/10 to-[#0F9D8F]/10 text-[#156A98] font-medium border-l-4 md:border-l-4 border-l-0 md:border-l-4 border-b-2 md:border-b-0 border-[#0F9D8F]"
                      : "text-gray-600 hover:bg-gray-100 hover:text-[#0F9D8F]"
                    }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main content - full width on mobile, 3/4 on desktop */}
        <main className="w-full md:w-5/6 p-4 md:p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}