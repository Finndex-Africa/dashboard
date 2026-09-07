import { Currency, FALLBACK_RATES, RateTable } from "./config";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

/**
 * Exchange rates from the backend.
 *
 * Revalidated hourly to match the backend's own cache TTL — there is no point
 * asking more often than it refreshes. Falls back to a static table rather than
 * throwing: an unreachable rates endpoint must not take down every page that
 * happens to render a price.
 */
export async function getRates(): Promise<RateTable> {
  try {
    /*
      Uncached, unlike the public site. An admin who sets a manual rate in
      Settings has to see it applied on the next page load — caching here for an
      hour would make the override look broken. Dashboard routes are all
      dynamic anyway, and the backend keeps its own rate cache, so this is a
      cheap local call rather than a Wise round-trip.
    */
    const res = await fetch(`${API_URL}/currency/rates`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`rates endpoint returned ${res.status}`);

    const body = await res.json();
    // The API wraps some responses; accept either shape.
    const table = (body?.data ?? body) as Partial<RateTable>;
    if (!table?.rates || typeof table.rates !== "object") {
      throw new Error("rates payload missing `rates`");
    }
    return {
      base: (table.base as Currency) ?? "USD",
      rates: table.rates,
      provider: table.provider ?? "fallback",
      fetchedAt: table.fetchedAt ?? new Date().toISOString(),
    };
  } catch (error) {
    console.warn(
      `[currency] falling back to static rates: ${(error as Error).message}`,
    );
    return FALLBACK_RATES;
  }
}
