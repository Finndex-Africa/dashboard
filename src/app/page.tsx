'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loading } from '@/components/global/Loading';

export default function HomePage() {
    const router = useRouter();

    useEffect(() => {
        // Middleware will handle role-based redirect
        // This page should rarely be hit directly
        router.push('/properties');
    }, [router]);

    return <Loading />;
}