'use client';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { categoriesApi, productsApi } from '@/lib/api';
import ProductCard from '@/components/shop/ProductCard';

// ─── Categories Grid ──────────────────────────────────────────────────────────
const fallbackCategories = [
  { id: '1', name: 'Women', slug: 'women', image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&q=80' },
  { id: '2', name: 'Men', slug: 'men', image: 'https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=800&q=80' },
  { id: '3', name: 'Accessories', slug: 'accessories', image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80' },
  { id: '4', name: 'Outerwear', slug: 'outerwear', image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=80' },
];

export function CategoriesGrid() {
  const { data } = useQuery({ queryKey: ['categories'], queryFn: () => categoriesApi.getAll() });

  // ✅ FIX: The backend categories route returns a plain array directly.
  // axios wraps the HTTP response body in response.data, so:
  //   data        = axios response  → { data: [...] }
  //   data.data   = the actual array from the backend
  const cats = Array.isArray(data?.data) && data.data.length > 0
    ? data.data.slice(0, 4)
    : fallbackCategories;

  return (
    <section className="max-w-screen-2xl mx-auto px-4 md:px-8 py-16">
      <div className="flex items-end justify-between mb-8">
        <h2 className="font-serif text-3xl md:text-4xl font-light text-brand-900 dark:text-white">Shop by Category</h2>
        <Link href="/category" className="flex items-center gap-2 text-sm text-brand-600 dark:text-brand-400 hover:text-brand-900 dark:hover:text-white transition-colors">
          View All <ArrowRight size={14} />
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cats.map((cat: any) => (
          <Link key={cat.id} href={`/category/${cat.slug}`}
            className="group relative aspect-[3/4] overflow-hidden bg-brand-100 dark:bg-brand-800 flex items-end">
            {cat.image && (
              <img src={cat.image} alt={cat.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="relative p-5 w-full">
              <p className="font-serif text-xl font-light text-white mb-1">{cat.name}</p>
              <p className="text-white/60 text-xs tracking-widest uppercase group-hover:text-white transition-colors">
                Shop Now →
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ─── Featured Products ────────────────────────────────────────────────────────
export function FeaturedProducts() {
  const { data, isLoading } = useQuery({ queryKey: ['featured'], queryFn: () => productsApi.getFeatured() });

  // ✅ FIX: getFeatured returns a plain array, not { products: [...] }
  const products = Array.isArray(data?.data) ? data.data : [];

  return (
    <section className="py-16 bg-brand-50 dark:bg-brand-900/30">
      <div className="max-w-screen-2xl mx-auto px-4 md:px-8">
        <div className="text-center mb-12">
          <p className="label-small text-brand-500 mb-3">Curated Selection</p>
          <h2 className="font-serif text-4xl md:text-5xl font-light text-brand-900 dark:text-white">Featured Pieces</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)
            : products.map((p: any) => <ProductCard key={p.id} product={p} />)}
        </div>
        <div className="text-center mt-12">
          <Link href="/shop" className="btn-outline inline-flex items-center gap-2">
            View All Products <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── New Arrivals Strip ───────────────────────────────────────────────────────
export function NewArrivalsStrip() {
  const { data } = useQuery({ queryKey: ['new-arrivals'], queryFn: () => productsApi.getNewArrivals() });

  // ✅ FIX: getNewArrivals returns a plain array
  const products = Array.isArray(data?.data) ? data.data.slice(0, 4) : [];

  return (
    <section className="max-w-screen-2xl mx-auto px-4 md:px-8 py-16">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="label-small text-brand-500 mb-2">Just Landed</p>
          <h2 className="font-serif text-3xl md:text-4xl font-light text-brand-900 dark:text-white">New Arrivals</h2>
        </div>
        <Link href="/new-arrivals" className="flex items-center gap-2 text-sm text-brand-600 dark:text-brand-400 hover:text-brand-900 dark:hover:text-white transition-colors">
          See All <ArrowRight size={14} />
        </Link>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {products.map((p: any) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}

// ─── Best Sellers ─────────────────────────────────────────────────────────────
export function BestSellersSection() {
  const { data } = useQuery({ queryKey: ['best-sellers'], queryFn: () => productsApi.getBestSellers() });

  // ✅ FIX: getBestSellers returns a plain array
  const products = Array.isArray(data?.data) ? data.data.slice(0, 4) : [];

  return (
    <section className="py-16 bg-brand-950 dark:bg-black">
      <div className="max-w-screen-2xl mx-auto px-4 md:px-8">
        <div className="text-center mb-12">
          <p className="text-xs tracking-widest uppercase text-brand-500 mb-3">Community Favourites</p>
          <h2 className="font-serif text-4xl md:text-5xl font-light text-white">Best Sellers</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((p: any) => <ProductCard key={p.id} product={{ ...p, price: Number(p.price) }} />)}
        </div>
        <div className="text-center mt-12">
          <Link href="/best-sellers" className="border border-white text-white px-8 py-3 text-sm tracking-widest uppercase hover:bg-white hover:text-brand-900 transition-all inline-flex items-center gap-2">
            View Best Sellers <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Brand Values ─────────────────────────────────────────────────────────────
const values = [
  { title: 'Considered Design', body: 'Every piece is designed with intention, balancing aesthetics and functionality.' },
  { title: 'Premium Materials', body: 'We source only the finest fabrics and materials from trusted suppliers worldwide.' },
  { title: 'Ethical Production', body: 'Produced in certified facilities with fair wages and safe working conditions.' },
  { title: 'Free Returns', body: 'Not quite right? Return within 30 days for a full refund, no questions asked.' },
];

export function BrandValues() {
  return (
    <section className="max-w-screen-2xl mx-auto px-4 md:px-8 py-20">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {values.map((v, i) => (
          <div key={i} className="group">
            <div className="w-8 h-0.5 bg-brand-900 dark:bg-white mb-6 transition-all duration-300 group-hover:w-16" />
            <h3 className="font-serif text-xl font-light text-brand-900 dark:text-white mb-3">{v.title}</h3>
            <p className="text-sm text-brand-600 dark:text-brand-400 leading-relaxed">{v.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Instagram Feed ───────────────────────────────────────────────────────────
// ✅ FIX: Replace empty grey placeholder boxes with curated lifestyle images.
// These are high-quality Unsplash fashion/lifestyle photos that represent
// the brand's Instagram aesthetic. Each links to the brand's Instagram handle.
const instagramImages = [
  {
    url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&q=80',
    alt: 'Fashion look 1',
  },
  {
    url: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&q=80',
    alt: 'Fashion look 2',
  },
  {
    url: 'https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=400&q=80',
    alt: 'Fashion look 3',
  },
  {
    url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&q=80',
    alt: 'Fashion look 4',
  },
  {
    url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80',
    alt: 'Fashion look 5',
  },
  {
    url: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&q=80',
    alt: 'Fashion look 6',
  },
];

export function InstagramFeed() {
  return (
    <section className="py-16 bg-brand-50 dark:bg-brand-900/20">
      <div className="max-w-screen-2xl mx-auto px-4 md:px-8">
        <div className="text-center mb-8">
          <p className="label-small text-brand-500 mb-2">@luxefashion</p>
          <h2 className="font-serif text-3xl font-light text-brand-900 dark:text-white">Follow Our Story</h2>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {instagramImages.map((img, i) => (
            <a key={i} href="https://instagram.com" target="_blank" rel="noopener noreferrer"
              className="group relative aspect-square overflow-hidden bg-brand-200 dark:bg-brand-800">
              <img
                src={img.url}
                alt={img.alt}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-brand-900/0 group-hover:bg-brand-900/30 transition-all duration-300 flex items-center justify-center">
                <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-xs tracking-widest uppercase">View</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Shared skeleton ──────────────────────────────────────────────────────────
function ProductSkeleton() {
  return (
    <div className="space-y-3">
      <div className="aspect-[3/4] skeleton rounded-none" />
      <div className="space-y-2 px-1">
        <div className="h-3 skeleton w-2/3" />
        <div className="h-3 skeleton w-full" />
        <div className="h-3 skeleton w-1/3" />
      </div>
    </div>
  );
}

export default CategoriesGrid;
