import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'
import { LOCALE_COOKIE, defaultLocale, isLocale } from './routing'

/**
 * The dashboard has no locale in its URLs — every page stays at /properties,
 * /users, etc. The active language comes from the NEXT_LOCALE cookie, which
 * the language switcher sets via a server action.
 */
export default getRequestConfig(async () => {
    const cookieStore = cookies()
    const fromCookie = cookieStore.get(LOCALE_COOKIE)?.value
    const locale = isLocale(fromCookie) ? fromCookie : defaultLocale

    return {
        locale,
        messages: (await import(`../../messages/${locale}.json`)).default,
        timeZone: 'Africa/Monrovia',
        formats: {
            dateTime: {
                short: { day: 'numeric', month: 'short', year: 'numeric' },
                long: { day: 'numeric', month: 'long', year: 'numeric' },
                table: {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                },
            },
            number: {
                currency: {
                    style: 'currency',
                    currency: 'USD',
                    maximumFractionDigits: 0,
                },
                compact: { notation: 'compact', maximumFractionDigits: 1 },
            },
        },
    }
})
