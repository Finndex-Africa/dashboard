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

    const cookieStore = cookies()
    cookieStore.set(LOCALE_COOKIE, locale, {
        maxAge: LOCALE_COOKIE_MAX_AGE,
        sameSite: 'lax',
        path: '/',
    })

    revalidatePath('/', 'layout')
}
