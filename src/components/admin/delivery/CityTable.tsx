"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Pencil, Trash2 } from "lucide-react";

interface City {
  id: string;
  name: string;
  code: string;
  zones?: any[];
}

interface Props {
  onEdit: (city: City) => void;
  onRefresh: () => void;
}

export default function CityTable({ onEdit, onRefresh }: Props) {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCities();
  }, []);

  const fetchCities = async () => {
    try {
      const res = await fetch("/api/admin/delivery/cities");
      const data = await res.json();
      setCities(data);
    } catch (error) {
      toast.error("Failed to load cities");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this city?")) return;
    try {
      const res = await fetch(`/api/admin/delivery/cities/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("City deleted");
      fetchCities();
      onRefresh();
    } catch {
      toast.error("Failed to delete city");
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
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Zones</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {cities.map((city) => (
            <motion.tr
              key={city.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <td className="px-6 py-4 whitespace-nowrap text-gray-900">{city.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-gray-600">{city.code}</td>
              <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                {city.zones?.length || 0}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => onEdit(city)}
                  className="text-blue-600 hover:text-blue-900 mr-3"
                >
                  <Pencil className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(city.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </td>
            </motion.tr>
          ))}
          {cities.length === 0 && (
            <tr>
              <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                No cities found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}