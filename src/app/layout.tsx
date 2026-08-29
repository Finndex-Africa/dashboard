import type { Metadata } from 'next'
import { DM_Sans } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getTranslations } from 'next-intl/server'
import './globals.css'
import { LayoutClientWrapper } from '@/components/LayoutClientWrapper'

// DM Sans as a stand-in for Whitney (geometric sans-serif).
// Bold for headings, Medium for body – same variable names so all
// downstream CSS/Tailwind references keep working.
const whitneyBold = DM_Sans({
    weight: '700',
    subsets: ['latin'],
    variable: '--font-whitney-bold',
    display: 'swap',
})
const whitneyMedium = DM_Sans({
    weight: '500',
    subsets: ['latin'],
    variable: '--font-whitney-medium',
    display: 'swap',
})

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('metadata')

    return {
        title: t('title'),
        description: t('description'),
        icons: {
            icon: '/favicon.ico',
            apple: '/favicon.ico',
            shortcut: '/favicon.ico',
        },
    }
}

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Locale comes from the NEXT_LOCALE cookie (see src/i18n/request.ts);
    // dashboard URLs stay locale-free.
    const locale = await getLocale()

    return (
        <html lang={locale}>
            <body className={`${whitneyBold.variable} ${whitneyMedium.variable} font-body antialiased`}>
                <NextIntlClientProvider>
                    <LayoutClientWrapper>
                        {children}
                    </LayoutClientWrapper>
                </NextIntlClientProvider>
            </body>
        </html>
    )
}
