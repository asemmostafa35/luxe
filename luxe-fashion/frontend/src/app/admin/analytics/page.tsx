'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api';
import { AdminPageHeader, StatCard } from '@/components/admin/AdminUI';
import { DollarSign, ShoppingBag, TrendingUp, Users } from 'lucide-react';

export default function AdminAnalyticsPage() {
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day');
  const [from, setFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0];
  });
  const [to, setTo] = useState(() => new Date().toISOString().split('T')[0]);

  const { data: dash } = useQuery({ queryKey: ['admin-dashboard'], queryFn: () => analyticsApi.getDashboard() });
  const { data: sales, isLoading } = useQuery({
    queryKey: ['admin-sales', from, to, groupBy],
    queryFn: () => analyticsApi.getSalesReport({ from, to, groupBy }),
  });

  const d = dash?.data;
  const salesData: any[] = sales?.data || [];

  const maxRevenue = Math.max(...salesData.map((s: any) => Number(s.revenue)), 1);

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Analytics" subtitle="Sales performance and trends" />

      {/* Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Revenue" value={d?.overview?.totalRevenue ? `${Number(d.overview.totalRevenue).toFixed(2)}` : '0.00'} prefix="$" icon={<DollarSign size={16} />} />
        <StatCard title="Total Orders" value={d?.overview?.totalOrders || 0} icon={<ShoppingBag size={16} />} />
        <StatCard title="Total Customers" value={d?.overview?.totalCustomers || 0} icon={<Users size={16} />} />
        <StatCard title="Month Growth" value={`${d?.overview?.monthGrowth || 0}%`} icon={<TrendingUp size={16} />} color="bg-green-700" />
      </div>

      {/* Revenue chart */}
      <div className="bg-white dark:bg-brand-950 border border-brand-100 dark:border-brand-800 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h2 className="font-medium text-sm text-brand-900 dark:text-white">Revenue Over Time</h2>
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex gap-1">
              {(['day','week','month'] as const).map(g => (
                <button key={g} onClick={() => setGroupBy(g)}
                  className={`px-3 py-1.5 text-xs border transition-colors ${groupBy === g ? 'bg-brand-900 dark:bg-white text-white dark:text-brand-900 border-brand-900 dark:border-white' : 'border-brand-200 dark:border-brand-700 text-brand-500 hover:border-brand-900 dark:hover:border-white'}`}>
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex gap-2 items-center text-xs text-brand-500">
              <input type="date" value={from} onChange={e => setFrom(e.target.value)}
                className="border border-brand-200 dark:border-brand-700 px-2 py-1 bg-white dark:bg-brand-950 text-brand-700 dark:text-brand-300 focus:outline-none" />
              <span>to</span>
              <input type="date" value={to} onChange={e => setTo(e.target.value)}
                className="border border-brand-200 dark:border-brand-700 px-2 py-1 bg-white dark:bg-brand-950 text-brand-700 dark:text-brand-300 focus:outline-none" />
            </div>
          </div>
        </div>

        {/* Bar chart */}
        {isLoading ? (
          <div className="h-48 flex items-end gap-1">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="flex-1 skeleton" style={{ height: `${Math.random() * 100}%` }} />
            ))}
          </div>
        ) : salesData.length === 0 ? (
          <div className="h-48 flex items-center justify-center">
            <p className="text-sm text-brand-500">No data for selected period</p>
          </div>
        ) : (
          <div>
            <div className="flex items-end gap-1 h-48">
              {salesData.map((s: any, i: number) => {
                const pct = (Number(s.revenue) / maxRevenue) * 100;
                return (
                  <div key={i} className="flex-1 group relative flex flex-col justify-end">
                    <div className="bg-brand-900 dark:bg-white opacity-80 group-hover:opacity-100 transition-opacity rounded-t-sm"
                      style={{ height: `${Math.max(pct, 2)}%` }} />
                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-brand-900 dark:bg-white text-white dark:text-brand-900 text-[10px] px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                      ${Number(s.revenue).toFixed(0)} · {s.orders} orders
                    </div>
                  </div>
                );
              })}
            </div>
            {/* X-axis labels */}
            <div className="flex gap-1 mt-2">
              {salesData.map((s: any, i: number) => (
                <div key={i} className="flex-1 text-center">
                  {(i === 0 || i === Math.floor(salesData.length / 2) || i === salesData.length - 1) && (
                    <p className="text-[9px] text-brand-400 truncate">
                      {new Date(s.period).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Summary table */}
      {salesData.length > 0 && (
        <div className="bg-white dark:bg-brand-950 border border-brand-100 dark:border-brand-800">
          <div className="px-5 py-4 border-b border-brand-100 dark:border-brand-800">
            <h2 className="font-medium text-sm text-brand-900 dark:text-white">Period Summary</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-brand-100 dark:border-brand-800">
                  {['Period','Revenue','Orders','Avg. Order','Discounts'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs tracking-widest uppercase text-brand-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {salesData.slice(-10).map((s: any, i: number) => (
                  <tr key={i} className="border-b border-brand-50 dark:border-brand-900 hover:bg-brand-50 dark:hover:bg-brand-900/40 transition-colors">
                    <td className="px-4 py-3 text-sm text-brand-700 dark:text-brand-300">{new Date(s.period).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-sm font-medium text-brand-900 dark:text-white">${Number(s.revenue).toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-brand-700 dark:text-brand-300">{s.orders}</td>
                    <td className="px-4 py-3 text-sm text-brand-700 dark:text-brand-300">${Number(s.avg_order_value).toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-brand-700 dark:text-brand-300">${Number(s.discounts || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-brand-200 dark:border-brand-700 bg-brand-50 dark:bg-brand-900/30">
                  <td className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-brand-500">Total</td>
                  <td className="px-4 py-3 text-sm font-bold text-brand-900 dark:text-white">
                    ${salesData.reduce((s: number, r: any) => s + Number(r.revenue), 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-brand-900 dark:text-white">
                    {salesData.reduce((s: number, r: any) => s + Number(r.orders), 0)}
                  </td>
                  <td className="px-4 py-3 text-sm text-brand-500">—</td>
                  <td className="px-4 py-3 text-sm font-bold text-brand-900 dark:text-white">
                    ${salesData.reduce((s: number, r: any) => s + Number(r.discounts || 0), 0).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Orders by status */}
      {d?.ordersByStatus && (
        <div className="bg-white dark:bg-brand-950 border border-brand-100 dark:border-brand-800 p-5">
          <h2 className="font-medium text-sm text-brand-900 dark:text-white mb-4">Order Status Breakdown</h2>
          <div className="space-y-2">
            {Object.entries(d.ordersByStatus).map(([status, count]: [string, any]) => {
              const total = Object.values(d.ordersByStatus).reduce((a: number, b: any) => a + Number(b), 0);
              const pct = total > 0 ? (Number(count) / total) * 100 : 0;
              return (
                <div key={status} className="flex items-center gap-3">
                  <p className="text-xs w-24 text-brand-600 dark:text-brand-400">{status}</p>
                  <div className="flex-1 h-2 bg-brand-100 dark:bg-brand-800">
                    <div className="h-full bg-brand-900 dark:bg-white transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs font-medium text-brand-900 dark:text-white w-8 text-right">{count}</p>
                  <p className="text-xs text-brand-400 w-10 text-right">{pct.toFixed(1)}%</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
