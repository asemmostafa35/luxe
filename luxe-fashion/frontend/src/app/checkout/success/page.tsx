import { Suspense } from 'react';
import SuccessClient from './SuccessClient';

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand-300 border-t-brand-900 rounded-full animate-spin" /></div>}>
      <SuccessClient />
    </Suspense>
  );
}
