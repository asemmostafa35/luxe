"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { normalizeHex, getFriendlyColorName } from "@/lib/colorUtils";
import { formatEGP } from "@/lib/currency";
import toast from "react-hot-toast";

export type SizeMode = "tops" | "pants";

export const SIZE_SETS: Record<SizeMode, readonly string[]> = {
  tops: ["XS", "S", "M", "L", "XL", "XXL"],
  pants: ["28", "30", "32", "34", "36"],
};

export type VariantDraft = {
  size: string;
  color: string;
  colorHex: string;
  stock: string;
  price: string;
};

export type ProductVariantInput = {
  size: string | null;
  color: string | null;
  colorHex: string | null;
  stock: number;
  price: number | null;
};

const EMPTY_DRAFT: VariantDraft = {
  size: "",
  color: "",
  colorHex: "",
  stock: "",
  price: "",
};

export function buildVariantPayload(draft: VariantDraft): ProductVariantInput | null {
  const stock = Number(draft.stock);
  if (!draft.stock.trim() || Number.isNaN(stock) || stock < 0) {
    return null;
  }

  const colorHex = normalizeHex(draft.colorHex);
  const size = draft.size.trim() || null;

  return {
    size,
    color: colorHex ? getFriendlyColorName(null, colorHex) : draft.color.trim() || null,
    colorHex,
    stock,
    price: draft.price.trim() ? Number(draft.price) : null,
  };
}

interface ProductVariantBuilderProps {
  variants: ProductVariantInput[];
  onChange: (variants: ProductVariantInput[]) => void;
}

