'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { ShoppingBag, Heart, User, Search, Menu, X, Sun, Moon, ChevronDown } from 'lucide-react';
import { useCartStore, useWishlistStore, useUIStore } from '@/store';
import SearchOverlay from './SearchOverlay';
import MobileMenu from './MobileMenu';
import Logo from './Logo';

const navLinks = [
  { label: 'Shop', href: '/shop', children: [
    { label: 'New Arrivals', href: '/new-arrivals' },
    { label: 'Best Sellers', href: '/best-sellers' },
    { label: 'All Products', href: '/shop' },
  ]},
  { label: 'Categories', href: '/category' },
  { label: 'New Arrivals', href: '/new-arrivals' },
  { label: 'Best Sellers', href: '/best-sellers' },
  { label: 'About', href: '/about' },
];

export default function Navbar() {
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const { theme, setTheme } = useTheme();
  const cartCount = useCartStore((s) => s.count());
  const wishlistCount = useWishlistStore((s) => s.items.length);
  const { toggleSearch, searchOpen } = useUIStore();
  const dropdownTimer = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleDropdownEnter = (label: string) => {
    clearTimeout(dropdownTimer.current);
    setActiveDropdown(label);
  };

  const handleDropdownLeave = () => {
    dropdownTimer.current = setTimeout(() => setActiveDropdown(null), 150);
  };

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-400
        ${scrolled
          ? 'bg-white/95 dark:bg-brand-950/95 backdrop-blur-md shadow-sm py-3'
          : 'bg-white dark:bg-brand-950 py-5'
        }`}>
        <nav className="max-w-screen-2xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="hover:opacity-70 transition-opacity">
              <Logo />
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-10">
              {navLinks.map((link) => (
                <div
                  key={link.label}
                  className="relative"
                  onMouseEnter={() => link.children && handleDropdownEnter(link.label)}
                  onMouseLeave={handleDropdownLeave}
                >
                  <Link href={link.href} className="nav-link flex items-center gap-1">
                    {link.label}
                    {link.children && <ChevronDown size={12} className={`transition-transform duration-200 ${activeDropdown === link.label ? 'rotate-180' : ''}`} />}
                  </Link>

                  {link.children && activeDropdown === link.label && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 pt-4 animate-fade-in">
                      <div className="bg-white dark:bg-brand-900 shadow-xl border border-brand-100 dark:border-brand-800 py-4 px-2 min-w-[180px]">
                        {link.children.map(child => (
                          <Link
                            key={child.label}
                            href={child.href}
                            className="block px-4 py-2.5 text-sm text-brand-700 dark:text-brand-200 hover:text-brand-900 dark:hover:text-white hover:bg-brand-50 dark:hover:bg-brand-800 transition-colors tracking-wide"
                            onClick={() => setActiveDropdown(null)}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 md:gap-4">
              <button
                onClick={toggleSearch}
                className="p-2 text-brand-700 dark:text-brand-200 hover:text-brand-900 dark:hover:text-white transition-colors"
                aria-label="Search"
              >
                <Search size={20} />
              </button>

              <Link href="/profile/wishlist" className="relative p-2 text-brand-700 dark:text-brand-200 hover:text-brand-900 dark:hover:text-white transition-colors">
                <Heart size={20} />
                {mounted && wishlistCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand-900 dark:bg-white text-white dark:text-brand-900 text-[10px] rounded-full flex items-center justify-center font-medium">
                    {wishlistCount > 9 ? '9+' : wishlistCount}
                  </span>
                )}
              </Link>

              <Link href="/profile" className="p-2 text-brand-700 dark:text-brand-200 hover:text-brand-900 dark:hover:text-white transition-colors hidden md:block">
                <User size={20} />
              </Link>

              <button
                onClick={() => useCartStore.getState().openCart()}
                className="relative p-2 text-brand-700 dark:text-brand-200 hover:text-brand-900 dark:hover:text-white transition-colors"
                aria-label="Shopping bag"
              >
                <ShoppingBag size={20} />
                {mounted && cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand-900 dark:bg-white text-white dark:text-brand-900 text-[10px] rounded-full flex items-center justify-center font-medium animate-scale-in">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 text-brand-700 dark:text-brand-200 hover:text-brand-900 dark:hover:text-white transition-colors hidden md:block"
                aria-label="Toggle theme"
              >
                {mounted && theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              <button
                onClick={() => setMobileOpen(true)}
                className="p-2 text-brand-700 dark:text-brand-200 lg:hidden"
                aria-label="Open menu"
              >
                <Menu size={22} />
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Offset for fixed header */}
      <div className="h-[72px] md:h-[88px]" />

      {searchOpen && <SearchOverlay onClose={toggleSearch} />}
      {mobileOpen && <MobileMenu onClose={() => setMobileOpen(false)} links={navLinks} />}
    </>
  );
}
