"use client";
import { ReactNode } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { AdminLoader } from "@/components/admin/AdminLoader";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: ReactNode;
  prefix?: string;
  suffix?: string;
}

export function StatCard({
  title,
  value,
  change,
  icon,
  prefix = "",
  suffix = "",
}: StatCardProps) {
  return (
    <div className="admin-card p-5">
      <div className="flex items-start justify-between mb-4">
        <p className="text-xs tracking-widest uppercase admin-muted">{title}</p>
        <div
          className="w-9 h-9 flex items-center justify-center border"
          style={{
            borderColor: "var(--admin-border)",
            color: "var(--admin-fg)",
          }}
        >
          {icon}
        </div>
      </div>
      <p
        className="text-3xl font-light tracking-tight tabular-nums"
        style={{ color: "var(--admin-fg)" }}
      >
        {prefix}
        {typeof value === "number" ? value.toLocaleString() : value}
        {suffix}
      </p>
      {change !== undefined && (
        <div
          className="flex items-center gap-1 mt-2 text-xs admin-muted"
        >
          {change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {Math.abs(change)}% vs last month
        </div>
      )}
    </div>
  );
}

export function AdminPageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1
          className="text-2xl font-light tracking-tight"
          style={{ color: "var(--admin-fg)" }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm admin-muted mt-1">{subtitle}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

const STATUS_MAP: Record<string, string> = {
  PENDING: "border border-[var(--admin-border)] admin-muted",
  CONFIRMED: "border border-[var(--admin-border)]",
  PROCESSING: "border border-[var(--admin-border)]",
  SHIPPED: "border border-[var(--admin-border)]",
  DELIVERED: "border border-[var(--admin-border)]",
  CANCELLED: "border border-[var(--admin-border)] opacity-60",
  REFUNDED: "border border-[var(--admin-border)] opacity-50",
  PAID: "border border-[var(--admin-border)]",
  FAILED: "border border-[var(--admin-border)] opacity-60",
  ACTIVE: "border border-[var(--admin-border)]",
  INACTIVE: "border border-[var(--admin-border)] opacity-50",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block text-xs px-2 py-0.5 font-medium uppercase tracking-wide ${STATUS_MAP[status] || "border border-[var(--admin-border)]"}`}
      style={{ color: "var(--admin-fg)" }}
    >
      {status}
    </span>
  );
}

interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
  className?: string;
}
interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyText?: string;
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  loading,
  emptyText = "No data found",
}: TableProps<T>) {
  if (loading)
    return (
      <div className="admin-card overflow-hidden flex flex-col items-center justify-center py-16">
        <AdminLoader />
        <p className="text-xs uppercase tracking-widest admin-muted mt-4">Loading</p>
      </div>
    );
  return (
    <div className="admin-card admin-scroll overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr
            className="border-b"
            style={{ borderColor: "var(--admin-border)" }}
          >
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-left text-xs tracking-widest uppercase font-medium whitespace-nowrap admin-muted ${col.className || ""}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center text-sm admin-muted"
              >
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={row.id}
                className="border-b transition-colors"
                style={{ borderColor: "var(--admin-border)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--admin-hover)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-3.5 text-sm align-middle ${col.className || ""}`}
                    style={{ color: "var(--admin-fg)" }}
                  >
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key] ?? "—")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export function Pagination({
  page,
  pages,
  onChange,
}: {
  page: number;
  pages: number;
  onChange: (p: number) => void;
}) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-4">
      <p className="text-xs admin-muted">
        Page {page} of {pages}
      </p>
      <div className="flex gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          className="admin-btn-outline px-3 py-1.5 disabled:opacity-40"
        >
          Prev
        </button>
        {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
          const p = i + Math.max(1, page - 3);
          if (p > pages) return null;
          const active = page === p;
          return (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              className="w-8 h-8 text-xs transition-colors border"
              style={
                active
                  ? {
                      backgroundColor: "var(--admin-active-bg)",
                      color: "var(--admin-active-fg)",
                      borderColor: "var(--admin-border)",
                    }
                  : {
                      borderColor: "var(--admin-border)",
                      color: "var(--admin-fg)",
                    }
              }
            >
              {p}
            </button>
          );
        })}
        <button
          type="button"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
          className="admin-btn-outline px-3 py-1.5 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  if (!open) return null;
  const widths = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 dark:bg-black/80"
        onClick={onClose}
      />
      <div
        className={`relative w-full ${widths[size]} max-h-[90vh] overflow-y-auto admin-card`}
        style={{ backgroundColor: "var(--admin-surface)" }}
      >
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: "var(--admin-border)" }}
        >
          <h3
            className="text-xl font-light tracking-tight"
            style={{ color: "var(--admin-fg)" }}
          >
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-lg admin-muted hover:opacity-70 transition-opacity"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="admin-input w-full md:w-64"
    />
  );
}
