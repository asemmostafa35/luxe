"use client";

type AdminLoaderSize = "sm" | "md" | "lg";

const SIZE_CLASS: Record<AdminLoaderSize, string> = {
  sm: "admin-loader admin-loader-sm",
  md: "admin-loader",
  lg: "admin-loader admin-loader-lg",
};

export function AdminLoader({
  size = "md",
  className = "",
  label = "Loading",
}: {
  size?: AdminLoaderSize;
  className?: string;
  label?: string;
}) {
  return (
    <div
      className={`flex items-center justify-center ${className}`}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <span className={SIZE_CLASS[size]} />
    </div>
  );
}
