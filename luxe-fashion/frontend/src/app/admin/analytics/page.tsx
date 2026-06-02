"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { analyticsApi } from "@/lib/api";
import { KpiCard } from "@/components/admin/KpiCard";
import { DollarSign, ShoppingBag, TrendingUp, Users } from "lucide-react";
import { formatUSD } from "@/lib/currency";
import { AdminLoader } from "@/components/admin/AdminLoader";

const PIE_COLORS = [
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
];

const REVENUE_COLOR = "#10b981";

export default function AdminAnalyticsPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const chartStroke = isDark ? "#a3a3a3" : "#525252";
  const chartGrid = isDark ? "#262626" : "#e5e5e5";
  const chartFill = isDark ? "rgba(16, 185, 129, 0.2)" : "rgba(16, 185, 129, 0.12)";
  const pieColors = PIE_COLORS;

  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("day");
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [to, setTo] = useState(() => new Date().toISOString().split("T")[0]);

  const { data: dash, isLoading: dashLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => analyticsApi.getDashboard(),
  });
  const { data: sales, isLoading: salesLoading } = useQuery({
    queryKey: ["admin-sales", from, to, groupBy],
    queryFn: () => analyticsApi.getSalesReport({ from, to, groupBy }),
  });

  const d = dash?.data;
  const salesData: Array<{
    period: string;
    revenue: number;
    orders: number;
    avg_order_value?: number;
    discounts?: number;
  }> = sales?.data || [];

  const chartData = useMemo(
    () =>
      salesData.map((s) => ({
        period: new Date(s.period).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        revenue: Number(s.revenue),
        orders: Number(s.orders),
      })),
    [salesData],
  );

  const statusData = useMemo(() => {
    if (!d?.ordersByStatus) return [];
    return Object.entries(d.ordersByStatus).map(([name, value]) => ({
      name,
      value: Number(value),
    }));
  }, [d?.ordersByStatus]);

  const monthlyTrendData = useMemo(() => {
    const rows = d?.monthlyRevenueTrends ?? [];
    return rows.map((row: { month: string; revenue: number }) => ({
      month: row.month,
      revenue: Number(row.revenue) || 0,
    }));
  }, [d?.monthlyRevenueTrends]);

  const tooltipStyle = {
    borderRadius: 0,
    border: `1px solid ${chartStroke}`,
    backgroundColor: isDark ? "#000000" : "#ffffff",
    color: chartStroke,
    fontSize: 12,
  };

  return (
    <div className="space-y-8 max-w-[1400px]">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.25em] admin-muted mb-2">
          ZANE Admin
        </p>
        <h1
          className="text-3xl font-light tracking-tight"
          style={{ color: "var(--admin-fg)" }}
        >
          Analytics
        </h1>
        <p className="text-sm admin-muted mt-2">
          Revenue, orders, and customer performance
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          title="Revenue"
          accent="#10b981"
          value={
            dashLoading
              ? "—"
              : formatUSD(Number(d?.overview?.totalRevenue || 0))
          }
          icon={<DollarSign size={18} strokeWidth={1.5} />}
          change={
            d?.overview?.monthGrowth
              ? Number(d.overview.monthGrowth)
              : undefined
          }
        />
        <KpiCard
          title="Orders"
          accent="#3b82f6"
          value={dashLoading ? "—" : d?.overview?.totalOrders || 0}
          icon={<ShoppingBag size={18} strokeWidth={1.5} />}
        />
        <KpiCard
          title="Customers"
          accent="#8b5cf6"
          value={dashLoading ? "—" : d?.overview?.totalCustomers || 0}
          icon={<Users size={18} strokeWidth={1.5} />}
        />
        <KpiCard
          title="Month revenue"
          accent="#f59e0b"
          value={
            dashLoading
              ? "—"
              : formatUSD(Number(d?.overview?.monthRevenue || 0))
          }
          icon={<TrendingUp size={18} strokeWidth={1.5} />}
        />
      </div>

      <div className="admin-card p-6">
        <div className="mb-6">
          <h2
            className="text-sm font-medium uppercase tracking-widest"
            style={{ color: "var(--admin-fg)" }}
          >
            Monthly revenue trends
          </h2>
          <p className="text-xs admin-muted mt-1">
            Total income per month (last 6 months) — paid &amp; delivered orders
          </p>
        </div>
        {dashLoading ? (
          <div className="h-[280px] flex items-center justify-center">
            <AdminLoader />
          </div>
        ) : monthlyTrendData.length === 0 ? (
          <div className="h-[280px] flex items-center justify-center text-sm admin-muted">
            No revenue data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={monthlyTrendData}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={chartGrid}
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: chartStroke }}
                axisLine={{ stroke: chartStroke }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: chartStroke }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => formatUSD(Number(v))}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value) => [
                  formatUSD(Number(value ?? 0)),
                  "Revenue",
                ]}
              />
              <Bar
                dataKey="revenue"
                fill={REVENUE_COLOR}
                radius={0}
                maxBarSize={48}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="admin-card xl:col-span-2 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div>
              <h2
                className="text-sm font-medium uppercase tracking-widest"
                style={{ color: "var(--admin-fg)" }}
              >
                Revenue over time
              </h2>
              <p className="text-xs admin-muted mt-1">
                Paid &amp; delivered orders in range
              </p>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <div
                className="inline-flex border p-0.5"
                style={{ borderColor: "var(--admin-border)" }}
              >
                {(["day", "week", "month"] as const).map((g) => {
                  const active = groupBy === g;
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGroupBy(g)}
                      className="px-3 py-1.5 text-xs font-medium uppercase tracking-wide transition-colors"
                      style={
                        active
                          ? {
                              backgroundColor: "var(--admin-active-bg)",
                              color: "var(--admin-active-fg)",
                            }
                          : { color: "var(--admin-fg)" }
                      }
                    >
                      {g}
                    </button>
                  );
                })}
              </div>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="admin-input text-xs w-auto"
              />
              <span className="text-xs admin-muted">–</span>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="admin-input text-xs w-auto"
              />
            </div>
          </div>

          {salesLoading ? (
            <div className="h-[320px] flex items-center justify-center">
              <AdminLoader />
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-[320px] flex items-center justify-center text-sm admin-muted">
              No data for this period
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart
                data={chartData}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={chartGrid}
                  vertical={false}
                />
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 11, fill: chartStroke }}
                  axisLine={{ stroke: chartStroke }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: chartStroke }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => formatUSD(Number(v))}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value) => [
                    formatUSD(Number(value ?? 0)),
                    "Revenue",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke={REVENUE_COLOR}
                  strokeWidth={2}
                  fill={chartFill}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="admin-card p-6">
          <h2
            className="text-sm font-medium uppercase tracking-widest"
            style={{ color: "var(--admin-fg)" }}
          >
            Orders by status
          </h2>
          <p className="text-xs admin-muted mt-1 mb-6">Distribution</p>
          {dashLoading || statusData.length === 0 ? (
            <div className="h-[280px] flex items-center justify-center text-sm admin-muted">
              {dashLoading ? (
                <AdminLoader />
              ) : (
                "No order data"
              )}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={64}
                  outerRadius={96}
                  paddingAngle={1}
                  dataKey="value"
                  stroke={chartStroke}
                  strokeWidth={1}
                >
                  {statusData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={pieColors[index % pieColors.length]}
                    />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  iconType="square"
                  wrapperStyle={{
                    fontSize: 11,
                    color: chartStroke,
                    paddingTop: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {salesData.length > 0 && (
        <div className="admin-card overflow-hidden">
          <div
            className="px-6 py-4 border-b"
            style={{ borderColor: "var(--admin-border)" }}
          >
            <h2
              className="text-sm font-medium uppercase tracking-widest"
              style={{ color: "var(--admin-fg)" }}
            >
              Period summary
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr
                  className="border-b"
                  style={{ borderColor: "var(--admin-border)" }}
                >
                  {["Period", "Revenue", "Orders", "Avg. order", "Discounts"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider admin-muted"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {salesData.slice(-10).map((s, i) => (
                  <tr
                    key={i}
                    className="border-b"
                    style={{ borderColor: "var(--admin-border)" }}
                  >
                    <td className="px-5 py-3" style={{ color: "var(--admin-fg)" }}>
                      {new Date(s.period).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 font-medium" style={{ color: "var(--admin-fg)" }}>
                      {formatUSD(Number(s.revenue))}
                    </td>
                    <td className="px-5 py-3 admin-muted">{s.orders}</td>
                    <td className="px-5 py-3 admin-muted">
                      {formatUSD(Number(s.avg_order_value || 0))}
                    </td>
                    <td className="px-5 py-3 admin-muted">
                      {formatUSD(Number(s.discounts || 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
