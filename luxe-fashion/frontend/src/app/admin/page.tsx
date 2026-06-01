'use client';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api';
import { StatCard } from '@/components/admin/AdminUI';
import { DollarSign, ShoppingBag, Users, Package, TrendingUp, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { StatusBadge } from '@/components/admin/AdminUI';

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => analyticsApi.getDashboard(),
    refetchInterval: 30_000,
  });
  const d = data?.data;

  return (
    <div className="space-y-6">
      {/* Overview stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Revenue" value={d?.overview?.totalRevenue ? Number(d.overview.totalRevenue).toFixed(2) : '0.00'}
          prefix="$" icon={<DollarSign size={16} />} />
        <StatCard title="Month Revenue" value={d?.overview?.monthRevenue ? Number(d.overview.monthRevenue).toFixed(2) : '0.00'}
          prefix="$" change={d?.overview?.monthGrowth ? Number(d.overview.monthGrowth) : undefined}
          icon={<TrendingUp size={16} />} />
        <StatCard title="Total Orders" value={d?.overview?.totalOrders || 0}
          icon={<ShoppingBag size={16} />} />
        <StatCard title="Total Customers" value={d?.overview?.totalCustomers || 0}
          icon={<Users size={16} />} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Month Orders" value={d?.overview?.monthOrders || 0}
          icon={<Package size={16} />} />
        <StatCard title="Pending Orders" value={d?.overview?.pendingOrders || 0}
          icon={<ShoppingBag size={16} />} color="bg-yellow-600" />
        <StatCard title="New Customers" value={d?.overview?.newCustomers || 0}
          icon={<Users size={16} />} color="bg-green-700" />
        <StatCard title="Low Stock SKUs" value={d?.overview?.lowStockVariants || 0}
          icon={<AlertTriangle size={16} />} color="bg-red-700" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white dark:bg-brand-950 border border-brand-100 dark:border-brand-800">
          <div className="flex items-center justify-between px-5 py-4 border-b border-brand-100 dark:border-brand-800">
            <h2 className="font-medium text-sm text-brand-900 dark:text-white">Recent Orders</h2>
            <Link href="/admin/orders" className="text-xs text-brand-500 hover:text-brand-900 dark:hover:text-white transition-colors">View All →</Link>
          </div>
          <div className="divide-y divide-brand-50 dark:divide-brand-900">
            {isLoading && Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-5 py-3 flex gap-3">
                <div className="flex-1 h-4 skeleton" /><div className="w-20 h-4 skeleton" /><div className="w-16 h-4 skeleton" />
              </div>
            ))}
            {d?.recentOrders?.map((order: any) => (
              <Link key={order.id} href={`/admin/orders?id=${order.id}`}
                className="flex items-center gap-4 px-5 py-3 hover:bg-brand-50 dark:hover:bg-brand-900/40 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-brand-900 dark:text-white truncate">{order.orderNumber}</p>
                  <p className="text-xs text-brand-500 truncate">
                    {order.user ? `${order.user.firstName} ${order.user.lastName}` : order.guestEmail}
                  </p>
                </div>
                <StatusBadge status={order.status} />
                <p className="text-sm font-medium text-brand-900 dark:text-white flex-shrink-0">
                  ${Number(order.total).toFixed(2)}
                </p>
                <p className="text-xs text-brand-400 flex-shrink-0 hidden md:block">
                  {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white dark:bg-brand-950 border border-brand-100 dark:border-brand-800">
          <div className="flex items-center justify-between px-5 py-4 border-b border-brand-100 dark:border-brand-800">
            <h2 className="font-medium text-sm text-brand-900 dark:text-white">Top Products</h2>
            <Link href="/admin/products" className="text-xs text-brand-500 hover:text-brand-900 dark:hover:text-white transition-colors">View All →</Link>
          </div>
          <div className="divide-y divide-brand-50 dark:divide-brand-900">
            {d?.topProducts?.map((p: any, i: number) => (
              <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                <span className="text-xs text-brand-400 w-4 flex-shrink-0">{i + 1}</span>
                <div className="w-8 h-10 flex-shrink-0 overflow-hidden bg-brand-100 dark:bg-brand-800">
                  {p.images?.[0] && <img src={p.images[0].url} alt={p.name} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-brand-900 dark:text-white truncate">{p.name}</p>
                  <p className="text-xs text-brand-500">{p.totalSold} sold</p>
                </div>
                <p className="text-xs font-medium text-brand-900 dark:text-white flex-shrink-0">${Number(p.price).toFixed(0)}</p>
              </div>
            ))}
            {isLoading && Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3 px-5 py-3">
                <div className="w-8 h-10 skeleton flex-shrink-0" />
                <div className="flex-1 space-y-1"><div className="h-3 skeleton w-3/4" /><div className="h-3 skeleton w-1/3" /></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Order status breakdown */}
      {d?.ordersByStatus && (
        <div className="bg-white dark:bg-brand-950 border border-brand-100 dark:border-brand-800 p-5">
          <h2 className="font-medium text-sm text-brand-900 dark:text-white mb-4">Orders by Status</h2>
          <div className="flex flex-wrap gap-3">
            {Object.entries(d.ordersByStatus).map(([status, count]: [string, any]) => (
              <div key={status} className="flex items-center gap-2">
                <StatusBadge status={status} />
                <span className="text-sm font-medium text-brand-900 dark:text-white">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
