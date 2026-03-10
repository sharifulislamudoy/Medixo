"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Modal from "@/components/ui/Modal";
import toast from "react-hot-toast";

interface Zone {
  id: string;
  name: string;
  code: string;
  city: { name: string; code: string };
}

interface Area {
  id: string;
  name: string;
  code: string;
  zoneId: string;
  trCode: string;
  zone?: Zone;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  area: Area | null;
}

export default function EditAreaModal({ isOpen, onClose, onSuccess, area }: Props) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingZones, setLoadingZones] = useState(true);
  const [trCodePreview, setTrCodePreview] = useState("");

  // Load zones when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchZones();
    }
  }, [isOpen]);

  // Populate form when area prop changes
  useEffect(() => {
    if (area) {
      setName(area.name);
      setCode(area.code);
      setZoneId(area.zoneId);
    }
  }, [area]);

  // Update TR code preview when zone or code changes
  useEffect(() => {
    if (zoneId && code) {
      const selectedZone = zones.find((z) => z.id === zoneId);
      if (selectedZone) {
        setTrCodePreview(`${selectedZone.city.code}-${selectedZone.code}-${code.toUpperCase()}`);
      } else {
        setTrCodePreview("");
      }
    } else {
      setTrCodePreview("");
    }
  }, [zoneId, code, zones]);

  const fetchZones = async () => {
    setLoadingZones(true);
    try {
      const res = await fetch("/api/admin/delivery/zones");
      const data = await res.json();
      setZones(data);
    } catch {
      toast.error("Failed to load zones");
    } finally {
      setLoadingZones(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code || !zoneId || !area) {
      toast.error("All fields are required");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Updating area...");

    try {
      const res = await fetch(`/api/admin/delivery/areas/${area.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, code: code.toUpperCase(), zoneId }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update");
      }

      toast.success("Area updated", { id: toastId });
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  if (!area) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Edit Area</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Zone *</label>
            <select
              value={zoneId}
              onChange={(e) => setZoneId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#0F9D8F] focus:border-[#0F9D8F] outline-none transition text-black"
              required
              disabled={loadingZones}
            >
              <option value="">Select a zone</option>
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name} ({zone.code}) - {zone.city.name} ({zone.city.code})
                </option>
              ))}
            </select>
            {loadingZones && <p className="text-xs text-gray-500 mt-1">Loading zones...</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Area Name *</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Area Code *</label>
            <motion.input
              whileFocus={{ scale: 1.01 }}
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#0F9D8F] focus:border-[#0F9D8F] outline-none transition text-black"
              required
            />
          </div>

          {trCodePreview && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">New TR Code Preview:</p>
              <p className="font-mono text-lg font-bold text-[#0F9D8F]">{trCodePreview}</p>
            </div>
          )}

          {area.trCode && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Current TR Code:</p>
              <p className="font-mono text-sm text-gray-700">{area.trCode}</p>
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading || loadingZones}
            className="w-full bg-gradient-to-r from-[#156A98] to-[#0F9D8F] text-white py-3 rounded-lg font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center"
          >
            {loading ? "Updating..." : "Update Area"}
          </motion.button>
        </form>
      </motion.div>
    </Modal>
  );
}