export function ProductVariantBuilder({
  variants,
  onChange,
}: ProductVariantBuilderProps) {
  const [sizeMode, setSizeMode] = useState<SizeMode>("tops");
  const [draft, setDraft] = useState<VariantDraft>(EMPTY_DRAFT);
  const [hexInput, setHexInput] = useState("#000000");

  const sizeOptions = SIZE_SETS[sizeMode];

  const pickerValue = useMemo(() => {
    const n = normalizeHex(hexInput) ?? normalizeHex(draft.colorHex);
    return n ?? "#000000";
  }, [hexInput, draft.colorHex]);

  /** Saved palette = unique hexes from variants already added (no duplicate swatches). */
  const savedColorHexes = useMemo(() => {
    const seen = new Set<string>();
    for (const v of variants) {
      const hex = normalizeHex(v.colorHex);
      if (hex) seen.add(hex);
    }
    return Array.from(seen);
  }, [variants]);

  const setDraftColor = (hex: string) => {
    setHexInput(hex);
    setDraft((p) => ({
      ...p,
      colorHex: hex,
      color: getFriendlyColorName(null, hex),
    }));
  };

  const applyColor = (raw: string, showError = true) => {
    const hex = normalizeHex(raw);
    if (!hex) {
      if (showError) toast.error("Enter a valid hex color (e.g. #1A2B3C)");
      return false;
    }
    setDraftColor(hex);
    return true;
  };

  const selectSize = (size: string) => {
    setDraft((p) => ({ ...p, size: p.size === size ? "" : size }));
  };

  const switchSizeMode = (mode: SizeMode) => {
    setSizeMode(mode);
    setDraft((p) => ({
      ...p,
      size: p.size && SIZE_SETS[mode].includes(p.size) ? p.size : "",
    }));
  };

  const selectSessionColor = (hex: string) => {
    const active = draft.colorHex === hex;
    if (active) {
      setDraft((p) => ({ ...p, colorHex: "", color: "" }));
      setHexInput("#000000");
      return;
    }
    setDraftColor(hex);
  };

  const addVariant = () => {
    const payload = buildVariantPayload(draft);
    if (!payload) {
      toast.error("Stock is required (0 or more)");
      return;
    }
    const duplicate = variants.some(
      (v) =>
        (v.size || "") === (payload.size || "") &&
        normalizeHex(v.colorHex) === normalizeHex(payload.colorHex),
    );
    if (duplicate) {
      toast.error("This size and color combination is already added");
      return;
    }
    onChange([...variants, payload]);
    setDraft(EMPTY_DRAFT);
    setHexInput("#000000");
  };

  const removeVariant = (index: number) => {
    onChange(variants.filter((_, i) => i !== index));
  };

  return (
    <div>
      <label className="text-xs tracking-widest uppercase admin-muted block mb-2">
        Variants (Size / Color / Stock)
      </label>

      {variants.length > 0 && (
        <div className="space-y-2 mb-3">
          {variants.map((v, i) => (
            <div
              key={`${v.size}-${v.colorHex}-${v.stock}-${i}`}
              className="flex items-center gap-2 text-xs border px-3 py-2"
              style={{ borderColor: "var(--admin-border)" }}
            >
              {v.colorHex && (
                <span
                  className="w-5 h-5 shrink-0 border"
                  style={{
                    backgroundColor: v.colorHex,
                    borderColor: "var(--admin-border)",
                  }}
                  title={v.colorHex}
                />
              )}
              {v.size && (
                <span className="font-medium" style={{ color: "var(--admin-fg)" }}>
                  {v.size}
                </span>
              )}
              {v.color && (
                <span className="admin-muted">{v.color}</span>
              )}
              <span className="admin-muted">Stock: {v.stock}</span>
              {v.price != null && (
                <span className="admin-muted">
                  {formatEGP(Number(v.price))}
                </span>
              )}
              <button
                type="button"
                onClick={() => removeVariant(i)}
                className="ml-auto admin-icon-btn w-7 h-7"
                aria-label="Remove variant"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="admin-card p-4 space-y-4">
        {/* Size mode + grid */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className="text-[10px] uppercase tracking-widest admin-muted">
              Size
            </p>
            <div
              className="inline-flex border"
              style={{ borderColor: "var(--admin-border)" }}
            >
              {(["tops", "pants"] as const).map((mode) => {
                const active = sizeMode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => switchSizeMode(mode)}
                    className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-medium transition-opacity"
                    style={
                      active
                        ? {
                            backgroundColor: "var(--admin-active-bg)",
                            color: "var(--admin-active-fg)",
                          }
                        : { color: "var(--admin-fg)" }
                    }
                  >
                    {mode === "tops" ? "Tops" : "Pants"}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {sizeOptions.map((size) => {
              const active = draft.size === size;
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => selectSize(size)}
                  className="min-w-[2.25rem] px-2 py-1.5 text-xs font-medium border transition-opacity"
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
                  {size}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic color picker */}
        <div>
          <p className="text-[10px] uppercase tracking-widest admin-muted mb-2">
            Color
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <label
              className="relative w-10 h-10 shrink-0 border cursor-pointer overflow-hidden"
              style={{ borderColor: "var(--admin-border)" }}
              title="Pick color"
            >
              <input
                type="color"
                value={pickerValue}
                onChange={(e) => {
                  const hex = normalizeHex(e.target.value);
                  if (hex) setDraftColor(hex);
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <span
                className="block w-full h-full"
                style={{ backgroundColor: pickerValue }}
              />
            </label>
            <input
              type="text"
              value={hexInput}
              onChange={(e) => setHexInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  applyColor(hexInput);
                }
              }}
              placeholder="#000000"
              className="admin-input text-sm font-mono w-28 py-1.5"
              spellCheck={false}
            />
            <button
              type="button"
              onClick={() => applyColor(hexInput)}
              className="admin-btn-outline text-[10px] py-1.5 px-2"
            >
              Apply
            </button>
          </div>

          {savedColorHexes.length > 0 && (
            <div className="mt-3">
              <p className="text-[10px] uppercase tracking-widest admin-muted mb-1.5">
                Colors in this product
              </p>
              <div className="flex flex-wrap gap-2">
                {savedColorHexes.map((hex) => {
                  const active = draft.colorHex === hex;
                  return (
                    <button
                      key={hex}
                      type="button"
                      title={hex}
                      onClick={() => selectSessionColor(hex)}
                      className="w-8 h-8 border-2 transition-opacity"
                      style={{
                        backgroundColor: hex,
                        borderColor: active
                          ? "var(--admin-fg)"
                          : "var(--admin-border)",
                        outline: active ? "2px solid var(--admin-fg)" : "none",
                        outlineOffset: "2px",
                      }}
                      aria-label={`Color ${hex}`}
                      aria-pressed={active}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {draft.colorHex && (
            <p className="text-xs admin-muted mt-2">
              Selected: {getFriendlyColorName(null, draft.colorHex)}
              <span className="font-mono ml-1 opacity-70">({draft.colorHex})</span>
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] uppercase tracking-widest admin-muted block mb-1.5">
              Stock *
            </label>
            <input
              type="number"
              min={0}
              value={draft.stock}
              onChange={(e) =>
                setDraft((p) => ({ ...p, stock: e.target.value }))
              }
              placeholder="0"
              className="admin-input text-sm"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest admin-muted block mb-1.5">
              Variant price (opt)
            </label>
            <input
              type="number"
              min={0}
              value={draft.price}
              onChange={(e) =>
                setDraft((p) => ({ ...p, price: e.target.value }))
              }
              placeholder="Same as product"
              className="admin-input text-sm"
            />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={addVariant}
        className="mt-3 admin-btn-outline text-xs flex items-center gap-1"
      >
        <Plus size={12} strokeWidth={1.5} /> Add Variant
      </button>
    </div>
  );
}
