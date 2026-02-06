'use client';

import { AuthProvider } from '@/providers/AuthProvider';
import { ConfigProvider } from 'antd';
import { PRIMARY_BLUE } from '@/config/colors.js';

export function LayoutClientWrapper({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ConfigProvider
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