import type { Metadata } from 'next';
import HeroSection from '@/components/home/HeroSection';
import CategoriesGrid from '@/components/home/CategoriesGrid';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import NewArrivalsStrip from '@/components/home/NewArrivalsStrip';
import BestSellersSection from '@/components/home/BestSellersSection';
import BrandValues from '@/components/home/BrandValues';
import InstagramFeed from '@/components/home/InstagramFeed';

export const metadata: Metadata = {
  title: 'Luxe Fashion — Premium Contemporary Clothing',
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <CategoriesGrid />
      <FeaturedProducts />
      <NewArrivalsStrip />
      <BestSellersSection />
      <BrandValues />
      <InstagramFeed />
    </>
  );
}
