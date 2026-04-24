'use client';

import { useEffect, useState } from 'react';

export default function InitialLoader({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Hide the spinner after a short delay – adjust the duration as needed
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {children}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
            <img src="/icons/icon-192.png" alt="Logo" className='h-auto'/>
        </div>
      )}
    </>
  );
}