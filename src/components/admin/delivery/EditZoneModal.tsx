"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Modal from "@/components/ui/Modal";
import toast from "react-hot-toast";

interface City {
  id: string;
  name: string;
  code: string;
}

interface Zone {
  id: string;
  name: string;
  code: string;
  cityId: string;
  city?: City;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  zone: Zone | null;
}

export default function EditZoneModal({ isOpen, onClose, onSuccess, zone }: Props) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [cityId, setCityId] = useState("");
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCities, setLoadingCities] = useState(true);

  // Load cities when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchCities();
    }
  }, [isOpen]);

  // Populate form when zone prop changes
  useEffect(() => {
    if (zone) {
      setName(zone.name);
      setCode(zone.code);
      setCityId(zone.cityId);
    }
  }, [zone]);

  const fetchCities = async () => {
    setLoadingCities(true);
    try {
      const res = await fetch("/api/admin/delivery/cities");
      const data = await res.json();
      setCities(data);
    } catch {
      toast.error("Failed to load cities");
    } finally {
      setLoadingCities(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code || !cityId || !zone) {
      toast.error("All fields are required");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Updating zone...");

    try {
      const res = await fetch(`/api/admin/delivery/zones/${zone.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, code: code.toUpperCase(), cityId }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update");
      }

      toast.success("Zone updated", { id: toastId });
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  if (!zone) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Edit Zone</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
            <select
              value={cityId}
              onChange={(e) => setCityId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#0F9D8F] focus:border-[#0F9D8F] outline-none transition text-black"
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
            {loadingCities && <p className="text-xs text-gray-500 mt-1">Loading cities...</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Zone Name *</label>
            <motion.input
              whileFocus={{ scale: 1.01 }}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#0F9D8F] focus:border-[#0F9D8F] outline-none transition text-black"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Zone Code *</label>
            <motion.input
              whileFocus={{ scale: 1.01 }}
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#0F9D8F] focus:border-[#0F9D8F] outline-none transition text-black"
              required
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading || loadingCities}
            className="w-full bg-gradient-to-r from-[#156A98] to-[#0F9D8F] text-white py-3 rounded-lg font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center"
          >
            {loading ? "Updating..." : "Update Zone"}
          </motion.button>
        </form>
      </motion.div>
    </Modal>
  );
}