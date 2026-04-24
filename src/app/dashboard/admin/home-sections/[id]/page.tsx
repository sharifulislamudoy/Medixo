// app/dashboard/admin/home-sections/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import ProductSelector from "@/components/admin/ProductSelector";

// ✅ Add these interfaces to type the API responses
interface SectionProduct {
  productId: string;
  product: { id: string; name: string };
}

interface HomeSectionData {
  id: string;
  title: string;
  description: string | null;
  shuffleIntervalMinutes: number;
  isVisible: boolean;
  products: SectionProduct[];
}

export default function EditHomeSectionPage() {
  const router = useRouter();
  const params = useParams();
  const isNew = params.id === "new";
  const sectionId = isNew ? null : (params.id as string);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [shuffleInterval, setShuffleInterval] = useState(60);
  const [isVisible, setIsVisible] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch existing section data if editing
  useEffect(() => {
    if (!sectionId) return;
    fetch(`/api/admin/home-sections/${sectionId}`)
      .then(res => res.json())
      .then((data: HomeSectionData) => {
        setTitle(data.title);
        setDescription(data.description || "");
        setShuffleInterval(data.shuffleIntervalMinutes);
        setIsVisible(data.isVisible);
        setSelectedProducts(data.products.map((p: SectionProduct) => p.productId));
      });
  }, [sectionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      title,
      description,
      shuffleIntervalMinutes: shuffleInterval,
      isVisible,
    };

    try {
      // Create or update the section
      const res = sectionId
        ? await fetch(`/api/admin/home-sections/${sectionId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/admin/home-sections", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      if (!res.ok) throw new Error("Failed to save section");

      const savedSection = await res.json();
      const currentSectionId: string = savedSection.id || sectionId;

      // Get existing product IDs
      const existingRes = await fetch(`/api/admin/home-sections/${currentSectionId}`);
      const existingData: HomeSectionData = await existingRes.json();
      const existingIds: string[] = existingData.products.map(
        (p: SectionProduct) => p.productId
      );

      const toAdd = selectedProducts.filter((id: string) => !existingIds.includes(id));
      const toRemove = existingIds.filter((id: string) => !selectedProducts.includes(id));

      // Remove products
      await Promise.all(
        toRemove.map((productId: string) =>
          fetch(`/api/admin/home-sections/${currentSectionId}/products`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId }),
          })
        )
      );

      // Add products
      if (toAdd.length > 0) {
        await fetch(`/api/admin/home-sections/${currentSectionId}/products`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productIds: toAdd }),
        });
      }

      router.push("/dashboard/admin/home-sections");
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl text-gray-900 font-bold mb-6">
        {isNew ? "Create Home Section" : "Edit Home Section"}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow">
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-1">Title *</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            className="w-full text-gray-700 border border-gray-300 rounded-lg px-4 py-2"
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-medium mb-1">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            className="w-full text-gray-700 border border-gray-300 rounded-lg px-4 py-2"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">Shuffle Interval (minutes)</label>
            <input
              type="number"
              value={shuffleInterval}
              onChange={e => setShuffleInterval(Number(e.target.value))}
              min={0}
              className="w-full text-gray-700 border border-gray-300 rounded-lg px-4 py-2"
            />
          </div>
          <div className="flex items-center">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isVisible}
                onChange={e => setIsVisible(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-700 font-medium">Visible on Homepage</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">Select Products</label>
          <ProductSelector
            selected={selectedProducts}
            onChange={setSelectedProducts}
          />
        </div>

        {error && <p className="text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#0F9D8F] text-white py-3 rounded-lg font-semibold hover:bg-[#0C7D72] disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Section"}
        </button>
      </form>
    </div>
  );
}