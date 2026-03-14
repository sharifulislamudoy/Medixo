"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Modal from "@/components/ui/Modal";
import toast from "react-hot-toast";

type DeliveryBoy = {
  id: string;
  name: string;
  deliveryCode: { id: string; code: string } | null;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  deliveryCode: { id: string; code: string } | null;
  onSuccess: () => void;
};

export default function AssignBoyToCodeModal({
  isOpen,
  onClose,
  deliveryCode,
  onSuccess,
}: Props) {
  const [boys, setBoys] = useState<DeliveryBoy[]>([]);
  const [selectedBoyId, setSelectedBoyId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (isOpen && deliveryCode) {
      fetchBoys();
    } else {
      setSelectedBoyId("");
    }
  }, [isOpen, deliveryCode]);

  const fetchBoys = async () => {
    setFetching(true);
    try {
      const res = await fetch("/api/admin/delivery/delivery-boys");
      const data = await res.json();
      setBoys(data);
    } catch {
      toast.error("Failed to load delivery boys");
    } finally {
      setFetching(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedBoyId) {
      toast.error("Please select a delivery boy");
      return;
    }
    if (!deliveryCode) return;

    setLoading(true);
    const toastId = toast.loading("Assigning delivery boy...");

    try {
      const res = await fetch(`/api/admin/users/${selectedBoyId}/delivery-code`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryCodeId: deliveryCode.id }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to assign");
      }

      toast.success("Delivery boy assigned", { id: toastId });
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const isAssignedToThisCode = (boy: DeliveryBoy) =>
    boy.deliveryCode?.id === deliveryCode?.id;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-2xl font-bold mb-4 text-gray-800 text-left">
          Assign Delivery Boy to {deliveryCode?.code}
        </h2>
        <p className="text-sm text-gray-600 mb-6 text-left">
          Select a delivery boy to assign to this code.
        </p>

        {fetching ? (
          <div className="text-center py-4 text-gray-500">Loading delivery boys...</div>
        ) : boys.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            No delivery boys found.
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto border rounded-lg py-3">
            {boys.map((boy) => (
              <label
                key={boy.id}
                className={`flex items-start space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedBoyId === boy.id ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-50"
                }`}
              >
                <div className="flex-1 text-sm text-left">
                  <p className="font-medium text-gray-800">{boy.name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Current:{" "}
                    {boy.deliveryCode ? (
                      <span className="font-mono">{boy.deliveryCode.code}</span>
                    ) : (
                      <span className="italic">Not assigned</span>
                    )}
                  </p>
                </div>
                <input
                  type="radio"
                  name="deliveryBoy"
                  value={boy.id}
                  checked={selectedBoyId === boy.id}
                  onChange={(e) => setSelectedBoyId(e.target.value)}
                  className="mt-1 h-4 w-4 text-[#0F9D8F] border-gray-300 focus:ring-[#0F9D8F]"
                  disabled={isAssignedToThisCode(boy)} // optionally disable if already assigned to this code
                />
              </label>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={loading || fetching || !selectedBoyId}
            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#156A98] to-[#0F9D8F] rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Assigning..." : "Assign"}
          </button>
        </div>
      </motion.div>
    </Modal>
  );
}