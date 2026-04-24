// components/admin/SetCutoffTimeButton.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function SetCutoffTimeButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [cutoffHour, setCutoffHour] = useState<number>(11);
  const [cutoffMinute, setCutoffMinute] = useState<number>(0);
  const [minAmount, setMinAmount] = useState<number>(0);
  const [offStart, setOffStart] = useState<string>('');
  const [offEnd, setOffEnd] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Load current settings when modal opens
  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        setCutoffHour(data.dailyCutoffHour ?? 11);
        setCutoffMinute(data.dailyCutoffMinute ?? 0);
        setMinAmount(data.minFirstOrderAmount ?? 0);
        setOffStart(data.orderOffStart ? new Date(data.orderOffStart).toISOString().slice(0, 16) : '');
        setOffEnd(data.orderOffEnd ? new Date(data.orderOffEnd).toISOString().slice(0, 16) : '');
      })
      .catch(() => toast.error('Failed to load settings'));
  }, [isOpen]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dailyCutoffHour: cutoffHour,
          dailyCutoffMinute: cutoffMinute,
          minFirstOrderAmount: minAmount,
          orderOffStart: offStart ? new Date(offStart).toISOString() : null,
          orderOffEnd: offEnd ? new Date(offEnd).toISOString() : null,
        }),
      });

      if (!res.ok) throw new Error('Failed to save');
      toast.success('Settings updated');
      setIsOpen(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-gradient-to-r from-[#156A98] to-[#0F9D8F] text-white rounded-lg hover:opacity-90"
      >
        Cutoff & Orders Settings
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg"
            >
              <h2 className="text-2xl text-black font-bold mb-6">Order Settings</h2>

              {/* Cutoff time */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Daily Cutoff Time (orders after this go to next day)
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={cutoffHour}
                    onChange={e => setCutoffHour(Number(e.target.value))}
                    className="w-20 border text-gray-700 rounded-lg px-3 py-2"
                    placeholder="Hour"
                  />
                  <span className="text-xl self-center">:</span>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={cutoffMinute}
                    onChange={e => setCutoffMinute(Number(e.target.value))}
                    className="w-20 border text-gray-700 rounded-lg px-3 py-2"
                    placeholder="Min"
                  />
                </div>
              </div>

              {/* Min first order amount */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum first order after cutoff (৳)
                </label>
                <input
                  type="number"
                  min={0}
                  value={minAmount}
                  onChange={e => setMinAmount(Number(e.target.value))}
                  className="w-full border text-gray-700 rounded-lg px-3 py-2"
                  placeholder="0"
                />
              </div>

              {/* Order Off Period */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Orders Off Period (optional)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-xs text-gray-500">Start</span>
                    <input
                      type="datetime-local"
                      value={offStart}
                      onChange={e => setOffStart(e.target.value)}
                      className="w-full border text-gray-700 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">End</span>
                    <input
                      type="datetime-local"
                      value={offEnd}
                      onChange={e => setOffEnd(e.target.value)}
                      className="w-full text-gray-700 border rounded-lg px-3 py-2"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setOffStart('');
                    setOffEnd('');
                  }}
                  className="text-sm text-red-500 mt-1 hover:underline"
                >
                  Clear off period
                </button>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-6 py-2 bg-gradient-to-r from-[#156A98] to-[#0F9D8F] text-white rounded-lg disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}