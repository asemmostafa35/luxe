'use client';
import { X, Sun, Moon, User, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useAuth } from '@/components/providers/AuthProvider';
import { useEffect } from 'react';

interface NavLink { label: string; href: string; children?: { label: string; href: string }[] }
export default function MobileMenu({ onClose, links }: { onClose: () => void; links: NavLink[] }) {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative ml-auto w-80 h-full bg-white dark:bg-brand-950 shadow-2xl animate-slide-in-right flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-brand-100 dark:border-brand-800">
          <span className="font-serif text-xl tracking-widest uppercase">Menu</span>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        <nav className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-1">
            {links.map(l => (
              <div key={l.label}>
                <Link href={l.href} onClick={onClose}
                  className="flex items-center justify-between py-3 text-sm tracking-widest uppercase text-brand-700 dark:text-brand-200 hover:text-brand-900 dark:hover:text-white transition-colors border-b border-brand-100 dark:border-brand-800">
                  {l.label} <ChevronRight size={14} />
                </Link>
                {l.children && (
                  <div className="pl-4 space-y-1 mt-1 mb-2">
                    {l.children.map(c => (
                      <Link key={c.label} href={c.href} onClick={onClose}
                        className="block py-2 text-sm text-brand-500 dark:text-brand-400 hover:text-brand-900 dark:hover:text-white transition-colors">
                        {c.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 space-y-4">
            {user ? (
              <>
                <Link href="/profile" onClick={onClose} className="flex items-center gap-3 text-sm text-brand-700 dark:text-brand-200">
                  <User size={16} /> {user.firstName} {user.lastName}
                </Link>
                <button onClick={() => { logout(); onClose(); }} className="text-sm text-red-500 hover:text-red-700 transition-colors">
                  Sign Out
                </button>
              </>
            ) : (
              <div className="space-y-3">
                <Link href="/auth/login" onClick={onClose} className="block btn-primary text-center text-xs">Sign In</Link>
                <Link href="/auth/register" onClick={onClose} className="block btn-outline text-center text-xs">Create Account</Link>
              </div>
            )}
          </div>
        </nav>

        <div className="px-6 py-4 border-t border-brand-100 dark:border-brand-800">
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex items-center gap-2 text-sm text-brand-500 hover:text-brand-900 dark:hover:text-white transition-colors">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </div>
    </div>
  );
}
