"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

export default function SupplierRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    address: "",
    shopName: "",
    bankAccountNumber: "",
    bankBranch: "",
    accountHolderName: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const toastId = toast.loading("Creating account...");

    try {
      const res = await fetch("/api/register/supplier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      toast.success("Account created successfully! Please log in.", {
        id: toastId,
      });
      router.push("/login");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong", { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-2xl"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#156A98] via-[#0F9D8F] to-[#156A98] rounded-t-xl" />

        <div className="bg-white rounded-xl shadow-2xl p-8 pt-10">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2"
            >
              <div className="w-11 h-11 flex items-center justify-center">
                <img src="/Logo.png" alt="Medixo" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-[#156A98] to-[#0F9D8F] bg-clip-text text-transparent">
                Medixo
              </span>
            </motion.div>
            <h2 className="text-2xl font-semibold text-gray-800 mt-4">
              Register as Supplier
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Join our network of trusted suppliers
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Full Name */}
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F9D8F]/50 focus:border-[#0F9D8F] transition-all duration-200 text-black"
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="supplier@company.com"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F9D8F]/50 focus:border-[#0F9D8F] transition-all duration-200 text-black"
                  required
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+1234567890"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F9D8F]/50 focus:border-[#0F9D8F] transition-all duration-200 text-black"
                  required
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F9D8F]/50 focus:border-[#0F9D8F] transition-all duration-200 text-black"
                  required
                />
              </div>

              {/* Shop Name */}
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="shopName" className="block text-sm font-medium text-gray-700">
                  Shop/Company Name
                </label>
                <input
                  id="shopName"
                  name="shopName"
                  type="text"
                  value={form.shopName}
                  onChange={handleChange}
                  placeholder="Medi Supplies Ltd."
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F9D8F]/50 focus:border-[#0F9D8F] transition-all duration-200 text-black"
                  required
                />
              </div>

              {/* Address */}
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  Business Address
                </label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="123 Supplier St, City, State"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F9D8F]/50 focus:border-[#0F9D8F] transition-all duration-200 text-black"
                  required
                />
              </div>

              {/* Bank Account Number */}
              <div className="space-y-2">
                <label htmlFor="bankAccountNumber" className="block text-sm font-medium text-gray-700">
                  Bank Account Number
                </label>
                <input
                  id="bankAccountNumber"
                  name="bankAccountNumber"
                  type="text"
                  value={form.bankAccountNumber}
                  onChange={handleChange}
                  placeholder="1234567890"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F9D8F]/50 focus:border-[#0F9D8F] transition-all duration-200 text-black"
                />
              </div>

              {/* Bank Branch */}
              <div className="space-y-2">
                <label htmlFor="bankBranch" className="block text-sm font-medium text-gray-700">
                  Bank Branch
                </label>
                <input
                  id="bankBranch"
                  name="bankBranch"
                  type="text"
                  value={form.bankBranch}
                  onChange={handleChange}
                  placeholder="Main Branch"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F9D8F]/50 focus:border-[#0F9D8F] transition-all duration-200 text-black"
                />
              </div>

              {/* Account Holder Name */}
              <div className="space-y-2">
                <label htmlFor="accountHolderName" className="block text-sm font-medium text-gray-700">
                  Account Holder Name
                </label>
                <input
                  id="accountHolderName"
                  name="accountHolderName"
                  type="text"
                  value={form.accountHolderName}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F9D8F]/50 focus:border-[#0F9D8F] transition-all duration-200 text-black"
                />
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative w-full bg-gradient-to-r from-[#156A98] to-[#0F9D8F] text-white py-3 rounded-lg font-medium overflow-hidden group ${
                isLoading ? "opacity-80 cursor-not-allowed" : ""
              }`}
            >
              <span className="absolute inset-0 bg-white/20 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Creating account...</span>
                  </>
                ) : (
                  "Register as Supplier"
                )}
              </span>
            </motion.button>
          </form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 text-center"
          >
            <p className="text-gray-600">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-[#0F9D8F] hover:text-[#156A98] transition-colors duration-200 relative group"
              >
                Sign in here
                <span className="absolute left-0 bottom-0 w-full h-0.5 bg-gradient-to-r from-[#156A98] to-[#0F9D8F] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
              </Link>
            </p>
          </motion.div>
        </div>

        <div className="absolute -z-10 top-0 left-0 w-72 h-72 bg-[#156A98]/10 rounded-full blur-3xl" />
        <div className="absolute -z-10 bottom-0 right-0 w-72 h-72 bg-[#0F9D8F]/10 rounded-full blur-3xl" />
      </motion.div>
    </div>
  );
}