import type { Metadata } from 'next';
import { Suspense } from 'react';
import ShopClient from '@/app/shop/ShopClient';

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const name = params.slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return { title: `${name} — Shop` };
}

export default function CategoryPage({ params }: Props) {
  return (
    <Suspense fallback={<div className="max-w-screen-2xl mx-auto px-4 py-8"><div className="h-8 skeleton w-48 mb-8" /><div className="grid grid-cols-2 md:grid-cols-3 gap-6">{Array.from({length:6}).map((_,i)=><div key={i} className="aspect-[3/4] skeleton"/>)}</div></div>}>
      <ShopClient defaultCategory={params.slug} />
    </Suspense>
  );
}
