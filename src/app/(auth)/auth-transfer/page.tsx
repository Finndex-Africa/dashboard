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
                // Remove only auth-related storage keys to avoid wiping developer logs
                localStorage.removeItem('token');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                localStorage.removeItem('refreshToken');
                document.cookie = 'token=; path=/; max-age=0';
                return;
            }

            const token = searchParams.get('token');

            if (!token) {
                console.error('❌ No token provided');
                window.location.href = `${WEBSITE_URL}/routes/login`;
                return;
            }

            // Validate token and get user data with timeout
            try {
                // Add timeout to prevent indefinite waiting
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

                const response = await fetch(`${API_URL}/auth/validate-token`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ token }),
                    signal: controller.signal,
                });

                clearTimeout(timeoutId);

                const data = await response.json();

                if (data.success && data.data.valid) {
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

                    // Dispatch custom event to notify AuthProvider immediately
                    window.dispatchEvent(new Event('auth-updated'));

                    // Determine redirect based on user role
                    const userRole = getUserRoleFromToken(token);
                    const redirectPath = getRoleRedirectPath(userRole);

                    // Use window.location for immediate synchronous redirect
                    // This ensures the cookie is fully set before navigation
                    window.location.href = redirectPath;
                } else {
                    console.error('❌ Invalid token');
                    window.location.href = `${WEBSITE_URL}/routes/login`;
                }
            } catch (error: any) {
                console.error('❌ Validation failed:', error);

                // Check if it's a timeout error
                if (error.name === 'AbortError') {
                    console.error('❌ Request timed out after 10 seconds');
                    alert('Authentication is taking longer than expected. Please check your connection and try again.');
                } else {
                    console.error('❌ Error details:', error.message);
                }

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
