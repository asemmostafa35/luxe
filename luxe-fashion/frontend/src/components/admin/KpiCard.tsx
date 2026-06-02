"use client";

import { ReactNode } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: ReactNode;
  prefix?: string;
  suffix?: string;
  /** Accent color for analytics KPIs (hex). Omit for B&W admin pages. */
  accent?: string;
}

export function KpiCard({
  title,
  value,
  change,
  icon,
  prefix = "",
  suffix = "",
  accent,
}: KpiCardProps) {
  const colorful = Boolean(accent);

  return (
    <div className="admin-card p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <p className="text-[11px] font-medium uppercase tracking-wider admin-muted">
          {title}
        </p>
        <div
          className="w-10 h-10 flex items-center justify-center shrink-0 border"
          style={
            colorful
              ? {
                  borderColor: accent,
                  backgroundColor: `${accent}1a`,
                  color: accent,
                }
              : {
                  borderColor: "var(--admin-border)",
                  color: "var(--admin-fg)",
                }
          }
        >
          {icon}
        </div>
      </div>
      <p
        className="text-3xl font-semibold tracking-tight tabular-nums"
        style={{ color: "var(--admin-fg)" }}
      >
        {prefix}
        {typeof value === "number" ? value.toLocaleString() : value}
        {suffix}
      </p>
      {change !== undefined && (
        <div
          className="flex items-center gap-1 mt-2 text-xs font-medium"
          style={{
            color: colorful
              ? change >= 0
                ? "#10b981"
                : "#ef4444"
              : "var(--admin-muted)",
          }}
        >
          {change >= 0 ? (
            <TrendingUp size={14} strokeWidth={1.5} />
          ) : (
            <TrendingDown size={14} strokeWidth={1.5} />
          )}
          {Math.abs(change)}% vs last month
        </div>
      )}
    </div>
  );
}
