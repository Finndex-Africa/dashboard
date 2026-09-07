import { useLocale } from "next-intl";
import { useMemo } from "react";

/**
 * Locale-aware date/number formatting.
 *
 * Use these instead of hardcoding `toLocaleDateString("en-US", …)` — that
 * renders English months on French pages.
 *
 *   const fmt = useFormat();
 *   fmt.date(booking.scheduledDate, { month: "long", day: "numeric" });
 *   fmt.currency(property.price);
 */
export function useFormat() {
  const locale = useLocale();

  return useMemo(
    () => ({
      /** Formats a date/ISO string. Returns "" for null/undefined/invalid. */
      date(
        value: string | number | Date | null | undefined,
        options: Intl.DateTimeFormatOptions = {
          day: "numeric",
          month: "short",
          year: "numeric",
        },
      ): string {
        if (value == null) return "";
        const d = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(d.getTime())) return "";
        return new Intl.DateTimeFormat(locale, options).format(d);
      },

      /** Date + time, e.g. "12 Mar 2026, 14:30". */
      dateTime(
        value: string | number | Date | null | undefined,
        options: Intl.DateTimeFormatOptions = {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        },
      ): string {
        return this.date(value, options);
      },

      /** Time only. */
      time(
        value: string | number | Date | null | undefined,
        options: Intl.DateTimeFormatOptions = {
          hour: "2-digit",
          minute: "2-digit",
        },
      ): string {
        return this.date(value, options);
      },

      /** Plain number with locale grouping (1,234 / 1 234). */
      number(value: number | null | undefined, options?: Intl.NumberFormatOptions): string {
        if (value == null || Number.isNaN(value)) return "";
        return new Intl.NumberFormat(locale, options).format(value);
      },

      /** Currency, USD by default. */
      currency(
        value: number | null | undefined,
        currency = "USD",
        options: Intl.NumberFormatOptions = {},
      ): string {
        if (value == null || Number.isNaN(value)) return "";
        return new Intl.NumberFormat(locale, {
          style: "currency",
          currency,
          maximumFractionDigits: 0,
          ...options,
        }).format(value);
      },

      /** "2 days ago" / "il y a 2 jours". */
      relativeTime(value: string | number | Date | null | undefined): string {
        if (value == null) return "";
        const d = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(d.getTime())) return "";

        const diffMs = d.getTime() - Date.now();
        const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
        const units: [Intl.RelativeTimeFormatUnit, number][] = [
          ["year", 1000 * 60 * 60 * 24 * 365],
          ["month", 1000 * 60 * 60 * 24 * 30],
          ["day", 1000 * 60 * 60 * 24],
          ["hour", 1000 * 60 * 60],
          ["minute", 1000 * 60],
        ];
        for (const [unit, ms] of units) {
          if (Math.abs(diffMs) >= ms) {
            return rtf.format(Math.round(diffMs / ms), unit);
          }
        }
        return rtf.format(Math.round(diffMs / 1000), "second");
      },
    }),
    [locale],
  );
}
