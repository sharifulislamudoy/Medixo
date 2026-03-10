"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Pencil, Trash2 } from "lucide-react";

interface Zone {
  id: string;
  name: string;
  code: string;
  cityId: string;
  city: { name: string; code: string };
  areas?: any[];
}

interface Props {
  onEdit: (zone: Zone) => void;
  onRefresh: () => void;
}

export default function ZoneTable({ onEdit, onRefresh }: Props) {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchZones();
  }, []);

  const fetchZones = async () => {
    try {
      const res = await fetch("/api/admin/delivery/zones");
      const data = await res.json();
      setZones(data);
    } catch (error) {
      toast.error("Failed to load zones");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this zone?")) return;
    try {
      const res = await fetch(`/api/admin/delivery/zones/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("Zone deleted");
      fetchZones();
      onRefresh();
    } catch {
      toast.error("Failed to delete zone");
    }
  };

  if (loading) return <div className="text-center py-4">Loading...</div>;

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">City</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Areas</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {zones.map((zone) => (
            <motion.tr
              key={zone.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <td className="px-6 py-4 whitespace-nowrap text-gray-900">{zone.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-gray-600">{zone.code}</td>
              <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                {zone.city.name} ({zone.city.code})
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                {zone.areas?.length || 0}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => onEdit(zone)}
                  className="text-blue-600 hover:text-blue-900 mr-3"
                >
                  <Pencil className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(zone.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </td>
            </motion.tr>
          ))}
          {zones.length === 0 && (
            <tr>
              <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                No zones found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}