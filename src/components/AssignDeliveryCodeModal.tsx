"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Modal from "@/components/ui/Modal";
import toast from "react-hot-toast";

type DeliveryCode = {
    id: string;
    code: string;
    areas: { name: string; trCode: string }[];
};

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (deliveryCodeId: string) => void;
    currentDeliveryCodeId?: string | null;
};

export default function AssignDeliveryCodeModal({
    isOpen,
    onClose,
    onConfirm,
    currentDeliveryCodeId,
}: Props) {
    const [deliveryCodes, setDeliveryCodes] = useState<DeliveryCode[]>([]);
    const [selectedId, setSelectedId] = useState<string>("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchUnassignedCodes();
            // Pre-select current code if it exists (in case of reassign)
            if (currentDeliveryCodeId) {
                setSelectedId(currentDeliveryCodeId);
            } else {
                setSelectedId("");
            }
        }
    }, [isOpen, currentDeliveryCodeId]);

    const fetchUnassignedCodes = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/delivery/delivery-codes/unassigned");
            const data = await res.json();
            setDeliveryCodes(data);
        } catch {
            toast.error("Failed to load delivery codes");
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = () => {
        if (!selectedId) {
            toast.error("Please select a delivery code");
            return;
        }
        onConfirm(selectedId);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
            >
                <h2 className="text-2xl font-bold mb-4 text-gray-800 text-left">Assign Delivery Code</h2>
                <p className="text-sm text-gray-600 mb-6 text-left">
                    Select a delivery code for this delivery boy.
                </p>

                {loading ? (
                    <div className="text-center py-4 text-gray-500">Loading delivery codes...</div>
                ) : deliveryCodes.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                        No unassigned delivery codes available. Please create one first.
                    </div>
                ) : (
                    <div className="space-y-2 max-h-80 overflow-y-auto border rounded-lg py-3">
                        {deliveryCodes.map((dc) => (
                            <label
                                key={dc.id}
                                className={`flex items-start space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${selectedId === dc.id ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-50"
                                    }`}
                            >
                                <div className="flex-1 text-sm text-left">
                                    <p className="font-medium text-gray-800">{dc.code}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Areas: {dc.areas.map((a) => `${a.name} (${a.trCode})`).join(", ")}
                                    </p>
                                </div>
                                <input
                                    type="radio"
                                    name="deliveryCode"
                                    value={dc.id}
                                    checked={selectedId === dc.id}
                                    onChange={(e) => setSelectedId(e.target.value)}
                                    className="mt-1 h-4 w-4 text-[#0F9D8F] border-gray-300 focus:ring-[#0F9D8F]"
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
                        onClick={handleConfirm}
                        disabled={loading || deliveryCodes.length === 0}
                        className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#156A98] to-[#0F9D8F] rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Assign & Approve
                    </button>
                </div>
            </motion.div>
        </Modal>
    );
}