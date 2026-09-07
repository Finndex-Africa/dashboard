'use client';

import { useLocale } from 'next-intl';
import { AuthProvider } from '@/providers/AuthProvider';
import { ConfigProvider } from 'antd';
import enUS from 'antd/locale/en_US';
import frFR from 'antd/locale/fr_FR';
import { PRIMARY_BLUE } from '@/config/colors.js';
import type { Locale } from '@/i18n/routing';

// Antd ships its own copy for built-in strings (pagination, empty states,
// date pickers, table filters), so it needs the locale passed explicitly.
const ANTD_LOCALES = {
    en: enUS,
    fr: frFR,
} as const;

export function LayoutClientWrapper({
    children,
}: {
    children: React.ReactNode;
}) {
    const locale = useLocale() as Locale;

    return (
        <ConfigProvider
            locale={ANTD_LOCALES[locale] ?? enUS}
            theme={{
                token: {
                    colorPrimary: PRIMARY_BLUE,
                },
            }}
            warning={{
                strict: false, // Suppress React 19 compatibility warning
            }}
        >
            <AuthProvider>{children}</AuthProvider>
        </ConfigProvider>
    );
}
