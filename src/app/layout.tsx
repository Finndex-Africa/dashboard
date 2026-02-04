import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { LayoutClientWrapper } from '@/components/LayoutClientWrapper'

const inter = Inter({ subsets: ['latin'] })

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
            <body className={inter.className}>
                <LayoutClientWrapper>
                    {children}
                </LayoutClientWrapper>
            </body>
        </html>
    )
}