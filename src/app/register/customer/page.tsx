"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

type City = { id: string; name: string; code: string };
type Zone = { id: string; name: string; code: string };
type Area = { id: string; name: string; code: string; trCode: string };

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    address: "",
    shopName: "",
    role: "SHOP_OWNER",
    cityId: "",
    zoneId: "",
    areaId: "",
  });

  // Data states
  const [cities, setCities] = useState<City[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingZones, setLoadingZones] = useState(false);
  const [loadingAreas, setLoadingAreas] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  // Fetch cities on mount
  useEffect(() => {
    const fetchCities = async () => {
      setLoadingCities(true);
      try {
        const res = await fetch("/api/public/cities");
        const data = await res.json();
        setCities(data);
      } catch {
        toast.error("Failed to load cities");
      } finally {
        setLoadingCities(false);
      }
    };
    fetchCities();
  }, []);

  // Fetch zones when city changes
  useEffect(() => {
    if (!form.cityId) {
      setZones([]);
      setForm((prev) => ({ ...prev, zoneId: "", areaId: "" }));
      return;
    }
    const fetchZones = async () => {
      setLoadingZones(true);
      setZones([]);
      setForm((prev) => ({ ...prev, zoneId: "", areaId: "" }));
      try {
        const res = await fetch(`/api/public/zones?cityId=${form.cityId}`);
        const data = await res.json();
        setZones(data);
      } catch {
        toast.error("Failed to load zones");
      } finally {
        setLoadingZones(false);
      }
    };
    fetchZones();
  }, [form.cityId]);

  // Fetch areas when zone changes
  useEffect(() => {
    if (!form.zoneId) {
      setAreas([]);
      setForm((prev) => ({ ...prev, areaId: "" }));
      return;
    }
    const fetchAreas = async () => {
      setLoadingAreas(true);
      setAreas([]);
      setForm((prev) => ({ ...prev, areaId: "" }));
      try {
        const res = await fetch(`/api/public/areas?zoneId=${form.zoneId}`);
        const data = await res.json();
        setAreas(data);
      } catch {
        toast.error("Failed to load areas");
      } finally {
        setLoadingAreas(false);
      }
    };
    fetchAreas();
  }, [form.zoneId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.areaId) {
      toast.error("Please select an area");
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading("Creating account...");

    try {
      const res = await fetch("/api/register", {
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
                <img src="/Logo.png" alt="" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-[#156A98] to-[#0F9D8F] bg-clip-text text-transparent">
                Medixo
              </span>
            </motion.div>
            <h2 className="text-2xl font-semibold text-gray-800 mt-4">
              Create B2B Account
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Register as a shop owner to start ordering medicines
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Name */}
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
                  placeholder="you@company.com"
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
                  Shop Name
                </label>
                <input
                  id="shopName"
                  name="shopName"
                  type="text"
                  value={form.shopName}
                  onChange={handleChange}
                  placeholder="Medixo"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F9D8F]/50 focus:border-[#0F9D8F] transition-all duration-200 text-black"
                  required
                />
              </div>

              {/* Address */}
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  Shop Address
                </label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="123 Business St, City, State"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F9D8F]/50 focus:border-[#0F9D8F] transition-all duration-200 text-black"
                  required
                />
              </div>

              {/* City Dropdown */}
              <div className="space-y-2">
                <label htmlFor="cityId" className="block text-sm font-medium text-gray-700">
                  City
                </label>
                <select
                  id="cityId"
                  name="cityId"
                  value={form.cityId}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F9D8F]/50 focus:border-[#0F9D8F] transition-all duration-200 text-black"
                  required
                  disabled={loadingCities}
                >
                  <option value="">Select a city</option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name} ({city.code})
                    </option>
                  ))}
                </select>
                {loadingCities && <p className="text-xs text-gray-500">Loading cities...</p>}
              </div>

              {/* Zone Dropdown */}
              <div className="space-y-2">
                <label htmlFor="zoneId" className="block text-sm font-medium text-gray-700">
                  Zone
                </label>
                <select
                  id="zoneId"
                  name="zoneId"
                  value={form.zoneId}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F9D8F]/50 focus:border-[#0F9D8F] transition-all duration-200 text-black"
                  required
                  disabled={!form.cityId || loadingZones}
                >
                  <option value="">Select a zone</option>
                  {zones.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name} ({zone.code})
                    </option>
                  ))}
                </select>
                {loadingZones && <p className="text-xs text-gray-500">Loading zones...</p>}
              </div>

              {/* Area Dropdown */}
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="areaId" className="block text-sm font-medium text-gray-700">
                  Area
                </label>
                <select
                  id="areaId"
                  name="areaId"
                  value={form.areaId}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F9D8F]/50 focus:border-[#0F9D8F] transition-all duration-200 text-black"
                  required
                  disabled={!form.zoneId || loadingAreas}
                >
                  <option value="">Select an area</option>
                  {areas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name} ({area.code}) - {area.trCode}
                    </option>
                  ))}
                </select>
                {loadingAreas && <p className="text-xs text-gray-500">Loading areas...</p>}
              </div>
            </div>

            {/* Hidden role */}
            <input type="hidden" name="role" value={form.role} />

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
                  "Register as Shop Owner"
                )}
              </span>
            </motion.button>
          </form>

          {/* Other registration options */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8"
          >
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">Register as</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href="/register/supplier"
                className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white p-4 hover:border-[#0F9D8F] hover:shadow-md transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#156A98]/5 to-[#0F9D8F]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10 flex flex-col items-center text-center">
                  <h3 className="font-semibold text-gray-800">Become a Supplier</h3>
                </div>
              </Link>
              <Link
                href="/register/deliveryBoy"
                className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white p-4 hover:border-[#0F9D8F] hover:shadow-md transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#156A98]/5 to-[#0F9D8F]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10 flex flex-col items-center text-center">
                  <h3 className="font-semibold text-gray-800">Become a Delivery Boy</h3>
                </div>
              </Link>
            </div>
          </motion.div>

          {/* Login link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
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