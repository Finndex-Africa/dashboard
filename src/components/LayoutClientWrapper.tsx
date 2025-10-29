'use client';

import { AuthProvider } from '@/providers/AuthProvider';

export function LayoutClientWrapper({
    children,
}: {
    children: React.ReactNode;
}) {
    return <AuthProvider>{children}</AuthProvider>;
}