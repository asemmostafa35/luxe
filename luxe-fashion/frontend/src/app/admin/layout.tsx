'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, ShoppingBag, Users, Tag, Star, Package,
  BarChart3, Grid3X3, Image, MessageSquare, ChevronRight,
  Menu, X, Bell, LogOut, Moon, Sun, ExternalLink
} from 'lucide-react';
import { useTheme } from 'next-themes';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/categories', label: 'Categories', icon: Grid3X3 },
  { href: '/admin/inventory', label: 'Inventory', icon: Tag },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/coupons', label: 'Coupons', icon: Tag },
  { href: '/admin/reviews', label: 'Reviews', icon: Star },
  { href: '/admin/banners', label: 'Banners', icon: Image },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role))) {
      router.replace('/auth/login?redirect=/admin');
    }
  }, [user, loading, router]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-brand-50 dark:bg-brand-950">
      <div className="w-8 h-8 border-2 border-brand-300 border-t-brand-900 dark:border-t-white rounded-full animate-spin" />
    </div>
  );
  if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) return null;

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-brand-950 dark:bg-black text-white">
      <div className="px-6 py-5 border-b border-brand-800 flex items-center justify-between">
        <Link href="/admin" className="font-serif text-xl tracking-widest uppercase">Luxe Admin</Link>
        <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-brand-400 hover:text-white"><X size={18} /></button>
      </div>
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
        {NAV.map(({ href, label, icon: Icon, exact }) => (
          <Link key={href} href={href} onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 text-sm transition-colors rounded-sm ${isActive(href, exact) ? 'bg-white/10 text-white' : 'text-brand-400 hover:text-white hover:bg-white/5'}`}>
            <Icon size={16} className="flex-shrink-0" />
            {label}
            {isActive(href, exact) && <ChevronRight size={12} className="ml-auto" />}
          </Link>
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-brand-800 space-y-2">
        <Link href="/" target="_blank"
          className="flex items-center gap-3 px-3 py-2 text-sm text-brand-400 hover:text-white transition-colors">
          <ExternalLink size={14} />View Store
        </Link>
        <button onClick={logout}
          className="flex items-center gap-3 px-3 py-2 text-sm text-brand-400 hover:text-red-400 transition-colors w-full">
          <LogOut size={14} />Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-brand-50 dark:bg-brand-900">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 flex-shrink-0"><Sidebar /></aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-56"><Sidebar /></div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="bg-white dark:bg-brand-950 border-b border-brand-100 dark:border-brand-800 px-4 md:px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-brand-500 hover:text-brand-900 dark:hover:text-white">
              <Menu size={20} />
            </button>
            <h1 className="font-medium text-brand-900 dark:text-white text-sm hidden sm:block">
              {NAV.find(n => isActive(n.href, n.exact))?.label || 'Admin'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-1.5 text-brand-500 hover:text-brand-900 dark:hover:text-white transition-colors">
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button className="p-1.5 text-brand-500 hover:text-brand-900 dark:hover:text-white transition-colors relative">
              <Bell size={16} />
            </button>
            <div className="w-7 h-7 rounded-full bg-brand-900 dark:bg-white text-white dark:text-brand-900 flex items-center justify-center text-xs font-medium">
              {user.firstName.charAt(0)}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
