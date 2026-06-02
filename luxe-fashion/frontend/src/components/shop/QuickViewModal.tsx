"use client";
import {
  X,
  ShoppingBag,
  Heart,
  Star,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useUIStore, useCartStore, useWishlistStore } from "@/store";
import toast from "react-hot-toast";
import { formatEGP } from "@/lib/currency";

export default function QuickViewModal() {
  const { quickViewProduct: p, closeQuickView } = useUIStore();
  const { addItem } = useCartStore();
  const wishlist = useWishlistStore();
  const [imgIdx, setImgIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  if (!p) return null;

  const sizes = [
    ...new Set(p.variants?.filter((v: any) => v.size).map((v: any) => v.size)),
  ];
  const colors = [
    ...new Map(
      p.variants?.filter((v: any) => v.color).map((v: any) => [v.color, v]),
    ).values(),
  ];
  const isWishlisted = wishlist.has(p.id);

  const handleAdd = () => {
    if (sizes.length > 0 && !selectedSize) {
      toast.error("Please select a size");
      return;
    }
    addItem({
      id: p.id,
      productId: p.id,
      name: p.name,
      price: Number(p.price),
      image: p.images?.[0]?.url,
      size: selectedSize || undefined,
      color: selectedColor || undefined,
      maxStock: 10,
    });
    toast.success("Added to bag");
    closeQuickView();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={closeQuickView}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-white dark:bg-brand-950 max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-scale-in shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={closeQuickView}
          className="absolute top-4 right-4 z-10 w-8 h-8 bg-white dark:bg-brand-800 flex items-center justify-center text-brand-500 hover:text-brand-900 dark:hover:text-white shadow-md transition-colors"
        >
          <X size={16} />
        </button>

        <div className="grid md:grid-cols-2">
          {/* Images */}
          <div className="relative aspect-[3/4] bg-brand-50 dark:bg-brand-900">
            {p.images?.[imgIdx] && (
              <Image
                src={p.images[imgIdx].url}
                alt={p.name}
                fill
                className="object-cover"
              />
            )}
            {p.images?.length > 1 && (
              <>
                <button
                  onClick={() => setImgIdx((i) => Math.max(0, i - 1))}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 dark:bg-brand-800/80 flex items-center justify-center shadow"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() =>
                    setImgIdx((i) => Math.min(p.images.length - 1, i + 1))
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 dark:bg-brand-800/80 flex items-center justify-center shadow"
                >
                  <ChevronRight size={16} />
                </button>
              </>
            )}
          </div>

          {/* Info */}
          <div className="p-6 md:p-8 flex flex-col gap-4">
            <div>
              <p className="label-small text-brand-500 mb-2">
                {p.category?.name}
              </p>
              <h2 className="font-serif text-2xl font-light text-brand-900 dark:text-white mb-2">
                {p.name}
              </h2>
              {p.avgRating > 0 && (
                <div className="flex items-center gap-1.5 mb-3">
                  {Array.from({ length: 5 }).map((_: any, i: number) => (
                    <Star
                      key={i}
                      size={12}
                      className={
                        i < Math.round(p.avgRating)
                          ? "fill-gold-500 text-gold-500"
                          : "text-brand-200 dark:text-brand-700"
                      }
                    />
                  ))}
                  <span className="text-xs text-brand-500">
                    ({p._count?.reviews || 0})
                  </span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <span className="text-2xl font-medium text-brand-900 dark:text-white">
                  {formatEGP(Number(p.price))}
                </span>
                {p.comparePrice && (
                  <span className="text-brand-400 line-through">
                    {formatEGP(Number(p.comparePrice))}
                  </span>
                )}
              </div>
            </div>

            <p className="text-sm text-brand-600 dark:text-brand-400 leading-relaxed line-clamp-3">
              {p.description}
            </p>

            {/* Colors */}
            {colors.length > 0 && (
              <div>
                <p className="text-xs tracking-widest uppercase text-brand-500 mb-2">
                  Color{selectedColor && `: ${selectedColor}`}
                </p>
                <div className="flex gap-2">
                  {colors.map((v: any) => (
                    <button
                      key={v.color}
                      onClick={() => setSelectedColor(v.color)}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${selectedColor === v.color ? "border-brand-900 dark:border-white scale-110" : "border-transparent hover:border-brand-400"}`}
                      style={{ backgroundColor: v.colorHex || "#ccc" }}
                      title={v.color}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            {sizes.length > 0 && (
              <div>
                <p className="text-xs tracking-widest uppercase text-brand-500 mb-2">
                  Size{selectedSize && `: ${selectedSize}`}
                </p>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((s: any) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      className={`min-w-[40px] h-9 px-3 text-sm border transition-all ${selectedSize === s ? "bg-brand-900 dark:bg-white text-white dark:text-brand-900 border-brand-900 dark:border-white" : "border-brand-200 dark:border-brand-700 hover:border-brand-900 dark:hover:border-white"}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-2">
              <button
                onClick={handleAdd}
                className="flex-1 btn-primary text-xs flex items-center justify-center gap-2"
              >
                <ShoppingBag size={14} /> Add to Bag
              </button>
              <button
                onClick={() => {
                  wishlist.toggle({
                    productId: p.id,
                    name: p.name,
                    price: Number(p.price),
                    image: p.images?.[0]?.url,
                    slug: p.slug,
                  });
                }}
                className={`w-11 h-11 border flex items-center justify-center transition-colors ${isWishlisted ? "border-red-300 text-red-500" : "border-brand-200 dark:border-brand-700 text-brand-500 hover:border-brand-900 dark:hover:border-white hover:text-brand-900 dark:hover:text-white"}`}
              >
                <Heart
                  size={16}
                  className={isWishlisted ? "fill-current" : ""}
                />
              </button>
            </div>

            <Link
              href={`/product/${p.slug}`}
              onClick={closeQuickView}
              className="text-center text-xs tracking-widest uppercase text-brand-500 hover:text-brand-900 dark:hover:text-white transition-colors underline underline-offset-4"
            >
              View Full Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
