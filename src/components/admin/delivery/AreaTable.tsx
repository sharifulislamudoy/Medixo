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
  zoneId: string;
  zone: {
    name: string;
    code: string;
    city: { name: string; code: string };
  };
}

interface Props {
  onEdit: (area: Area) => void;
  onRefresh: () => void;
}

export default function AreaTable({ onEdit, onRefresh }: Props) {
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAreas();
  }, []);

  const fetchAreas = async () => {
    try {
      const res = await fetch("/api/admin/delivery/areas");
      const data = await res.json();
      setAreas(data);
    } catch (error) {
      toast.error("Failed to load areas");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this area?")) return;
    try {
      const res = await fetch(`/api/admin/delivery/areas/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("Area deleted");
      fetchAreas();
      onRefresh();
    } catch {
      toast.error("Failed to delete area");
    }
  };

  if (loading) return <div className="text-center py-4">Loading...</div>;

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Area Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Area Code</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Zone</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">City</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">TR Code</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {areas.map((area) => (
            <motion.tr
              key={area.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <td className="px-6 py-4 whitespace-nowrap text-gray-900">{area.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-gray-600">{area.code}</td>
              <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                {area.zone.name} ({area.zone.code})
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                {area.zone.city.name} ({area.zone.city.code})
              </td>
              <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-700">
                {area.trCode}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => onEdit(area)}
                  className="text-blue-600 hover:text-blue-900 mr-3"
                >
                  <Pencil className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(area.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </td>
            </motion.tr>
          ))}
          {areas.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                No areas found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}