// app/dashboard/admin/home-sections/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Pencil, Trash2, Eye, EyeOff, Plus } from "lucide-react";

interface HomeSection {
  id: string;
  title: string;
  isVisible: boolean;
  shuffleIntervalMinutes: number;
  _count?: { products: number };
  products: { id: string }[];
}

export default function AdminHomeSectionsPage() {
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSections = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/home-sections");
    const data = await res.json();
    setSections(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchSections();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this section?")) return;
    await fetch(`/api/admin/home-sections/${id}`, { method: "DELETE" });
    fetchSections();
  };

  const handleToggleVisibility = async (id: string, current: boolean) => {
    await fetch(`/api/admin/home-sections/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isVisible: !current }),
    });
    fetchSections();
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-black">Homepage Sections</h1>
        <Link
          href="/dashboard/admin/home-sections/new"
          className="bg-[#0F9D8F] text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={18} /> Create Section
        </Link>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : sections.length === 0 ? (
        <p className="text-gray-500">No sections created yet.</p>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Title</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Products</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Shuffle (min)</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Visible</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sections.map((section) => (
                <tr key={section.id} className="hover:bg-gray-50">
                  <td className=" text-gray-900 px-6 py-4 font-medium">{section.title}</td>
                  <td className=" text-gray-900 px-6 py-4">{section.products.length}</td>
                  <td className=" text-gray-900 px-6 py-4">{section.shuffleIntervalMinutes}</td>
                  <td className=" text-gray-900 px-6 py-4">
                    <button
                      onClick={() => handleToggleVisibility(section.id, section.isVisible)}
                      className={`p-2 rounded ${section.isVisible ? "text-green-600" : "text-gray-400"}`}
                    >
                      {section.isVisible ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <Link
                        href={`/dashboard/admin/home-sections/${section.id}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Pencil size={18} />
                      </Link>
                      <button
                        onClick={() => handleDelete(section.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}