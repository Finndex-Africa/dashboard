export const locales = ['en', 'fr'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'en'

/** Cookie the dashboard reads/writes to remember the admin's language. */
export const LOCALE_COOKIE = 'NEXT_LOCALE'
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

/** Human-readable names for the language switcher, in their own language. */
export const localeNames: Record<Locale, string> = {
    en: 'English',
    fr: 'Français',
}

export function isLocale(value: string | undefined): value is Locale {
    return !!value && (locales as readonly string[]).includes(value)
}
