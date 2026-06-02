"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Menu, X, LogOut, ExternalLink } from "lucide-react";
import { getNavForRole } from "@/lib/rbac/nav";
import {
  getDefaultAdminLanding,
  isStaffRole,
} from "@/lib/rbac/permissions";
import { AdminRouteGuard } from "@/components/admin/AdminRouteGuard";
import { AdminThemeToggle } from "@/components/admin/AdminThemeToggle";
import { AdminLoader } from "@/components/admin/AdminLoader";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = user ? getNavForRole(user.role) : [];

  useEffect(() => {
    if (!loading && (!user || !isStaffRole(user.role))) {
      router.replace("/auth/login?redirect=/admin");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="admin-shell fixed inset-0 z-50 flex items-center justify-center">
        <AdminLoader size="lg" />
      </div>
    );
  }

  if (!user || !isStaffRole(user.role)) return null;

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const Sidebar = () => (
    <div
      className="flex flex-col h-full border-r"
      style={{
        backgroundColor: "var(--admin-surface)",
        borderColor: "var(--admin-border)",
        color: "var(--admin-fg)",
      }}
    >
      <div
        className="px-5 py-6 border-b flex items-center justify-between"
        style={{ borderColor: "var(--admin-border)" }}
      >
        <Link
          href={getDefaultAdminLanding(user.role)}
          className="block"
          onClick={() => setSidebarOpen(false)}
        >
          <span className="text-[10px] uppercase tracking-[0.35em] admin-muted block mb-1">
            ZANE
          </span>
          <span className="text-lg font-light tracking-[0.28em] uppercase">
            Admin
          </span>
        </Link>
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-1 transition-opacity hover:opacity-60"
          type="button"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>
      <nav className="admin-scroll flex-1 px-3 py-5 overflow-y-auto space-y-0.5">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 text-sm transition-colors"
              style={
                active
                  ? {
                      backgroundColor: "var(--admin-active-bg)",
                      color: "var(--admin-active-fg)",
                    }
                  : { color: "var(--admin-fg)" }
              }
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.backgroundColor = "var(--admin-hover)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.backgroundColor = "transparent";
                }
              }}
            >
              <Icon size={16} className="flex-shrink-0" strokeWidth={1.5} />
              {label}
              {active && (
                <ChevronRight size={12} className="ml-auto opacity-70" />
              )}
            </Link>
          );
        })}
      </nav>
      <div
        className="px-3 py-4 border-t space-y-1"
        style={{ borderColor: "var(--admin-border)" }}
      >
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 px-3 py-2 text-sm transition-colors hover:opacity-70"
        >
          <ExternalLink size={14} strokeWidth={1.5} />
          View Store
        </Link>
        <button
          onClick={logout}
          type="button"
          className="flex items-center gap-3 px-3 py-2 text-sm transition-colors w-full hover:opacity-70"
        >
          <LogOut size={14} strokeWidth={1.5} />
          Sign Out
        </button>
      </div>
    </div>
  );

  const activeLabel =
    navItems.find((n) => isActive(n.href, n.exact))?.label || "Admin";

  return (
    <div className="admin-shell fixed inset-0 z-50 flex h-screen overflow-hidden">
      <aside className="hidden lg:flex flex-col w-56 flex-shrink-0 h-full">
        <Sidebar />
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden flex">
          <div
            className="absolute inset-0 bg-black/40 dark:bg-white/10"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative w-56 h-full shadow-none">
            <Sidebar />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header
          className="flex items-center justify-between flex-shrink-0 px-4 md:px-6 py-3 border-b"
          style={{
            backgroundColor: "var(--admin-surface)",
            borderColor: "var(--admin-border)",
            color: "var(--admin-fg)",
          }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1 transition-opacity hover:opacity-60"
              type="button"
              aria-label="Open menu"
            >
              <Menu size={20} strokeWidth={1.5} />
            </button>
            <h1 className="text-sm font-medium tracking-wide hidden sm:block">
              {activeLabel}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="hidden sm:inline text-[10px] uppercase tracking-widest px-2 py-1 border"
              style={{ borderColor: "var(--admin-border)" }}
            >
              {user.role.replace("_", " ")}
            </span>
            <AdminThemeToggle />
            <div
              className="w-8 h-8 flex items-center justify-center text-xs font-medium border"
              style={{
                borderColor: "var(--admin-border)",
                backgroundColor: "var(--admin-active-bg)",
                color: "var(--admin-active-fg)",
              }}
            >
              {user.firstName.charAt(0)}
            </div>
          </div>
        </header>

        <main className="admin-scroll flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
