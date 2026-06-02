import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Shop by Category — ZANE",
  description: "Browse our full range of categories.",
};

const FALLBACK_CATEGORIES = [
  {
    name: "Women",
    slug: "women",
    image:
      "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&q=80",
    count: null,
  },
  {
    name: "Men",
    slug: "men",
    image:
      "https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=800&q=80",
    count: null,
  },
  {
    name: "Dresses",
    slug: "dresses",
    image:
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80",
    count: null,
  },
  {
    name: "Outerwear",
    slug: "outerwear",
    image:
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=80",
    count: null,
  },
  {
    name: "Knitwear",
    slug: "knitwear",
    image:
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&q=80",
    count: null,
  },
  {
    name: "Accessories",
    slug: "accessories",
    image:
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80",
    count: null,
  },
];

async function getCategories() {
  try {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    const res = await fetch(`${apiUrl}/categories`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return FALLBACK_CATEGORIES;
    const data = await res.json();
    return data.length ? data : FALLBACK_CATEGORIES;
  } catch {
    return FALLBACK_CATEGORIES;
  }
}

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="max-w-screen-2xl mx-auto px-4 md:px-8 py-12">
      <div className="mb-10">
        <p className="label-small text-brand-500 mb-2">Browse</p>
        <h1 className="font-serif text-4xl md:text-5xl font-light text-brand-900 dark:text-white">
          Shop by Category
        </h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 md:gap-6">
        {categories.map((cat: any) => (
          <Link
            key={cat.slug || cat.id}
            href={`/category/${cat.slug}`}
            className="group relative aspect-[4/5] overflow-hidden bg-brand-100 dark:bg-brand-800 block"
          >
            {cat.image && (
              <img
                src={cat.image}
                alt={cat.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h2 className="font-serif text-2xl font-light text-white mb-1">
                {cat.name}
              </h2>
              {cat._count?.products != null && (
                <p className="text-white/60 text-xs tracking-widest uppercase">
                  {cat._count.products} products
                </p>
              )}
              <p
                className="text-white/70 text-xs tracking-widest uppercase mt-2
                translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100
                transition-all duration-300"
              >
                Shop Now →
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
