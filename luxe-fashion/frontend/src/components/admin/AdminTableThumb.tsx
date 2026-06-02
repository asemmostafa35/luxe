"use client";

import { Layers } from "lucide-react";

type ThumbItem = { image?: string | null; name?: string };

export function AdminTableThumb({
  items,
  alt = "Product",
}: {
  items?: ThumbItem[] | null;
  alt?: string;
}) {
  const list = items?.filter(Boolean) ?? [];
  const firstWithImage = list.find((i) => i.image);
  const first = firstWithImage ?? list[0];
  const extra = list.length > 1 ? list.length - 1 : 0;

  if (list.length === 0) {
    return (
      <div
        className="w-10 h-10 flex-shrink-0 border flex items-center justify-center"
        style={{ borderColor: "var(--admin-border)", color: "var(--admin-muted)" }}
        aria-hidden
      >
        <span className="text-[9px] uppercase tracking-wide">—</span>
      </div>
    );
  }

  if (list.length > 1 && !firstWithImage) {
    return (
      <div
        className="w-10 h-10 flex-shrink-0 border flex items-center justify-center"
        style={{ borderColor: "var(--admin-border)", color: "var(--admin-fg)" }}
        title={`${list.length} items`}
        aria-label={`${list.length} items`}
      >
        <Layers size={14} strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <div className="relative w-10 h-10 flex-shrink-0">
      <div
        className="w-10 h-10 overflow-hidden border"
        style={{ borderColor: "var(--admin-border)" }}
      >
        {first?.image ? (
          <img
            src={first.image}
            alt={first.name || alt}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-[9px] admin-muted"
            style={{ backgroundColor: "var(--admin-hover)" }}
          >
            —
          </div>
        )}
      </div>
      {extra > 0 && (
        <span
          className="absolute -bottom-1 -right-1 min-w-[16px] h-4 px-0.5 text-[9px] font-medium flex items-center justify-center border"
          style={{
            borderColor: "var(--admin-border)",
            backgroundColor: "var(--admin-active-bg)",
            color: "var(--admin-active-fg)",
          }}
        >
          +{extra}
        </span>
      )}
    </div>
  );
}
