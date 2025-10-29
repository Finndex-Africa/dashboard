'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function AuthTransferPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const hasProcessed = useRef(false);

    useEffect(() => {
        const validateAndStoreToken = async () => {
            if (hasProcessed.current) return;

            const token = searchParams.get('token');

            if (!token) {
                console.error('❌ No token provided');
                router.replace('/login');
                return;
            }

            hasProcessed.current = true;
            console.log('📥 Processing authentication transfer');

            try {
                const response = await fetch(`${API_URL}/auth/validate-token`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ token }),
                });

                const data = await response.json();

                if (data.success && data.data.valid) {
                    console.log('✅ Token validated');

                    localStorage.clear();
                    document.cookie = 'token=; path=/; max-age=0';

                    localStorage.setItem('token', token);
                    localStorage.setItem('user', JSON.stringify(data.data.user));
                    document.cookie = `token=${token}; path=/; max-age=86400; SameSite=Lax`;

                    console.log('✅ Authentication complete');
                    router.replace('/dashboard');
                } else {
                    console.error('❌ Invalid token');
                    router.replace('/login');
                }
            } catch (error) {
                console.error('❌ Validation failed:', error);
                router.replace('/login');
            }
        };

        validateAndStoreToken();
    }, [searchParams, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <h2 className="text-xl font-semibold text-gray-900">Signing you in...</h2>
                <p className="text-gray-600 mt-2">Please wait</p>
            </div>
        </div>
    );
}
