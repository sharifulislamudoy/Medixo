// components/admin/ReturnedItemsModal.tsx
'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Modal from '@/components/ui/Modal';

interface ReturnedItem {
  productName: string;
  productImage: string;
  returnedQuantity: number;
  price: number;
  total: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  items: ReturnedItem[];
  loading: boolean;
}

export default function ReturnedItemsModal({ isOpen, onClose, items, loading }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="p-1"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Returned Items</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : items.length === 0 ? (
          <p className="text-gray-500">No items returned.</p>
        ) : (
          <div className="space-y-4">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="relative w-12 h-12 flex-shrink-0">
                  <Image src={item.productImage} alt={item.productName} fill className="object-contain rounded" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{item.productName}</p>
                  <p className="text-sm text-gray-500">Returned: {item.returnedQuantity}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-[#0F9D8F]">৳{item.total.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">৳{item.price} each</p>
                </div>
              </div>
            ))}
            <div className="border-t pt-4 flex justify-between font-bold">
              <span>Total Refund</span>
              <span className="text-[#0F9D8F]">
                ৳{items.reduce((sum, i) => sum + i.total, 0).toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </motion.div>
    </Modal>
  );
}