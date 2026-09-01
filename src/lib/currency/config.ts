/**
 * Client-side mirror of the backend's currency contract
 * (backend/src/modules/currency/currency.types.ts). Keep the two in step —
 * adding a currency in one place only is how you get an unformattable price.
 */

export const CURRENCIES = ["USD", "RWF"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const DEFAULT_CURRENCY: Currency = "USD";

/** Cookie name, deliberately parallel to next-intl's NEXT_LOCALE. */
export const CURRENCY_COOKIE = "NEXT_CURRENCY";

export function isCurrency(value: unknown): value is Currency {
  return typeof value === "string" && (CURRENCIES as readonly string[]).includes(value);
}

/**
 * `decimals` is load-bearing: RWF has no minor unit, so showing "RWF 1,300,000.00"
 * is wrong in a way Rwandan users notice immediately.
 */
export const CURRENCY_META: Record<
  Currency,
  { code: Currency; symbol: string; decimals: number; label: string }
> = {
  USD: { code: "USD", symbol: "$", decimals: 2, label: "USD" },
  RWF: { code: "RWF", symbol: "RWF", decimals: 0, label: "RWF" },
};

/** Rates are USD-based, matching the backend's normalization. */
export type RateTable = {
  base: Currency;
  rates: Partial<Record<Currency, number>>;
  provider: "wise" | "fallback" | "identity";
  fetchedAt: string;
};

/**
 * Used when the rates endpoint is unreachable. A stale approximation clearly
 * labelled as approximate beats a page that fails to render a price.
 */
export const FALLBACK_RATES: RateTable = {
  base: "USD",
  rates: { USD: 1, RWF: 1300 },
  provider: "fallback",
  fetchedAt: new Date(0).toISOString(),
};

/** Converts between any two supported currencies via the USD base. */
export function convert(
  amount: number,
  from: Currency,
  to: Currency,
  table: RateTable,
): number | null {
  if (from === to) return amount;
  const fromRate = table.rates[from];
  const toRate = table.rates[to];
  if (!fromRate || !toRate) return null;
  const value = (amount / fromRate) * toRate;
  const factor = 10 ** CURRENCY_META[to].decimals;
  return Math.round(value * factor) / factor;
}
