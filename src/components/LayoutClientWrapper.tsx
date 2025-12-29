'use client';

import { AuthProvider } from '@/providers/AuthProvider';
import { ConfigProvider } from 'antd';

export function LayoutClientWrapper({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: '#1890ff',
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