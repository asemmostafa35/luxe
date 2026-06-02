export const EGP_CURRENCY = "EGP";

/** Format amount without trailing .00 for whole numbers. */
export function formatMoney(
  amount: number,
  currency: "EGP" | "USD" = "EGP",
): string {
  const n = Number.isFinite(amount) ? amount : 0;
  const hasFraction = Math.abs(n % 1) > 0.001;
  const formatted = hasFraction
    ? n.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : n.toLocaleString("en-US", { maximumFractionDigits: 0 });

  if (currency === "USD") {
    return `$${formatted}`;
  }
  return `${EGP_CURRENCY} ${formatted}`;
}

export function formatEGP(amount: number): string {
  return formatMoney(amount, "EGP");
}

export function formatUSD(amount: number): string {
  return formatMoney(amount, "USD");
}

/** @deprecated Use formatMoney / formatUSD / formatEGP */
export const formatCurrency = formatMoney;
