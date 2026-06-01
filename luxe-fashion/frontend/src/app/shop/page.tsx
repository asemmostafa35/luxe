import type { Metadata } from 'next';
import { Suspense } from 'react';
import ShopClient from './ShopClient';

export const metadata: Metadata = { title: 'Shop — All Products' };

export default function ShopPage() {
  return (
    <Suspense fallback={
      <div className="max-w-screen-2xl mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-[3/4] skeleton" />
              <div className="h-3 skeleton w-3/4" /><div className="h-3 skeleton w-1/3" />
            </div>
          ))}
        </div>
      </div>
    }>
      <ShopClient />
    </Suspense>
  );
}
