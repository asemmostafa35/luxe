"use client";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { productsApi, reviewsApi } from "@/lib/api";
import Image from "next/image";
import Link from "next/link";
import {
  ShoppingBag, Heart, Star, Minus, Plus,
  ChevronDown, ChevronUp, Check,
} from "lucide-react";
import { useCartStore, useWishlistStore } from "@/store";
import ProductCard from "@/components/shop/ProductCard";
import toast from "react-hot-toast";
import { useAuth } from "@/components/providers/AuthProvider";
import { formatEGP } from "@/lib/currency";
import { getFriendlyColorName } from "@/lib/colorUtils";

export default function ProductDetailClient({ slug }: { slug: string }) {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => productsApi.getOne(slug),
  });

  const [mainImg, setMainImg] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [openAccordion, setOpenAccordion] = useState<string | null>("details");
  const [reviewBody, setReviewBody] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const { addItem } = useCartStore();
  const wishlist = useWishlistStore();

  const product = data?.data?.product;
  const related = data?.data?.related;

  const selectedVariant = product?.variants?.find(
    (v: any) =>
      (!selectedSize || v.size === selectedSize) &&
      (!selectedColor || v.color === selectedColor),
  );

  const hasVariants = (product?.variants?.length ?? 0) > 0;
  const maxQuantity = !product
    ? 0
    : !hasVariants
      ? 99
      : selectedVariant
        ? Math.max(0, Number(selectedVariant.stock) || 0)
        : 0;

  // ── Color-linked images ───────────────────────────────────────────────────
  // When a color is selected, show images tagged with that colorHex first.
  // Falls back to all images if none are tagged.
  const allImages: any[] = product?.images ?? [];

  const displayImages = (() => {
    if (!selectedColor) return allImages;
    const selectedVariantData = product?.variants?.find(
      (v: any) => v.color === selectedColor
    );
    const hex = selectedVariantData?.colorHex;
    if (!hex) return allImages;
    const colorImages = allImages.filter(
      (img: any) => img.colorHex && img.colorHex.toUpperCase() === hex.toUpperCase()
    );
    return colorImages.length > 0 ? colorImages : allImages;
  })();

  // Reset mainImg when color changes
  useEffect(() => {
    setMainImg(0);
  }, [selectedColor]);

  useEffect(() => {
    if (!product || maxQuantity <= 0) return;
    setQuantity((q) => Math.min(Math.max(1, q), maxQuantity));
  }, [product?.id, selectedVariant?.id, maxQuantity]);

  if (isLoading) return <ProductDetailSkeleton />;
  if (!product) return <div className="p-16 text-center">Product not found</div>;

  const p = product;
  const price = Number(p.price);
  const comparePrice = p.comparePrice ? Number(p.comparePrice) : null;
  const discount = comparePrice ? Math.round((1 - price / comparePrice) * 100) : 0;
  const isWishlisted = wishlist.has(p.id);

  const sizes = [...new Set(p.variants?.filter((v: any) => v.size).map((v: any) => v.size))];
  const colors = [
    ...new Map(
      p.variants
        ?.filter((v: any) => v.color)
        .map((v: any) => [
          v.color,
          {
            ...v,
            colorHex:
              v.colorHex && String(v.colorHex).trim() !== ""
                ? v.colorHex
                : v.color?.startsWith?.("#")
                  ? v.color
                  : "#6b7280",
          },
        ]),
    ).values(),
  ];

  const clampQuantity = (value: number) => {
    if (maxQuantity <= 0) return 1;
    return Math.min(Math.max(1, value), maxQuantity);
  };

  const inStock =
    maxQuantity > 0 &&
    (!hasVariants || (selectedVariant && selectedVariant.stock > 0));

  const selectedColorLabel = selectedColor
    ? getFriendlyColorName(
        selectedColor,
        selectedVariant?.colorHex ??
          (colors.find((c: any) => c.color === selectedColor) as { colorHex?: string })?.colorHex,
      )
    : "";

  const atMaxQuantity = maxQuantity > 0 && quantity >= maxQuantity;

  const handleAdd = () => {
    if (sizes.length > 0 && !selectedSize) { toast.error("Please select a size"); return; }
    if (colors.length > 0 && !selectedColor) { toast.error("Please select a color"); return; }
    if (hasVariants && !selectedVariant) { toast.error("Please select a valid size and color"); return; }
    const qty = clampQuantity(quantity);
    if (maxQuantity > 0 && qty > maxQuantity) { toast.error(`Only ${maxQuantity} available in stock`); setQuantity(maxQuantity); return; }
    addItem({
      id: p.id,
      productId: p.id,
      variantId: selectedVariant?.id,
      name: p.name,
      price,
      image: displayImages?.[0]?.url ?? p.images?.[0]?.url,
      size: selectedSize || undefined,
      color: selectedColor || undefined,
      quantity: qty,
      maxStock: maxQuantity > 0 ? maxQuantity : 1,
    });
    toast.success("Added to bag");
  };

  const handleQuantityInput = (raw: string) => {
    const parsed = parseInt(raw, 10);
    if (Number.isNaN(parsed)) { setQuantity(1); return; }
    setQuantity(clampQuantity(parsed));
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error("Please sign in to leave a review"); return; }
    setSubmittingReview(true);
    try {
      await reviewsApi.create({ productId: p.id, rating: reviewRating, title: reviewTitle, body: reviewBody });
      toast.success("Review submitted for approval");
      setReviewBody(""); setReviewTitle(""); setReviewRating(5);
    } catch { toast.error("Failed to submit review"); }
    finally { setSubmittingReview(false); }
  };

  const accordion = (id: string, label: string, content: React.ReactNode) => (
    <div className="border-t border-brand-100 dark:border-brand-800">
      <button
        onClick={() => setOpenAccordion(openAccordion === id ? null : id)}
        className="w-full flex items-center justify-between py-4 text-sm tracking-wide text-brand-900 dark:text-white font-medium"
      >
        {label}
        {openAccordion === id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {openAccordion === id && (
        <div className="pb-4 text-sm text-brand-600 dark:text-brand-400 leading-relaxed">
          {content}
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-screen-2xl mx-auto px-4 md:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-brand-400 mb-8">
        <Link href="/" className="hover:text-brand-900 dark:hover:text-white transition-colors">Home</Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-brand-900 dark:hover:text-white transition-colors">Shop</Link>
        {p.category && (
          <>
            <span>/</span>
            <Link href={`/category/${p.category.slug}`} className="hover:text-brand-900 dark:hover:text-white transition-colors">
              {p.category.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-brand-600 dark:text-brand-300">{p.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-8 xl:gap-16">
        {/* Gallery — uses displayImages (color-filtered) */}
        <div className="flex gap-3">
          <div className="flex flex-col gap-2 w-16 flex-shrink-0">
            {displayImages.map((img: any, i: number) => (
              <button
                key={i}
                onClick={() => setMainImg(i)}
                className={`relative aspect-square overflow-hidden border-2 transition-all ${
                  mainImg === i
                    ? "border-brand-900 dark:border-white"
                    : "border-transparent hover:border-brand-300"
                }`}
              >
                <Image src={img.url} alt={img.alt || p.name} fill className="object-cover" />
              </button>
            ))}
          </div>
          <div className="flex-1 relative aspect-[3/4] overflow-hidden bg-brand-50 dark:bg-brand-800">
            {displayImages[mainImg] && (
              <Image
                src={displayImages[mainImg].url}
                alt={displayImages[mainImg].alt || p.name}
                fill
                className="object-cover transition-all duration-500"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            )}
            {discount > 0 && <span className="badge-sale">-{discount}%</span>}
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-5">
          <div>
            {p.category && <p className="label-small text-brand-500 mb-2">{p.category.name}</p>}
            <h1 className="font-serif text-3xl md:text-4xl font-light text-brand-900 dark:text-white mb-3">
              {p.name}
            </h1>
            {p.avgRating > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_: any, i: number) => (
                    <Star key={i} size={14} className={i < Math.round(Number(p.avgRating)) ? "fill-gold-500 text-gold-500" : "text-brand-200 dark:text-brand-700"} />
                  ))}
                </div>
                <span className="text-sm text-brand-500">
                  {Number(p.avgRating).toFixed(1)} ({p._count?.reviews || p.reviews?.length || 0} reviews)
                </span>
              </div>
            )}
            <div className="flex items-center gap-4">
              <span className="font-serif text-3xl font-light text-brand-900 dark:text-white">{formatEGP(price)}</span>
              {comparePrice && <span className="text-lg text-brand-400 line-through">{formatEGP(comparePrice)}</span>}
              {discount > 0 && <span className="text-sm text-red-600 font-medium">Save {discount}%</span>}
            </div>
          </div>

          {/* Colors */}
          {colors.length > 0 && (
            <div>
              <p className="text-xs tracking-widest uppercase text-brand-500 mb-3">
                Color
                {selectedColorLabel && (
                  <span className="text-brand-900 dark:text-white ml-1 normal-case font-normal">
                    : {selectedColorLabel}
                  </span>
                )}
              </p>
              <div className="flex gap-2 flex-wrap">
                {colors.map((v: any) => {
                  const isActive = selectedColor === v.color;
                  const label = getFriendlyColorName(v.color, v.colorHex);
                  // Count how many images are linked to this color
                  const colorImgCount = allImages.filter(
                    (img: any) => img.colorHex && img.colorHex.toUpperCase() === v.colorHex?.toUpperCase()
                  ).length;
                  return (
                    <button
                      key={v.color}
                      type="button"
                      onClick={() => setSelectedColor(isActive ? null : v.color)}
                      title={`${label}${colorImgCount > 0 ? ` (${colorImgCount} photos)` : ""}`}
                      aria-label={`Color ${label}`}
                      aria-pressed={isActive}
                      className={`w-9 h-9 rounded-full border-2 transition-all relative ${
                        isActive
                          ? "border-brand-900 dark:border-white ring-2 ring-brand-900 dark:ring-white ring-offset-2 ring-offset-white dark:ring-offset-brand-950 scale-105"
                          : "border-brand-200 dark:border-brand-600 hover:scale-105"
                      }`}
                      style={{ backgroundColor: v.colorHex || "#999" }}
                    >
                      {isActive && (
                        <Check
                          size={12}
                          className="absolute inset-0 m-auto drop-shadow"
                          style={{
                            color: v.colorHex?.toUpperCase() === "#FFFFFF" || v.colorHex?.toUpperCase() === "#F5F5F0"
                              ? "#201610" : "#ffffff",
                          }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sizes */}
          {sizes.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs tracking-widest uppercase text-brand-500">
                  Size{selectedSize && <span className="text-brand-900 dark:text-white ml-1">: {selectedSize}</span>}
                </p>
                <button className="text-xs text-brand-500 underline hover:text-brand-900 dark:hover:text-white transition-colors">
                  Size Guide
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s: any) => {
                  const v = p.variants?.find((variant: any) => variant.size === s && (!selectedColor || variant.color === selectedColor));
                  const outOfStock = v ? v.stock === 0 : false;
                  return (
                    <button
                      key={s}
                      onClick={() => !outOfStock && setSelectedSize(s)}
                      disabled={outOfStock}
                      className={`min-w-[48px] h-10 px-3 text-sm border transition-all relative ${
                        selectedSize === s
                          ? "bg-brand-900 dark:bg-white text-white dark:text-brand-900 border-brand-900 dark:border-white"
                          : outOfStock
                            ? "border-brand-100 dark:border-brand-800 text-brand-300 dark:text-brand-600 cursor-not-allowed"
                            : "border-brand-200 dark:border-brand-700 hover:border-brand-900 dark:hover:border-white"
                      }`}
                    >
                      {s}
                      {outOfStock && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className="w-full h-px bg-brand-300 dark:bg-brand-600 absolute rotate-45 transform" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity + Add */}
          <div className="flex gap-3">
            <div className="flex items-center border border-brand-200 dark:border-brand-700">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="w-11 h-11 flex items-center justify-center text-brand-500 hover:text-brand-900 dark:hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Minus size={14} />
              </button>
              <input
                type="number"
                min={1}
                max={maxQuantity > 0 ? maxQuantity : 1}
                value={quantity}
                onChange={(e) => handleQuantityInput(e.target.value)}
                onBlur={() => setQuantity((q) => clampQuantity(q))}
                className="w-12 text-center text-sm font-medium bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                aria-label="Quantity"
              />
              <button
                type="button"
                onClick={() => setQuantity((q) => clampQuantity(q + 1))}
                disabled={!inStock || atMaxQuantity}
                className="w-11 h-11 flex items-center justify-center text-brand-500 hover:text-brand-900 dark:hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Plus size={14} />
              </button>
            </div>
            <button
              type="button"
              onClick={handleAdd}
              disabled={!inStock || (hasVariants && maxQuantity === 0)}
              className="flex-1 btn-primary flex items-center justify-center gap-2 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ShoppingBag size={15} />
              {inStock ? "Add to Bag" : "Out of Stock"}
            </button>
            <button
              onClick={() => wishlist.toggle({ productId: p.id, name: p.name, price, image: displayImages?.[0]?.url ?? p.images?.[0]?.url, slug: p.slug })}
              className={`w-11 h-11 border flex items-center justify-center transition-colors ${
                isWishlisted
                  ? "border-red-300 text-red-500 bg-red-50 dark:bg-red-900/10"
                  : "border-brand-200 dark:border-brand-700 text-brand-500 hover:border-brand-900 dark:hover:border-white hover:text-brand-900 dark:hover:text-white"
              }`}
            >
              <Heart size={16} className={isWishlisted ? "fill-current" : ""} />
            </button>
          </div>

          {inStock && selectedVariant && (
            <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
              <Check size={12} /> {selectedVariant.stock} left in stock
            </p>
          )}

          {/* Accordions */}
          <div className="mt-2">
            {accordion("details", "Product Details", <p>{p.description}</p>)}
            {accordion("materials", "Materials & Care",
              <div className="space-y-1">
                {p.material && <p>Material: {p.material}</p>}
                <p>Machine wash cold, gentle cycle</p>
                <p>Do not bleach • Tumble dry low • Iron medium heat</p>
              </div>
            )}
            {accordion("shipping", "Shipping & Returns",
              <div className="space-y-1">
                <p>Flat shipping fee: 100 EGP</p>
                <p>Standard delivery 3–5 business days</p>
                <p>Express delivery available at checkout</p>
                <p>Free returns within 30 days</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-20">
        <h2 className="font-serif text-3xl font-light text-brand-900 dark:text-white mb-8">Customer Reviews</h2>
        <div className="grid lg:grid-cols-3 gap-12">
          <div>
            <div className="text-center p-8 border border-brand-100 dark:border-brand-800">
              <p className="font-serif text-6xl font-light text-brand-900 dark:text-white mb-2">
                {Number(p.avgRating).toFixed(1)}
              </p>
              <div className="flex justify-center gap-1 mb-2">
                {Array.from({ length: 5 }).map((_: any, i: number) => (
                  <Star key={i} size={16} className={i < Math.round(Number(p.avgRating)) ? "fill-gold-500 text-gold-500" : "text-brand-200 dark:text-brand-700"} />
                ))}
              </div>
              <p className="text-sm text-brand-500">{p._count?.reviews || p.reviews?.length || 0} reviews</p>
            </div>
            <form onSubmit={handleReviewSubmit} className="mt-6 space-y-4">
              <h3 className="font-serif text-xl font-light">Write a Review</h3>
              <div>
                <p className="text-xs tracking-widest uppercase text-brand-500 mb-2">Rating</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((r) => (
                    <button key={r} type="button" onClick={() => setReviewRating(r)}>
                      <Star size={20} className={r <= reviewRating ? "fill-gold-500 text-gold-500" : "text-brand-300 dark:text-brand-600"} />
                    </button>
                  ))}
                </div>
              </div>
              <input value={reviewTitle} onChange={(e) => setReviewTitle(e.target.value)} placeholder="Review title" className="input-field text-sm" />
              <textarea value={reviewBody} onChange={(e) => setReviewBody(e.target.value)} placeholder="Share your experience..." rows={4} className="input-field text-sm resize-none" required />
              <button type="submit" disabled={submittingReview} className="btn-primary w-full text-xs">
                {submittingReview ? "Submitting..." : "Submit Review"}
              </button>
            </form>
          </div>
          <div className="lg:col-span-2 space-y-6">
            {p.reviews?.length === 0 && (
              <p className="text-brand-500 text-sm py-8">No reviews yet. Be the first to review this product.</p>
            )}
            {p.reviews?.map((r: any) => (
              <div key={r.id} className="border-b border-brand-100 dark:border-brand-800 pb-6">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="flex gap-0.5 mb-1">
                      {Array.from({ length: 5 }).map((_: any, i: number) => (
                        <Star key={i} size={12} className={i < r.rating ? "fill-gold-500 text-gold-500" : "text-brand-200 dark:text-brand-700"} />
                      ))}
                    </div>
                    {r.title && <p className="font-medium text-sm text-brand-900 dark:text-white">{r.title}</p>}
                  </div>
                  <p className="text-xs text-brand-400 flex-shrink-0">{new Date(r.createdAt).toLocaleDateString()}</p>
                </div>
                <p className="text-sm text-brand-600 dark:text-brand-400 leading-relaxed">{r.body}</p>
                <p className="text-xs text-brand-400 mt-2">
                  {r.user.firstName} {r.user.lastName.charAt(0)}.
                  {r.isVerified && <span className="ml-2 text-green-600 dark:text-green-400">✓ Verified Purchase</span>}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {related?.length > 0 && (
        <section className="mt-20">
          <h2 className="font-serif text-3xl font-light text-brand-900 dark:text-white mb-8">You May Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {related.slice(0, 4).map((p: any) => (
              <ProductCard key={p.id} product={{ ...p, price: Number(p.price) }} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="max-w-screen-2xl mx-auto px-4 md:px-8 py-8">
      <div className="grid lg:grid-cols-2 gap-16">
        <div className="flex gap-3">
          <div className="flex flex-col gap-2 w-16">
            {[1, 2, 3, 4].map((i) => <div key={i} className="aspect-square skeleton" />)}
          </div>
          <div className="flex-1 aspect-[3/4] skeleton" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={`h-${i === 1 ? 4 : i === 2 ? 10 : 8} skeleton ${i === 2 ? "w-3/4" : i === 5 ? "w-full" : "w-1/2"}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
