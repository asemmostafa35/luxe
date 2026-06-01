'use client';
import { useEffect, useRef, useState } from 'react';
import { Search, X, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';

export default function SearchOverlay({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const { data, isFetching } = useQuery({
    queryKey: ['search', q],
    queryFn: () => productsApi.getAll({ search: q, limit: 6 }),
    enabled: q.length > 2,
  });

  const results = data?.data?.products || [];

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="absolute top-0 left-0 right-0 bg-white dark:bg-brand-950 shadow-2xl animate-fade-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="max-w-3xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4 border-b border-brand-200 dark:border-brand-700 pb-4">
            <Search size={20} className="text-brand-400 flex-shrink-0" />
            <input
              ref={inputRef}
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search for products, categories..."
              className="flex-1 text-lg bg-transparent text-brand-900 dark:text-white placeholder:text-brand-400 focus:outline-none"
            />
            <button onClick={onClose} className="text-brand-400 hover:text-brand-900 dark:hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          {q.length > 2 && (
            <div className="py-4">
              {isFetching && (
                <div className="space-y-3">
                  {[1,2,3].map(i => (
                    <div key={i} className="flex gap-3 animate-pulse">
                      <div className="w-14 h-14 bg-brand-100 dark:bg-brand-800 rounded" />
                      <div className="flex-1 space-y-2 py-1">
                        <div className="h-3 bg-brand-100 dark:bg-brand-800 rounded w-3/4" />
                        <div className="h-3 bg-brand-100 dark:bg-brand-800 rounded w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!isFetching && results.length === 0 && (
                <p className="text-brand-500 text-sm py-4">No results for &ldquo;{q}&rdquo;</p>
              )}

              {!isFetching && results.length > 0 && (
                <>
                  <div className="space-y-3 mb-4">
                    {results.map((p: any) => (
                      <Link
                        key={p.id}
                        href={`/product/${p.slug}`}
                        onClick={onClose}
                        className="flex items-center gap-3 p-2 hover:bg-brand-50 dark:hover:bg-brand-900 transition-colors rounded"
                      >
                        <div className="w-14 h-14 relative flex-shrink-0 overflow-hidden bg-brand-100 dark:bg-brand-800">
                          {p.images?.[0] && (
                            <Image src={p.images[0].url} alt={p.name} fill className="object-cover" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-brand-900 dark:text-white truncate">{p.name}</p>
                          <p className="text-xs text-brand-500">{p.category?.name}</p>
                        </div>
                        <p className="text-sm font-medium text-brand-900 dark:text-white flex-shrink-0">${Number(p.price).toFixed(2)}</p>
                      </Link>
                    ))}
                  </div>
                  <Link
                    href={`/shop?search=${encodeURIComponent(q)}`}
                    onClick={onClose}
                    className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-900 dark:hover:text-white transition-colors"
                  >
                    View all results <ArrowRight size={14} />
                  </Link>
                </>
              )}
            </div>
          )}

          {q.length === 0 && (
            <div className="py-4">
              <p className="text-xs tracking-widest uppercase text-brand-400 mb-3">Popular Searches</p>
              <div className="flex flex-wrap gap-2">
                {['Dresses', 'Jackets', 'Trousers', 'Knitwear', 'Accessories'].map(t => (
                  <button
                    key={t}
                    onClick={() => setQ(t)}
                    className="text-sm text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-700 px-3 py-1.5 hover:border-brand-900 dark:hover:border-white hover:text-brand-900 dark:hover:text-white transition-colors"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
