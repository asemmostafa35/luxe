"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Heart, ShoppingBag, Eye, Star } from "lucide-react";
import { useCartStore, useWishlistStore, useUIStore } from "@/store";
import toast from "react-hot-toast";
import clsx from "clsx";
import { formatEGP } from "@/lib/currency";

interface Product {
  id: string;
  slug: string;
  name: string;
  price: number;
  comparePrice?: number;
  images: Array<{ url: string; alt?: string }>;
  category?: { name: string; slug: string };
  avgRating?: number;
  reviewCount?: number;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  variants?: Array<{
    size?: string;
    color?: string;
    colorHex?: string;
    stock: number;
  }>;
}

interface Props {
  product: Product;
  className?: string;
}

export default function ProductCard({ product, className }: Props) {
  const [hovered, setHovered] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);
  const wishlist = useWishlistStore();
  const { addItem } = useCartStore();
  const { openQuickView } = useUIStore();
  const isWishlisted = wishlist.has(product.id);
  const discount = product.comparePrice
    ? Math.round((1 - product.price / product.comparePrice) * 100)
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    const firstVariant = product.variants?.[0];
    addItem({
      id: product.id,
      productId: product.id,
      variantId:
        firstVariant?.size || firstVariant?.color ? undefined : undefined,
      name: product.name,
      price: product.price,
      image: product.images[0]?.url,
      size: firstVariant?.size,
      color: firstVariant?.color,
      maxStock: firstVariant?.stock || 10,
    });
    toast.success("Added to bag");
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    wishlist.toggle({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0]?.url,
      slug: product.slug,
    });
    toast(isWishlisted ? "Removed from wishlist" : "Added to wishlist");
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    openQuickView(product);
  };

  return (
    <Link
      href={`/product/${product.slug}`}
      className={clsx("card-product block", className)}
    >
      <div
        className="product-img-wrap"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => {
          setHovered(false);
          setImgIdx(0);
        }}
      >
        {/* Badge */}
        {discount > 0 && <span className="badge-sale">-{discount}%</span>}
        {!discount && product.isNewArrival && (
          <span className="badge-new">New</span>
        )}
        {!discount && !product.isNewArrival && product.isBestSeller && (
          <span className="badge-new bg-gold-500 dark:bg-gold-500 text-brand-900">
            Hot
          </span>
        )}

        {/* Image */}
        {product.images?.[0] && (
          <Image
            src={product.images[hovered && product.images[1] ? 1 : 0]?.url}
            alt={product.images[0]?.alt || product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-all duration-700"
          />
        )}

        {/* Hover overlay */}
        <div
          className={`absolute inset-0 bg-black/0 transition-all duration-300 ${hovered ? "bg-black/5" : ""}`}
        />

        {/* Actions */}
        <div
          className={`absolute right-3 top-3 flex flex-col gap-2 transition-all duration-300 ${hovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"}`}
        >
          <button
            onClick={handleWishlist}
            className="w-9 h-9 bg-white dark:bg-brand-900 shadow-md flex items-center justify-center hover:bg-brand-50 dark:hover:bg-brand-800 transition-colors"
            aria-label={
              isWishlisted ? "Remove from wishlist" : "Add to wishlist"
            }
          >
            <Heart
              size={16}
              className={
                isWishlisted
                  ? "fill-red-500 text-red-500"
                  : "text-brand-700 dark:text-brand-200"
              }
            />
          </button>
          <button
            onClick={handleQuickView}
            className="w-9 h-9 bg-white dark:bg-brand-900 shadow-md flex items-center justify-center hover:bg-brand-50 dark:hover:bg-brand-800 transition-colors"
            aria-label="Quick view"
          >
            <Eye size={16} className="text-brand-700 dark:text-brand-200" />
          </button>
        </div>

        {/* Add to bag */}
        <div
          className={`absolute bottom-0 left-0 right-0 transition-all duration-300 ${hovered ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"}`}
        >
          <button
            onClick={handleAddToCart}
            className="w-full bg-white/95 dark:bg-brand-900/95 backdrop-blur-sm py-3 text-xs tracking-widest uppercase text-brand-900 dark:text-white hover:bg-brand-900 hover:text-white dark:hover:bg-white dark:hover:text-brand-900 transition-colors flex items-center justify-center gap-2"
          >
            <ShoppingBag size={14} />
            Add to Bag
          </button>
        </div>

        {/* Image dots */}
        {product.images?.length > 1 && (
          <div className="absolute bottom-12 left-0 right-0 flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {product.images.slice(0, 4).map((_, i) => (
              <button
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === imgIdx ? "bg-white w-4" : "bg-white/60"}`}
                onClick={(e) => {
                  e.preventDefault();
                  setImgIdx(i);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="pt-4 pb-2 px-1">
        {product.category && (
          <p className="label-small text-brand-400 dark:text-brand-500 mb-1">
            {product.category.name}
          </p>
        )}
        <h3 className="font-sans text-sm font-medium text-brand-900 dark:text-white leading-snug mb-1.5 group-hover:text-brand-600 transition-colors line-clamp-2">
          {product.name}
        </h3>

        {/* Rating */}
        {product.avgRating && product.avgRating > 0 ? (
          <div className="flex items-center gap-1 mb-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={11}
                className={
                  i < Math.round(product.avgRating!)
                    ? "rating-star fill-current"
                    : "rating-star-empty"
                }
              />
            ))}
            {product.reviewCount ? (
              <span className="text-[10px] text-brand-400 ml-1">
                ({product.reviewCount})
              </span>
            ) : null}
          </div>
        ) : null}

        {/* Price */}
        <div className="flex items-center gap-2">
          <span className="price text-sm">
            {formatEGP(Number(product.price || 0))}
          </span>
          {product.comparePrice && (
            <span className="price-compare">
              {formatEGP(Number(product.comparePrice || 0))}
            </span>
          )}
        </div>
        {/* Color swatches */}
        {product.variants?.some((v) => v.colorHex) && (
          <div className="flex gap-1 mt-2">
            {[
              ...new Map(
                product.variants
                  .filter((v) => v.colorHex)
                  .map((v) => [v.color, v]),
              ).values(),
            ]
              .slice(0, 6)
              .map((v) => (
                <div
                  key={v.color}
                  className="w-3.5 h-3.5 rounded-full border border-brand-200 dark:border-brand-700"
                  style={{ backgroundColor: v.colorHex! }}
                  title={v.color!}
                />
              ))}
          </div>
        )}
      </div>
    </Link>
  );
}
