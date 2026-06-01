import { Suspense } from 'react';
import type { Metadata } from 'next';
import OrderTrackingClient from './OrderTrackingClient';

export const metadata: Metadata = { title: 'Track Your Order' };

export default function OrderTrackingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand-300 border-t-brand-900 rounded-full animate-spin" /></div>}>
      <OrderTrackingClient />
    </Suspense>
  );
}
