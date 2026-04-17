// app/dashboard/admin/procurement/new/page.tsx
import NewProcurementPage from '@/components/admin/NewProcurementPage';
import { Suspense } from 'react';


export default function Page() {
  return (
    <Suspense fallback={<div className='text-gray-800'>Loading...</div>}>
      <NewProcurementPage />
    </Suspense>
  );
}