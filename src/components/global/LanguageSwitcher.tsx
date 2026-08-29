'use client'

import { useTransition } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import Select from 'antd/es/select'
import { GlobalOutlined } from '@ant-design/icons'
import { setLocale } from '@/i18n/actions'
import { locales, localeNames, type Locale } from '@/i18n/routing'

/**
 * Switches the dashboard language via the NEXT_LOCALE cookie. URLs are
 * unchanged — the server action revalidates the layout so server components
 * re-render with the new messages.
 */
export default function LanguageSwitcher({
    block = false,
}: {
    /** Full-width variant for the mobile drawer / settings page. */
    block?: boolean
}) {
    const t = useTranslations('languageSwitcher')
    const locale = useLocale() as Locale
    const [isPending, startTransition] = useTransition()

    const onChange = (next: Locale) => {
        startTransition(() => {
            void setLocale(next)
        })
    }

    return (
        <Select<Locale>
            value={locale}
            onChange={onChange}
            loading={isPending}
            disabled={isPending}
            aria-label={t('changeLanguage')}
            title={t('changeLanguage')}
            style={block ? { width: '100%' } : { width: 140 }}
            suffixIcon={<GlobalOutlined />}
            options={locales.map((l) => ({ value: l, label: localeNames[l] }))}
        />
    )
}
