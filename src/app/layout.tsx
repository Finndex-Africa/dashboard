import type { Metadata } from 'next'
import { DM_Sans } from 'next/font/google'
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

export const metadata: Metadata = {
    title: 'FindAfriq Dashboard',
    description: 'Manage your FindAfriq properties and services',
    icons: {
        icon: [
            { url: '/images/logos/Header%20Logo-Findafriq.png' },
            { url: '/favicon.ico' },
        ],
        apple: '/images/logos/Header%20Logo-Findafriq.png',
        shortcut: '/images/logos/Header%20Logo-Findafriq.png',
    },
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className={`${whitneyBold.variable} ${whitneyMedium.variable} font-body antialiased`}>
                <LayoutClientWrapper>
                    {children}
                </LayoutClientWrapper>
            </body>
        </html>
    )
}