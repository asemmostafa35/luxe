/** Normalize user hex input to #RRGGBB or null if invalid. */
export function normalizeHex(input: string | null | undefined): string | null {
  if (!input?.trim()) return null;
  let hex = input.trim().replace(/^#/, "");
  if (/^[0-9A-Fa-f]{3}$/.test(hex)) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (!/^[0-9A-Fa-f]{6}$/.test(hex)) return null;
  return `#${hex.toUpperCase()}`;
}

export function hexLabel(hex: string): string {
  return normalizeHex(hex) ?? hex;
}

const NAMED_HEX: Record<string, string> = {
  "#000000": "Black",
  "#FFFFFF": "White",
  "#F5F5F0": "Ivory",
  "#6B7280": "Grey",
  "#1E293B": "Navy",
  "#D4C4B0": "Beige",
  "#5C4033": "Brown",
  "#B91C1C": "Red",
  "#1D4ED8": "Blue",
  "#166534": "Green",
  "#E24646": "Red",
  "#EF4444": "Red",
  "#DC2626": "Red",
  "#F59E0B": "Orange",
  "#EAB308": "Yellow",
  "#A855F7": "Purple",
  "#EC4899": "Pink",
  "#14B8A6": "Teal",
};

function hexToRgb(hex: string): [number, number, number] | null {
  const n = normalizeHex(hex);
  if (!n) return null;
  return [
    parseInt(n.slice(1, 3), 16),
    parseInt(n.slice(3, 5), 16),
    parseInt(n.slice(5, 7), 16),
  ];
}

function nearestNamedColor(hex: string): string | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  let best: string | null = null;
  let bestDist = Infinity;
  for (const [h, name] of Object.entries(NAMED_HEX)) {
    const other = hexToRgb(h);
    if (!other) continue;
    const dist = Math.hypot(
      rgb[0] - other[0],
      rgb[1] - other[1],
      rgb[2] - other[2],
    );
    if (dist < bestDist) {
      bestDist = dist;
      best = name;
    }
  }
  return bestDist <= 48 ? best : null;
}

/** Human-readable color label for storefront (never raw hex in UI). */
export function getFriendlyColorName(
  color?: string | null,
  colorHex?: string | null,
): string {
  const fromHex = normalizeHex(colorHex) ?? normalizeHex(color);
  if (fromHex) {
    if (NAMED_HEX[fromHex]) return NAMED_HEX[fromHex];
    const near = nearestNamedColor(fromHex);
    if (near) return near;
  }
  const raw = color?.trim();
  if (raw && !raw.startsWith("#")) return raw;
  if (fromHex) {
    const [r, g, b] = hexToRgb(fromHex) ?? [0, 0, 0];
    if (r > 200 && g > 200 && b > 200) return "White";
    if (r < 40 && g < 40 && b < 40) return "Black";
    if (r > g && r > b) return "Red";
    if (g > r && g > b) return "Green";
    if (b > r && b > g) return "Blue";
    return "Custom";
  }
  return "";
}
