"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Modal from "@/components/ui/Modal";
import toast from "react-hot-toast";

interface Area {
  id: string;
  name: string;
  code: string;
  trCode: string;
  zone: {
    name: string;
    code: string;
    city: { name: string; code: string };
  };
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateDeliveryCodeModal({ isOpen, onClose, onSuccess }: Props) {
  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedAreaIds, setSelectedAreaIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchUnassignedAreas();
    } else {
      setSelectedAreaIds([]);
    }
  }, [isOpen]);

  const fetchUnassignedAreas = async () => {
    setFetching(true);
    try {
      const res = await fetch("/api/admin/delivery/areas/unassigned");
      const data = await res.json();
      setAreas(data);
    } catch {
      toast.error("Failed to load areas");
    } finally {
      setFetching(false);
    }
  };

  const toggleArea = (id: string) => {
    setSelectedAreaIds((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAreaIds.length === 0) {
      toast.error("Select at least one area");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Creating delivery code...");

    try {
      const res = await fetch("/api/admin/delivery/delivery-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ areaIds: selectedAreaIds }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create");
      }

      toast.success("Delivery code created", { id: toastId });
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Create Delivery Code</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {fetching ? (
            <div className="text-center py-4 text-gray-500">Loading areas...</div>
          ) : areas.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No unassigned areas available.
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto border rounded-lg p-3 space-y-2">
              {areas.map((area) => (
                <label
                  key={area.id}
                  className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedAreaIds.includes(area.id)}
                    onChange={() => toggleArea(area.id)}
                    className="mt-1 h-4 w-4 text-[#0F9D8F] rounded border-gray-300 focus:ring-[#0F9D8F]"
                  />
                  <div className="flex-1 text-sm">
                    <p className="font-medium text-gray-800">{area.name}</p>
                    <p className="text-xs text-gray-500">
                      {area.trCode} – {area.zone.name} ({area.zone.code}) – {area.zone.city.name} ({area.zone.city.code})
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading || fetching || areas.length === 0}
            className="w-full bg-gradient-to-r from-[#156A98] to-[#0F9D8F] text-white py-3 rounded-lg font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center"
          >
            {loading ? "Creating..." : "Create Delivery Code"}
          </motion.button>
        </form>
      </motion.div>
    </Modal>
  );
}