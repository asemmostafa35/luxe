import type { Metadata } from "next";
import { Suspense } from "react";
import ShopClient from "@/app/shop/ShopClient";

export const metadata: Metadata = {
  title: "Best Sellers — ZANE",
  description: "Our most-loved pieces, chosen by the community.",
};

export default function BestSellersPage() {
  return (
    <div>
      <div className="max-w-screen-2xl mx-auto px-4 md:px-8 pt-10 pb-2">
        <p className="label-small text-brand-500 mb-2">Community Favourites</p>
        <h1 className="font-serif text-4xl md:text-5xl font-light text-brand-900 dark:text-white">
          Best Sellers
        </h1>
      </div>
      <Suspense fallback={null}>
        <ShopClient defaultIsBest />
      </Suspense>
    </div>
  );
}
