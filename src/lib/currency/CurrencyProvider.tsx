"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  CURRENCY_COOKIE,
  CURRENCY_META,
  Currency,
  DEFAULT_CURRENCY,
  RateTable,
  convert,
  isCurrency,
} from "./config";

type CurrencyContextValue = {
  /** The currency the admin is viewing figures in. */
  currency: Currency;
  setCurrency: (next: Currency) => void;
  rates: RateTable;
  /**
   * True when rates came from the static fallback rather than a live provider.
   * Surface this if you ever show a rate figure directly.
   */
  ratesAreStale: boolean;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error("useCurrency must be used inside CurrencyProvider");
  }
  return ctx;
}

/**
 * Reads the cookie directly rather than having the server pass it down, so the
 * root layout does not have to call `cookies()` and opt every page out of
 * static rendering. Dashboard figures are all fetched client-side, so there is
 * no server-rendered price for a differing render to mismatch against.
 */
function readCurrencyCookie(): Currency {
  if (typeof document === "undefined") return DEFAULT_CURRENCY;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${CURRENCY_COOKIE}=([^;]*)`),
  );
  const value = match?.[1] && decodeURIComponent(match[1]);
  return isCurrency(value) ? value : DEFAULT_CURRENCY;
}

export function CurrencyProvider({
  rates,
  children,
}: {
  rates: RateTable;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [currency, setCurrencyState] = useState<Currency>(readCurrencyCookie);

  const setCurrency = useCallback(
    (next: Currency) => {
      setCurrencyState(next);
      // One year, lax: this is a display preference, not a credential.
      document.cookie = `${CURRENCY_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
      // Server components that render figures read the cookie, so they need to
      // re-render too — client state alone would leave them on the old currency
      // until the next full navigation.
      router.refresh();
    },
    [router],
  );

  const value = useMemo<CurrencyContextValue>(
    () => ({
      currency,
      setCurrency,
      rates,
      ratesAreStale: rates.provider === "fallback",
    }),
    [currency, setCurrency, rates],
  );

  return (
    <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
  );
}

/**
 * Formats money for the admin dashboard.
 *
 * Two distinct jobs, deliberately kept separate:
 *
 *  - `format` renders an amount in a currency you name. Use it when the figure
 *    belongs to someone else and must not move — the price an owner set, which
 *    an admin is approving.
 *  - `forListing` converts into the admin's chosen currency. Use it for
 *    browsing and for totals, where comparing like with like is the point.
 */
export function useMoney() {
  const { currency: display, rates } = useCurrency();

  return useMemo(
    () => ({
      /** Formats an amount in a specific currency. No conversion. */
      format(amount: number | null | undefined, currency: Currency): string {
        if (amount === null || amount === undefined || !Number.isFinite(amount)) {
          return "";
        }
        const { decimals } = CURRENCY_META[currency];
        return new Intl.NumberFormat(undefined, {
          style: "currency",
          currency,
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(amount);
      },

      /**
       * The figure to show, in the admin's chosen currency.
       *
       * Falls back to the listing's own currency if no rate is available —
       * showing the real number in the wrong currency beats showing nothing,
       * and `isConverted` lets callers label it.
       */
      forListing(
        amount: number | null | undefined,
        listingCurrency: Currency | undefined,
      ): { display: string; original: string; isConverted: boolean } {
        const source = listingCurrency ?? DEFAULT_CURRENCY;
        const original = this.format(amount, source);

        if (
          amount === null ||
          amount === undefined ||
          !Number.isFinite(amount) ||
          source === display
        ) {
          return { display: original, original, isConverted: false };
        }

        const converted = convert(amount, source, display, rates);
        if (converted === null) {
          return { display: original, original, isConverted: false };
        }
        return {
          display: this.format(converted, display),
          original,
          isConverted: true,
        };
      },

      /**
       * Formats a USD-denominated total in the admin's chosen currency.
       *
       * Aggregates must be summed from the backend's `priceUsd` — adding raw
       * `price` across a USD listing and an RWF one produces a number that
       * means nothing. This converts that USD total for display.
       */
      fromUsd(amount: number | null | undefined): string {
        if (amount === null || amount === undefined || !Number.isFinite(amount)) {
          return "";
        }
        if (display === "USD") return this.format(amount, "USD");
        const converted = convert(amount, "USD", display, rates);
        return converted === null
          ? this.format(amount, "USD")
          : this.format(converted, display);
      },

      /**
       * Compact form for stat tiles ("$5.4K", "RWF 7.0M"). Takes a USD total
       * for the same reason as `fromUsd`.
       */
      compactFromUsd(amount: number | null | undefined): string {
        if (amount === null || amount === undefined || !Number.isFinite(amount)) {
          return "";
        }
        // Fall back to the USD figure if the rate is missing, rather than
        // labelling a dollar amount as francs.
        const converted =
          display === "USD" ? amount : convert(amount, "USD", display, rates);
        const value = converted ?? amount;
        const code: Currency = converted === null ? "USD" : display;
        const { symbol, decimals } = CURRENCY_META[code];
        const abs = Math.abs(value);
        const unit =
          abs >= 1e9
            ? [1e9, "B"]
            : abs >= 1e6
              ? [1e6, "M"]
              : abs >= 1e3
                ? [1e3, "K"]
                : null;
        if (!unit) {
          return `${symbol}${value.toLocaleString(undefined, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          })}`;
        }
        const [divisor, suffix] = unit as [number, string];
        return `${symbol}${(value / divisor).toFixed(1)}${suffix}`;
      },
    }),
    [display, rates],
  );
}
