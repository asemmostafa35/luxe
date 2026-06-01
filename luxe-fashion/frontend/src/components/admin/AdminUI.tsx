'use client';
import { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

// ─── Stat Card ────────────────────────────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: ReactNode;
  color?: string;
  prefix?: string;
  suffix?: string;
}
export function StatCard({ title, value, change, icon, color = 'bg-brand-900 dark:bg-white', prefix = '', suffix = '' }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-brand-950 border border-brand-100 dark:border-brand-800 p-5">
      <div className="flex items-start justify-between mb-4">
        <p className="text-xs tracking-widest uppercase text-brand-500">{title}</p>
        <div className={`w-9 h-9 ${color} text-white dark:text-brand-900 flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <p className="font-serif text-3xl font-light text-brand-900 dark:text-white">
        {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
      </p>
      {change !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-xs ${change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
          {change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {Math.abs(change)}% vs last month
        </div>
      )}
    </div>
  );
}

// ─── Page Header ──────────────────────────────────────────────────────────────
export function AdminPageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="font-serif text-2xl font-light text-brand-900 dark:text-white">{title}</h1>
        {subtitle && <p className="text-sm text-brand-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
const STATUS_MAP: Record<string, string> = {
  PENDING:    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  CONFIRMED:  'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  PROCESSING: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
  SHIPPED:    'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400',
  DELIVERED:  'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  CANCELLED:  'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  REFUNDED:   'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  PAID:       'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  FAILED:     'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  ACTIVE:     'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  INACTIVE:   'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};
export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block text-xs px-2 py-0.5 font-medium ${STATUS_MAP[status] || 'bg-brand-100 text-brand-700 dark:bg-brand-800 dark:text-brand-300'}`}>
      {status}
    </span>
  );
}

// ─── Data Table ───────────────────────────────────────────────────────────────
interface Column<T> { key: string; label: string; render?: (row: T) => ReactNode; className?: string }
interface TableProps<T> { columns: Column<T>[]; data: T[]; loading?: boolean; emptyText?: string }
export function DataTable<T extends { id: string }>({ columns, data, loading, emptyText = 'No data found' }: TableProps<T>) {
  if (loading) return (
    <div className="bg-white dark:bg-brand-950 border border-brand-100 dark:border-brand-800">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex gap-4 px-5 py-3.5 border-b border-brand-50 dark:border-brand-900">
          {columns.map((_, j) => <div key={j} className="h-4 skeleton flex-1" />)}
        </div>
      ))}
    </div>
  );
  return (
    <div className="bg-white dark:bg-brand-950 border border-brand-100 dark:border-brand-800 overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-brand-100 dark:border-brand-800">
            {columns.map(col => (
              <th key={col.key} className={`px-4 py-3 text-left text-xs tracking-widest uppercase text-brand-500 font-medium whitespace-nowrap ${col.className || ''}`}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr><td colSpan={columns.length} className="px-4 py-12 text-center text-sm text-brand-500">{emptyText}</td></tr>
          ) : (
            data.map(row => (
              <tr key={row.id} className="border-b border-brand-50 dark:border-brand-900 hover:bg-brand-50 dark:hover:bg-brand-900/50 transition-colors">
                {columns.map(col => (
                  <td key={col.key} className={`px-4 py-3.5 text-sm text-brand-700 dark:text-brand-300 ${col.className || ''}`}>
                    {col.render ? col.render(row) : String((row as any)[col.key] ?? '—')}
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

// ─── Pagination ───────────────────────────────────────────────────────────────
export function Pagination({ page, pages, onChange }: { page: number; pages: number; onChange: (p: number) => void }) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-4">
      <p className="text-xs text-brand-500">Page {page} of {pages}</p>
      <div className="flex gap-1">
        <button disabled={page <= 1} onClick={() => onChange(page - 1)}
          className="px-3 py-1.5 text-xs border border-brand-200 dark:border-brand-700 disabled:opacity-40 hover:border-brand-900 dark:hover:border-white transition-colors">
          Prev
        </button>
        {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
          const p = i + Math.max(1, page - 3);
          if (p > pages) return null;
          return (
            <button key={p} onClick={() => onChange(p)}
              className={`w-8 h-8 text-xs transition-colors ${page === p ? 'bg-brand-900 dark:bg-white text-white dark:text-brand-900' : 'border border-brand-200 dark:border-brand-700 hover:border-brand-900 dark:hover:border-white'}`}>
              {p}
            </button>
          );
        })}
        <button disabled={page >= pages} onClick={() => onChange(page + 1)}
          className="px-3 py-1.5 text-xs border border-brand-200 dark:border-brand-700 disabled:opacity-40 hover:border-brand-900 dark:hover:border-white transition-colors">
          Next
        </button>
      </div>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, size = 'md' }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  if (!open) return null;
  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative bg-white dark:bg-brand-950 w-full ${widths[size]} max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-100 dark:border-brand-800">
          <h3 className="font-serif text-xl font-light text-brand-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="text-brand-400 hover:text-brand-900 dark:hover:text-white transition-colors">✕</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ─── Search Input ─────────────────────────────────────────────────────────────
export function SearchInput({ value, onChange, placeholder = 'Search...' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="border border-brand-200 dark:border-brand-700 px-3 py-2 text-sm bg-white dark:bg-brand-950 text-brand-900 dark:text-white placeholder:text-brand-400 focus:outline-none focus:border-brand-900 dark:focus:border-white transition-colors w-full md:w-64" />
  );
}
