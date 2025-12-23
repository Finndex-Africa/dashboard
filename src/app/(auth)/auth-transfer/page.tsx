'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getRoleRedirectPath, getUserRoleFromToken } from '@/lib/role-redirects';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const WEBSITE_URL = process.env.NEXT_PUBLIC_WEBSITE_URL || 'http://localhost:3000';

function AuthTransferContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const hasProcessed = useRef(false);

    useEffect(() => {
        const validateAndStoreToken = async () => {
            if (hasProcessed.current) return;
            hasProcessed.current = true;

            // Check if this is a logout request
            const isLogout = searchParams.get('logout') === 'true';
            if (isLogout) {
                console.log('🚪 Logout request received');
                // Remove only auth-related storage keys to avoid wiping developer logs
                localStorage.removeItem('token');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                localStorage.removeItem('refreshToken');
                document.cookie = 'token=; path=/; max-age=0';
                console.log('✅ Dashboard logged out');
                return;
            }

            const token = searchParams.get('token');

            if (!token) {
                console.error('❌ No token provided');
                window.location.href = `${WEBSITE_URL}/routes/login`;
                return;
            }

            console.log('📥 Processing authentication transfer');
            console.log('🔑 Token:', token?.substring(0, 20) + '...');
            console.log('🌐 API URL:', API_URL);

            // Validate token and get user data
            try {
                const response = await fetch(`${API_URL}/auth/validate-token`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ token }),
                });

                console.log('📡 Response status:', response.status);
                const data = await response.json();
                console.log('📦 Response data:', data);

                if (data.success && data.data.valid) {
                    console.log('✅ Token validated');

                    // Clear existing auth data (only auth keys)
                    localStorage.removeItem('token');
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('user');
                    localStorage.removeItem('refreshToken');
                    document.cookie = 'token=; path=/; max-age=0';

                    // Store the new token and user data
                    localStorage.setItem('token', token);
                    localStorage.setItem('user', JSON.stringify(data.data.user));
                    document.cookie = `token=${token}; path=/; max-age=86400; SameSite=Lax`;

                    console.log('✅ Authentication complete, stored token and user data');

                    // Dispatch custom event to notify AuthProvider immediately
                    window.dispatchEvent(new Event('auth-updated'));

                    // Determine redirect based on user role
                    const userRole = getUserRoleFromToken(token);
                    const redirectPath = getRoleRedirectPath(userRole);

                    console.log('✅ Dispatched auth-updated event, redirecting to', redirectPath);

                    // Use window.location for immediate synchronous redirect
                    // This ensures the cookie is fully set before navigation
                    window.location.href = redirectPath;
                } else {
                    console.error('❌ Invalid token');
                    window.location.href = `${WEBSITE_URL}/routes/login`;
                }
            } catch (error) {
                console.error('❌ Validation failed:', error);
                window.location.href = `${WEBSITE_URL}/routes/login`;
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

export default function AuthTransferPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <h2 className="text-xl font-semibold text-gray-900">Loading...</h2>
                </div>
            </div>
        }>
            <AuthTransferContent />
        </Suspense>
    );
}
