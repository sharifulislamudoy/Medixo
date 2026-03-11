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

interface DeliveryCode {
  id: string;
  code: string;
  areas: Area[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  deliveryCode: DeliveryCode | null;
}

export default function EditDeliveryCodeModal({ isOpen, onClose, onSuccess, deliveryCode }: Props) {
  const [allAreas, setAllAreas] = useState<Area[]>([]); // all areas (assigned + unassigned except current)
  const [selectedAreaIds, setSelectedAreaIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (isOpen && deliveryCode) {
      fetchAreas();
    }
  }, [isOpen, deliveryCode]);

  useEffect(() => {
    if (deliveryCode) {
      setSelectedAreaIds(deliveryCode.areas.map((a) => a.id));
    }
  }, [deliveryCode]);

  const fetchAreas = async () => {
    setFetching(true);
    try {
      // Fetch unassigned areas plus the ones currently in this delivery code
      const res = await fetch("/api/admin/delivery/areas/unassigned");
      const unassigned = await res.json();

      // Combine unassigned with the areas already in this delivery code
      const currentIds = deliveryCode?.areas.map((a) => a.id) || [];
      const otherUnassigned = unassigned.filter((a: Area) => !currentIds.includes(a.id));
      setAllAreas([...deliveryCode!.areas, ...otherUnassigned]);
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
    if (!deliveryCode) return;

    setLoading(true);
    const toastId = toast.loading("Updating delivery code...");

    try {
      const res = await fetch(`/api/admin/delivery/delivery-codes/${deliveryCode.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ areaIds: selectedAreaIds }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update");
      }

      toast.success("Delivery code updated", { id: toastId });
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  if (!deliveryCode) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          Edit Delivery Code: {deliveryCode.code}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {fetching ? (
            <div className="text-center py-4 text-gray-500">Loading areas...</div>
          ) : allAreas.length === 0 ? (
            <div className="text-center py-4 text-gray-500">No areas available.</div>
          ) : (
            <div className="max-h-80 overflow-y-auto border rounded-lg p-3 space-y-2">
              {allAreas.map((area) => (
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
            disabled={loading || fetching}
            className="w-full bg-gradient-to-r from-[#156A98] to-[#0F9D8F] text-white py-3 rounded-lg font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center"
          >
            {loading ? "Updating..." : "Update Delivery Code"}
          </motion.button>
        </form>
      </motion.div>
    </Modal>
  );
}