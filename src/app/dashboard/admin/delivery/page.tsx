"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import CityTable from "@/components/admin/delivery/CityTable";
import ZoneTable from "@/components/admin/delivery/ZoneTable";
import AreaTable from "@/components/admin/delivery/AreaTable";
import CreateCityModal from "@/components/admin/delivery/CreateCityModal";
import EditCityModal from "@/components/admin/delivery/EditCityModal";
import CreateZoneModal from "@/components/admin/delivery/CreateZoneModal";
import EditZoneModal from "@/components/admin/delivery/EditZoneModal";
import CreateAreaModal from "@/components/admin/delivery/CreateAreaModal";
import EditAreaModal from "@/components/admin/delivery/EditAreaModal";

export default function DeliveryPage() {
  const [activeTab, setActiveTab] = useState<"cities" | "zones" | "areas">("cities");

  // Refresh triggers
  const [refreshCities, setRefreshCities] = useState(0);
  const [refreshZones, setRefreshZones] = useState(0);
  const [refreshAreas, setRefreshAreas] = useState(0);

  // Modals state
  const [isCreateCityOpen, setIsCreateCityOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<any>(null);
  const [isCreateZoneOpen, setIsCreateZoneOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<any>(null);
  const [isCreateAreaOpen, setIsCreateAreaOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<any>(null);

  const handleSuccess = () => {
    if (activeTab === "cities") setRefreshCities((prev) => prev + 1);
    if (activeTab === "zones") setRefreshZones((prev) => prev + 1);
    if (activeTab === "areas") setRefreshAreas((prev) => prev + 1);
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Delivery Routing</h1>

      {/* Tabs */}
      <div className="flex space-x-4 border-b mb-6">
        {(["cities", "zones", "areas"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium capitalize ${
              activeTab === tab
                ? "text-[#0F9D8F] border-b-2 border-[#0F9D8F]"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {activeTab === "cities" && (
          <>
            <div className="flex justify-end mb-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsCreateCityOpen(true)}
                className="bg-gradient-to-r from-[#156A98] to-[#0F9D8F] text-white px-4 py-2 rounded-lg shadow hover:shadow-lg"
              >
                + Add City
              </motion.button>
            </div>
            <CityTable
              key={refreshCities}
              onEdit={(city) => setEditingCity(city)}
              onRefresh={handleSuccess}
            />
          </>
        )}

        {activeTab === "zones" && (
          <>
            <div className="flex justify-end mb-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsCreateZoneOpen(true)}
                className="bg-gradient-to-r from-[#156A98] to-[#0F9D8F] text-white px-4 py-2 rounded-lg shadow hover:shadow-lg"
              >
                + Add Zone
              </motion.button>
            </div>
            <ZoneTable
              key={refreshZones}
              onEdit={(zone) => setEditingZone(zone)}
              onRefresh={handleSuccess}
            />
          </>
        )}

        {activeTab === "areas" && (
          <>
            <div className="flex justify-end mb-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsCreateAreaOpen(true)}
                className="bg-gradient-to-r from-[#156A98] to-[#0F9D8F] text-white px-4 py-2 rounded-lg shadow hover:shadow-lg"
              >
                + Add Area
              </motion.button>
            </div>
            <AreaTable
              key={refreshAreas}
              onEdit={(area) => setEditingArea(area)}
              onRefresh={handleSuccess}
            />
          </>
        )}
      </div>

      {/* Modals */}
      <CreateCityModal
        isOpen={isCreateCityOpen}
        onClose={() => setIsCreateCityOpen(false)}
        onSuccess={handleSuccess}
      />
      <EditCityModal
        isOpen={!!editingCity}
        onClose={() => setEditingCity(null)}
        onSuccess={handleSuccess}
        city={editingCity}
      />

      <CreateZoneModal
        isOpen={isCreateZoneOpen}
        onClose={() => setIsCreateZoneOpen(false)}
        onSuccess={handleSuccess}
      />
      <EditZoneModal
        isOpen={!!editingZone}
        onClose={() => setEditingZone(null)}
        onSuccess={handleSuccess}
        zone={editingZone}
      />

      <CreateAreaModal
        isOpen={isCreateAreaOpen}
        onClose={() => setIsCreateAreaOpen(false)}
        onSuccess={handleSuccess}
      />
      <EditAreaModal
        isOpen={!!editingArea}
        onClose={() => setEditingArea(null)}
        onSuccess={handleSuccess}
        area={editingArea}
      />
    </div>
  );
}