"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Pencil, Trash2, UserPlus } from "lucide-react";
import AssignDeliveryCodeModal from "@/components/AssignDeliveryCodeModal";
import Modal from "@/components/ui/Modal";
import AssignBoyToCodeModal from "./AssignBoyToCodeModal";

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

interface DeliveryBoy {
  id: string;
  name: string;
}

interface DeliveryCode {
  id: string;
  code: string;
  areas: Area[];
  users: DeliveryBoy[];
  createdAt: string;
}

interface Props {
  onEdit: (dc: DeliveryCode) => void;
  onRefresh: () => void;
}

export default function DeliveryCodeTable({ onEdit, onRefresh }: Props) {
  const [deliveryCodes, setDeliveryCodes] = useState<DeliveryCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedBoy, setSelectedBoy] = useState<{ id: string; currentCodeId: string } | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<{ id: string; code: string } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [assigningCode, setAssigningCode] = useState<DeliveryCode | null>(null);
  const [showAssignBoyModal, setShowAssignBoyModal] = useState(false);

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

  const handleDelete = async () => {
    if (!deleteCandidate) return;
    try {
      const res = await fetch(`/api/admin/delivery/delivery-codes/${deleteCandidate.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("Delivery code deleted");
      fetchDeliveryCodes();
      onRefresh();
    } catch {
      toast.error("Failed to delete delivery code");
    } finally {
      setShowDeleteModal(false);
      setDeleteCandidate(null);
    }
  };

  const handleReassignBoy = (boyId: string, currentCodeId: string) => {
    setSelectedBoy({ id: boyId, currentCodeId });
    setShowAssignModal(true);
  };

  const handleAssignConfirm = async (newCodeId: string) => {
    if (!selectedBoy) return;
    try {
      const res = await fetch(`/api/admin/users/${selectedBoy.id}/delivery-code`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryCodeId: newCodeId }),
      });
      if (!res.ok) throw new Error();
      toast.success("Delivery code updated");
      fetchDeliveryCodes();
      onRefresh();
    } catch {
      toast.error("Failed to update delivery code");
    } finally {
      setShowAssignModal(false);
      setSelectedBoy(null);
    }
  };

  const skeletonRows = Array.from({ length: 5 }).map((_, index) => (
    <tr key={`skeleton-${index}`} className="animate-pulse">
      <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-48"></div></td>
      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
      <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
      <td className="px-6 py-4 whitespace-nowrap text-right"><div className="flex justify-end space-x-3"><div className="h-4 w-4 bg-gray-200 rounded"></div><div className="h-4 w-4 bg-gray-200 rounded"></div><div className="h-4 w-4 bg-gray-200 rounded"></div></div></td>
    </tr>
  ));

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Delivery Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Areas (TR Code)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned Boys</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">City</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">{skeletonRows}</tbody>
        </table>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Delivery Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Areas (TR Code)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned Boys</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">City</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {deliveryCodes.map((dc) => {
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
                  <td className="px-6 py-4">
                    {dc.users.length === 0 ? (
                      <span className="text-sm text-gray-400 italic">None</span>
                    ) : (
                      <ul className="space-y-1">
                        {dc.users.map((boy) => (
                          <li key={boy.id} className="flex items-center justify-between text-sm text-gray-700">
                            <div className="flex flex-col items-start">
                              <span>{boy.name}</span>
                              <button
                                onClick={() => handleReassignBoy(boy.id, dc.id)}
                                className="text-xs text-[#0F9D8F] hover:text-[#156A98] ml-2"
                                title="Reassign to another code"
                              >
                                Change
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">{cities || "—"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => {
                        setAssigningCode(dc);
                        setShowAssignBoyModal(true);
                      }}
                      className="text-green-600 hover:text-green-900 mr-3"
                      title="Assign delivery boy"
                    >
                      <UserPlus className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => onEdit(dc)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        setDeleteCandidate({ id: dc.id, code: dc.code });
                        setShowDeleteModal(true);
                      }}
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

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Delete</h3>
          <p className="text-sm text-gray-500 mb-4">
            Are you sure you want to delete delivery code <span className="font-mono font-bold">{deleteCandidate?.code}</span>? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* Reassign Modal */}
      {selectedBoy && (
        <AssignDeliveryCodeModal
          isOpen={showAssignModal}
          onClose={() => {
            setShowAssignModal(false);
            setSelectedBoy(null);
          }}
          onConfirm={handleAssignConfirm}
          currentDeliveryCodeId={selectedBoy.currentCodeId}
        />
      )}

      {/* Assign Boy to Code Modal */}
      <AssignBoyToCodeModal
        isOpen={showAssignBoyModal}
        onClose={() => {
          setShowAssignBoyModal(false);
          setAssigningCode(null);
        }}
        deliveryCode={assigningCode}
        onSuccess={() => {
          fetchDeliveryCodes();
          onRefresh();
        }}
      />
    </>
  );
}