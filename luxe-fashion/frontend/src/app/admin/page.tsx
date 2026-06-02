"use client";
import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/lib/api";
import { StatCard } from "@/components/admin/AdminUI";
import {
  DollarSign,
  ShoppingBag,
  Users,
  Package,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "@/components/admin/AdminUI";
import { formatUSD } from "@/lib/currency";

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => analyticsApi.getDashboard(),
    refetchInterval: 30_000,
  });
  const d = data?.data;

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-2xl font-light tracking-tight"
          style={{ color: "var(--admin-fg)" }}
        >
          Dashboard
        </h1>
        <p className="text-sm admin-muted mt-1">Store overview at a glance</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={
            isLoading
              ? "—"
              : formatUSD(Number(d?.overview?.totalRevenue || 0))
          }
          icon={<DollarSign size={16} strokeWidth={1.5} />}
        />
        <StatCard
          title="Month Revenue"
          value={
            isLoading
              ? "—"
              : formatUSD(Number(d?.overview?.monthRevenue || 0))
          }
          change={
            d?.overview?.monthGrowth
              ? Number(d.overview.monthGrowth)
              : undefined
          }
          icon={<TrendingUp size={16} strokeWidth={1.5} />}
        />
        <StatCard
          title="Total Orders"
          value={d?.overview?.totalOrders || 0}
          icon={<ShoppingBag size={16} strokeWidth={1.5} />}
        />
        <StatCard
          title="Total Customers"
          value={d?.overview?.totalCustomers || 0}
          icon={<Users size={16} strokeWidth={1.5} />}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Month Orders"
          value={d?.overview?.monthOrders || 0}
          icon={<Package size={16} strokeWidth={1.5} />}
        />
        <StatCard
          title="Pending Orders"
          value={d?.overview?.pendingOrders || 0}
          icon={<ShoppingBag size={16} strokeWidth={1.5} />}
        />
        <StatCard
          title="New Customers"
          value={d?.overview?.newCustomers || 0}
          icon={<Users size={16} strokeWidth={1.5} />}
        />
        <StatCard
          title="Low Stock SKUs"
          value={d?.overview?.lowStockVariants || 0}
          icon={<AlertTriangle size={16} strokeWidth={1.5} />}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="admin-card lg:col-span-2 overflow-hidden">
          <div
            className="flex items-center justify-between px-5 py-4 border-b"
            style={{ borderColor: "var(--admin-border)" }}
          >
            <h2
              className="font-medium text-sm"
              style={{ color: "var(--admin-fg)" }}
            >
              Recent Orders
            </h2>
            <Link
              href="/admin/orders"
              className="text-xs admin-muted hover:opacity-70 transition-opacity"
            >
              View All →
            </Link>
          </div>
          <div>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="px-5 py-3 flex gap-3 border-b"
                  style={{ borderColor: "var(--admin-border)" }}
                >
                  <div className="flex-1 h-4 admin-skeleton" />
                  <div className="w-20 h-4 admin-skeleton" />
                  <div className="w-16 h-4 admin-skeleton" />
                </div>
              ))}
            {d?.recentOrders?.map((order: any) => (
              <Link
                key={order.id}
                href={`/admin/orders?id=${order.id}`}
                className="flex items-center gap-4 px-5 py-3 border-b transition-colors hover:opacity-90"
                style={{ borderColor: "var(--admin-border)" }}
              >
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{ color: "var(--admin-fg)" }}
                  >
                    {order.orderNumber}
                  </p>
                  <p className="text-xs admin-muted truncate">
                    {order.user
                      ? `${order.user.firstName} ${order.user.lastName}`
                      : order.guestEmail}
                  </p>
                </div>
                <StatusBadge status={order.status} />
                <p
                  className="text-sm font-medium flex-shrink-0 tabular-nums"
                  style={{ color: "var(--admin-fg)" }}
                >
                  {formatUSD(Number(order.total))}
                </p>
                <p className="text-xs admin-muted flex-shrink-0 hidden md:block">
                  {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        </div>

        <div className="admin-card overflow-hidden">
          <div
            className="flex items-center justify-between px-5 py-4 border-b"
            style={{ borderColor: "var(--admin-border)" }}
          >
            <h2
              className="font-medium text-sm"
              style={{ color: "var(--admin-fg)" }}
            >
              Top Products
            </h2>
            <Link
              href="/admin/products"
              className="text-xs admin-muted hover:opacity-70 transition-opacity"
            >
              View All →
            </Link>
          </div>
          <div>
            {d?.topProducts?.map((p: any, i: number) => (
              <div
                key={p.id}
                className="flex items-center gap-3 px-5 py-3 border-b"
                style={{ borderColor: "var(--admin-border)" }}
              >
                <span className="text-xs admin-muted w-4 flex-shrink-0">
                  {i + 1}
                </span>
                <div
                  className="w-8 h-10 flex-shrink-0 overflow-hidden border"
                  style={{ borderColor: "var(--admin-border)" }}
                >
                  {p.images?.[0] && (
                    <img
                      src={p.images[0].url}
                      alt={p.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-xs font-medium truncate"
                    style={{ color: "var(--admin-fg)" }}
                  >
                    {p.name}
                  </p>
                  <p className="text-xs admin-muted">{p.totalSold} sold</p>
                </div>
                <p
                  className="text-xs font-medium flex-shrink-0 tabular-nums"
                  style={{ color: "var(--admin-fg)" }}
                >
                  {formatUSD(Number(p.price))}
                </p>
              </div>
            ))}
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-3 px-5 py-3">
                  <div className="w-8 h-10 admin-skeleton flex-shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 admin-skeleton w-3/4" />
                    <div className="h-3 admin-skeleton w-1/3" />
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {d?.ordersByStatus && (
        <div className="admin-card p-5">
          <h2
            className="font-medium text-sm mb-4"
            style={{ color: "var(--admin-fg)" }}
          >
            Orders by Status
          </h2>
          <div className="flex flex-wrap gap-3">
            {Object.entries(d.ordersByStatus).map(
              ([status, count]: [string, any]) => (
                <div key={status} className="flex items-center gap-2">
                  <StatusBadge status={status} />
                  <span
                    className="text-sm font-medium tabular-nums"
                    style={{ color: "var(--admin-fg)" }}
                  >
                    {count}
                  </span>
                </div>
              ),
            )}
          </div>
        </div>
      )}
    </div>
  );
}
