export function formatCurrency(
  amount: number,
  currency: string = "USD",
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** e.g. formatCompactCurrency(12400000) -> "$12.40M" */
export function formatCompactCurrency(amount: number): string {
  return `$${(amount / 1_000_000).toFixed(2)}M`;
}

/** e.g. formatPercent(0.862) -> "86.2%" */
export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}
