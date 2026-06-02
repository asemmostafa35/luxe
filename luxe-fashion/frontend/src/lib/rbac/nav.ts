import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  BarChart3,
  ShoppingBag,
  Package,
  Grid3X3,
  Tag,
  Users,
  Star,
  Image,
  Settings,
} from "lucide-react";
import { Permission, hasPermission } from "./permissions";

export interface AdminNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  permission: Permission;
  exact?: boolean;
}

export const ADMIN_NAV: AdminNavItem[] = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
    permission: "dashboard:read",
    exact: true,
  },
  {
    href: "/admin/analytics",
    label: "Analytics",
    icon: BarChart3,
    permission: "analytics:read",
  },
  {
    href: "/admin/orders",
    label: "Orders",
    icon: ShoppingBag,
    permission: "orders:read",
  },
  {
    href: "/admin/products",
    label: "Products",
    icon: Package,
    permission: "products:read",
  },
  {
    href: "/admin/categories",
    label: "Categories",
    icon: Grid3X3,
    permission: "categories:read",
  },
  {
    href: "/admin/inventory",
    label: "Inventory",
    icon: Tag,
    permission: "inventory:read",
  },
  {
    href: "/admin/customers",
    label: "Customers",
    icon: Users,
    permission: "customers:read",
  },
  {
    href: "/admin/coupons",
    label: "Coupons",
    icon: Tag,
    permission: "coupons:read",
  },
  {
    href: "/admin/reviews",
    label: "Reviews",
    icon: Star,
    permission: "reviews:read",
  },
  {
    href: "/admin/banners",
    label: "Banners",
    icon: Image,
    permission: "banners:read",
  },
  {
    href: "/admin/settings",
    label: "Settings",
    icon: Settings,
    permission: "settings:read",
  },
];

/** VIEWER sees Analytics only; all other staff see items matching their permissions. */
export function getNavForRole(role: string): AdminNavItem[] {
  if (role === "VIEWER") {
    return ADMIN_NAV.filter((item) => item.href === "/admin/analytics");
  }
  return ADMIN_NAV.filter((item) => hasPermission(role, item.permission));
}
