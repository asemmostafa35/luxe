'use client';
import { useState, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { productsApi, categoriesApi } from '@/lib/api';
import ProductCard from '@/components/shop/ProductCard';
import { SlidersHorizontal, X, ChevronDown, ChevronUp, Grid2X2 } from 'lucide-react';

const SORT_OPTIONS = [
  { value: 'createdAt-desc', label: 'Newest' },
  { value: 'price-asc',      label: 'Price: Low to High' },
  { value: 'price-desc',     label: 'Price: High to Low' },
  { value: 'rating-desc',    label: 'Top Rated' },
  { value: 'sold-desc',      label: 'Best Selling' },
];
const SIZES = ['XS','S','M','L','XL','XXL','28','30','32','34','36'];

interface Props {
  defaultCategory?: string;
  defaultIsNew?: boolean;
  defaultIsBest?: boolean;
}

export default function ShopClient({ defaultCategory, defaultIsNew, defaultIsBest }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [grid, setGrid] = useState<2 | 3 | 4>(3);
  const [expandedFilters, setExpandedFilters] = useState<string[]>(['category', 'price']);

  const getParam = (key: string) => searchParams.get(key) || '';
  const page = Number(searchParams.get('page') || 1);
  const sort = searchParams.get('sort') || 'createdAt-desc';
  const [sortBy, sortOrder] = sort.split('-');

  const setParam = useCallback((key: string, val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (val) params.set(key, val); else params.delete(key);
    if (key !== 'page') params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  }, [searchParams, router, pathname]);

  const queryParams = {
    page, limit: 12,
    sort: sortBy,
    order: sortOrder,
    category: getParam('category') || defaultCategory || '',
    search:   getParam('search'),
    minPrice: getParam('minPrice'),
    maxPrice: getParam('maxPrice'),
    size:     getParam('size'),
    color:    getParam('color'),
    isNew:    getParam('isNew') || (defaultIsNew ? 'true' : ''),
    isBest:   getParam('isBest') || (defaultIsBest ? 'true' : ''),
  };

  const { data, isLoading } = useQuery({
    queryKey: ['products', queryParams],
    queryFn:  () => productsApi.getAll(queryParams),
  });

  const { data: catsData } = useQuery({
    queryKey: ['categories'],
    queryFn:  () => categoriesApi.getAll(),
  });

  const categories  = catsData?.data || [];
  const products    = data?.data?.products || [];
  const pagination  = data?.data?.pagination;

  const toggleFilter = (key: string) =>
    setExpandedFilters(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);

  const activeFilters = ['category','size','color','minPrice','maxPrice','isNew','isBest']
    .filter(k => searchParams.get(k));

  const FilterSection = ({ id, label, children }: { id: string; label: string; children: React.ReactNode }) => (
    <div className="sidebar-filter">
      <button onClick={() => toggleFilter(id)}
        className="w-full flex items-center justify-between text-xs tracking-widest uppercase text-brand-700 dark:text-brand-300 font-medium py-1">
        {label}
        {expandedFilters.includes(id) ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {expandedFilters.includes(id) && <div className="mt-4">{children}</div>}
    </div>
  );

  return (
    <div className="max-w-screen-2xl mx-auto px-4 md:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          {!defaultIsNew && !defaultIsBest && !defaultCategory && (
            <h1 className="font-serif text-3xl md:text-4xl font-light text-brand-900 dark:text-white">
              All Products
            </h1>
          )}
          {pagination && (
            <p className="text-sm text-brand-500 mt-1">{pagination.total} products</p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <select value={sort} onChange={e => setParam('sort', e.target.value)}
            className="text-sm border border-brand-200 dark:border-brand-700 bg-white dark:bg-brand-900 text-brand-700 dark:text-brand-200 px-3 py-2 focus:outline-none">
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          {/* Grid toggle */}
          <div className="hidden md:flex gap-1">
            {([2,3,4] as const).map(g => (
              <button key={g} onClick={() => setGrid(g)}
                className={`w-8 h-8 flex items-center justify-center transition-colors ${
                  grid === g
                    ? 'bg-brand-900 dark:bg-white text-white dark:text-brand-900'
                    : 'text-brand-400 hover:text-brand-900 dark:hover:text-white'
                }`}>
                <Grid2X2 size={16} />
              </button>
            ))}
          </div>

          <button onClick={() => setFiltersOpen(!filtersOpen)}
            className="flex items-center gap-2 text-sm border border-brand-200 dark:border-brand-700 px-4 py-2 hover:border-brand-900 dark:hover:border-white transition-colors lg:hidden">
            <SlidersHorizontal size={14} /> Filters
            {activeFilters.length > 0 && (
              <span className="w-4 h-4 bg-brand-900 dark:bg-white text-white dark:text-brand-900 text-[10px] rounded-full flex items-center justify-center">
                {activeFilters.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Active filter chips */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {activeFilters.map(k => (
            <button key={k} onClick={() => setParam(k, '')}
              className="flex items-center gap-1.5 text-xs border border-brand-300 dark:border-brand-600 px-3 py-1.5 hover:border-brand-900 dark:hover:border-white transition-colors">
              {searchParams.get(k)} <X size={10} />
            </button>
          ))}
          <button onClick={() => router.push(pathname)}
            className="text-xs text-brand-500 hover:text-brand-900 dark:hover:text-white underline transition-colors">
            Clear all
          </button>
        </div>
      )}

      <div className="flex gap-8">
        {/* Sidebar */}
        <aside className={`w-64 flex-shrink-0 ${filtersOpen ? 'block' : 'hidden'} lg:block`}>
          <FilterSection id="category" label="Category">
            <div className="space-y-2">
              <button onClick={() => setParam('category', '')}
                className={`block text-sm w-full text-left transition-colors ${
                  !getParam('category') ? 'text-brand-900 dark:text-white font-medium' : 'text-brand-500 hover:text-brand-900 dark:hover:text-white'
                }`}>
                All
              </button>
              {categories.map((c: any) => (
                <button key={c.id} onClick={() => setParam('category', c.slug)}
                  className={`block text-sm w-full text-left transition-colors ${
                    getParam('category') === c.slug ? 'text-brand-900 dark:text-white font-medium' : 'text-brand-500 hover:text-brand-900 dark:hover:text-white'
                  }`}>
                  {c.name}
                  {c._count?.products !== undefined && (
                    <span className="text-brand-400 ml-1">({c._count.products})</span>
                  )}
                </button>
              ))}
            </div>
          </FilterSection>

          <FilterSection id="price" label="Price Range">
            <div className="flex gap-2 items-center">
              <input type="number" placeholder="Min" value={getParam('minPrice')}
                onChange={e => setParam('minPrice', e.target.value)}
                className="w-full border-b border-brand-200 dark:border-brand-700 py-1.5 text-sm bg-transparent focus:outline-none focus:border-brand-900 dark:focus:border-white" />
              <span className="text-brand-400 flex-shrink-0">–</span>
              <input type="number" placeholder="Max" value={getParam('maxPrice')}
                onChange={e => setParam('maxPrice', e.target.value)}
                className="w-full border-b border-brand-200 dark:border-brand-700 py-1.5 text-sm bg-transparent focus:outline-none focus:border-brand-900 dark:focus:border-white" />
            </div>
          </FilterSection>

          <FilterSection id="size" label="Size">
            <div className="flex flex-wrap gap-2">
              {SIZES.map(s => (
                <button key={s} onClick={() => setParam('size', getParam('size') === s ? '' : s)}
                  className={`min-w-[40px] h-9 px-2 text-xs border transition-all ${
                    getParam('size') === s
                      ? 'bg-brand-900 dark:bg-white text-white dark:text-brand-900 border-brand-900 dark:border-white'
                      : 'border-brand-200 dark:border-brand-700 hover:border-brand-900 dark:hover:border-white'
                  }`}>
                  {s}
                </button>
              ))}
            </div>
          </FilterSection>

          <FilterSection id="availability" label="Availability">
            <div className="space-y-3">
              {[
                { key: 'isNew',  label: 'New Arrivals' },
                { key: 'isBest', label: 'Best Sellers'  },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox"
                    checked={searchParams.get(key) === 'true'}
                    onChange={e => setParam(key, e.target.checked ? 'true' : '')}
                    className="w-4 h-4 accent-brand-900 dark:accent-white" />
                  <span className="text-sm text-brand-700 dark:text-brand-300 group-hover:text-brand-900 dark:group-hover:text-white transition-colors">
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </FilterSection>
        </aside>

        {/* Products */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className={`grid gap-4 md:gap-6 grid-cols-2 ${grid >= 3 ? 'md:grid-cols-3' : ''} ${grid >= 4 ? 'xl:grid-cols-4' : ''}`}>
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="aspect-[3/4] skeleton" />
                  <div className="space-y-2 px-1">
                    <div className="h-3 skeleton w-3/4" />
                    <div className="h-3 skeleton w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <p className="font-serif text-2xl text-brand-900 dark:text-white">No products found</p>
              <p className="text-brand-500 text-sm">Try adjusting your filters</p>
              <button onClick={() => router.push(pathname)} className="btn-outline text-xs mt-2">
                Clear Filters
              </button>
            </div>
          ) : (
            <div className={`grid gap-4 md:gap-6 grid-cols-2 ${grid >= 3 ? 'md:grid-cols-3' : ''} ${grid >= 4 ? 'xl:grid-cols-4' : ''}`}>
              {products.map((p: any) => (
                <ProductCard key={p.id} product={{
                  ...p,
                  price:        Number(p.price),
                  comparePrice: p.comparePrice ? Number(p.comparePrice) : undefined,
                }} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex justify-center gap-2 mt-12">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setParam('page', String(p))}
                  className={`w-9 h-9 text-sm transition-all ${
                    page === p
                      ? 'bg-brand-900 dark:bg-white text-white dark:text-brand-900'
                      : 'border border-brand-200 dark:border-brand-700 hover:border-brand-900 dark:hover:border-white'
                  }`}>
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
