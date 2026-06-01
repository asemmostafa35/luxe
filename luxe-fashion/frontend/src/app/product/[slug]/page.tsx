import type { Metadata } from 'next';
import ProductDetailClient from './ProductDetailClient';

export const metadata: Metadata = { title: 'Product Details' };
export default function ProductDetailPage({ params }: { params: { slug: string } }) {
  return <ProductDetailClient slug={params.slug} />;
}
