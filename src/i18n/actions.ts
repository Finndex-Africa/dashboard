'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import {
    LOCALE_COOKIE,
    LOCALE_COOKIE_MAX_AGE,
    isLocale,
    type Locale,
} from './routing'

/**
 * Persists the chosen language and re-renders the tree so server components
 * pick up the new messages. URLs are untouched.
 */
export async function setLocale(locale: Locale) {
    if (!isLocale(locale)) return

    const cookieStore = await cookies()
    cookieStore.set(LOCALE_COOKIE, locale, {
        maxAge: LOCALE_COOKIE_MAX_AGE,
        sameSite: 'lax',
        path: '/',
        // Only over TLS in production; left off locally so http://localhost keeps
        // remembering the language.
        secure: process.env.NODE_ENV === 'production',
    })

    revalidatePath('/', 'layout')
}
