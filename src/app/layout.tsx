import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { LayoutClientWrapper } from '@/components/LayoutClientWrapper'

// Whitney (same as main site): Bold for headings, Medium for body
const whitneyBold = localFont({
    src: '../../../frontend/Whitney-Font/whitney-bold.otf',
    variable: '--font-whitney-bold',
    display: 'swap',
})
const whitneyMedium = localFont({
    src: '../../../frontend/Whitney-Font/whitney-medium.otf',
    variable: '--font-whitney-medium',
    display: 'swap',
})

export const metadata: Metadata = {
    title: 'Finndex Dashboard',
    description: 'Manage your Finndex Africa properties and services',
    icons: {
        icon: [
            { url: '/images/logos/Finndex Africa Updated Logo.png' },
            { url: '/favicon.ico' },
        ],
        apple: '/images/logos/Finndex Africa Updated Logo.png',
        shortcut: '/images/logos/Finndex Africa Updated Logo.png',
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