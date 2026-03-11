"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Pencil, Trash2 } from "lucide-react";

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
  createdAt: string;
}

interface Props {
  onEdit: (dc: DeliveryCode) => void;
  onRefresh: () => void;
}

export default function DeliveryCodeTable({ onEdit, onRefresh }: Props) {
  const [deliveryCodes, setDeliveryCodes] = useState<DeliveryCode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeliveryCodes();
  }, []);

  const fetchDeliveryCodes = async () => {
    try {
      const res = await fetch("/api/admin/delivery/delivery-codes");
      const data = await res.json();
      setDeliveryCodes(data);
    } catch (error) {
      toast.error("Failed to load delivery codes");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this delivery code?")) return;
    try {
      const res = await fetch(`/api/admin/delivery/delivery-codes/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("Delivery code deleted");
      fetchDeliveryCodes();
      onRefresh();
    } catch {
      toast.error("Failed to delete delivery code");
    }
  };

  const skeletonRows = Array.from({ length: 5 }).map((_, index) => (
    <tr key={`skeleton-${index}`} className="animate-pulse">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gray-200 rounded w-16"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-200 rounded w-48"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gray-200 rounded w-20"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <div className="flex justify-end space-x-3">
          <div className="h-4 w-4 bg-gray-200 rounded"></div>
          <div className="h-4 w-4 bg-gray-200 rounded"></div>
        </div>
      </td>
    </tr>
  ));

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Delivery Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Areas (TR Code)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Zone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                City
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">{skeletonRows}</tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Delivery Code
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Areas (TR Code)
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Zone
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              City
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {deliveryCodes.map((dc) => {
            // Collect unique zones and cities from areas (simplify: use first area or join)
            const zones = Array.from(new Set(dc.areas.map((a) => a.zone.name))).join(", ");
            const cities = Array.from(new Set(dc.areas.map((a) => a.zone.city.name))).join(", ");

            return (
              <motion.tr
                key={dc.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <td className="px-6 py-4 whitespace-nowrap font-mono font-bold text-[#0F9D8F]">
                  {dc.code}
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    {dc.areas.map((area) => (
                      <div key={area.id} className="text-sm text-gray-700">
                        {area.name} ({area.trCode})
                      </div>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-600">{zones || "—"}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-600">{cities || "—"}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => onEdit(dc)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    <Pencil className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(dc.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </td>
              </motion.tr>
            );
          })}
          {deliveryCodes.length === 0 && (
            <tr>
              <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                No delivery codes found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}