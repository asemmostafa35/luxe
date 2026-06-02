"use client";

interface AdminStatusToggleProps {
  active: boolean;
  onChange: (active: boolean) => void;
  disabled?: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
}

export function AdminStatusToggle({
  active,
  onChange,
  disabled = false,
  activeLabel = "Active",
  inactiveLabel = "Inactive",
}: AdminStatusToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      disabled={disabled}
      onClick={() => onChange(!active)}
      className="inline-flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <span
        className="relative inline-flex h-5 w-9 shrink-0 border transition-colors"
        style={{
          borderColor: "var(--admin-border)",
          backgroundColor: active ? "var(--admin-active-bg)" : "var(--admin-hover)",
        }}
      >
        <span
          className="absolute top-0.5 h-3.5 w-3.5 transition-all"
          style={{
            left: active ? "calc(100% - 0.875rem - 2px)" : "2px",
            backgroundColor: active ? "var(--admin-active-fg)" : "var(--admin-fg)",
          }}
        />
      </span>
      <span className="text-[10px] uppercase tracking-wider font-medium" style={{ color: "var(--admin-fg)" }}>
        {active ? activeLabel : inactiveLabel}
      </span>
    </button>
  );
}
