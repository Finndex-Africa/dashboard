import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthService, IUser } from '@/services/auth.service';

interface AuthContextType {
    isAuthenticated: boolean;
    user: IUser | null;
    isLoading: boolean;
    logout: () => void;
    setUser: (user: IUser | null) => void;
}

const AuthContext = createContext<AuthContextType>({
    isAuthenticated: false,
    user: null,
    isLoading: true,
    logout: () => { },
    setUser: () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<IUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const auth = AuthService.getInstance();

    useEffect(() => {
        // Check authentication status on mount and when storage changes
        const checkAuth = () => {
            // Force refresh token from storage to ensure we check both keys
            auth.refreshToken();
            const token = auth.getToken();
            const currentUser = auth.getUser();

            console.log('🔍 AuthProvider - Token:', token ? 'exists' : 'null');
            console.log('🔍 AuthProvider - User:', currentUser);
            console.log('🔍 AuthProvider - User ID:', currentUser?.id);
            console.log('🔍 AuthProvider - User Role:', currentUser?.role);

            if (token && currentUser && currentUser.role) {
                console.log('✅ Auth valid, setting user');
                setIsAuthenticated(true);
                setUser(currentUser);
            } else if (token && !currentUser) {
                // Token exists but user data is invalid - clear auth
                console.log('⚠️ Token exists but no user data, logging out');
                auth.logout();
                setIsAuthenticated(false);
                setUser(null);
            } else {
                console.log('❌ Not authenticated');
                setIsAuthenticated(false);
                setUser(null);
            }
            setIsLoading(false);
        };

        checkAuth();

        // Listen for storage changes (including from auth-transfer page)
        const handleStorageChange = (e: StorageEvent) => {
            // Re-check auth when token or user data changes
            if (e.key === 'token' || e.key === 'user' || e.key === null) {
                checkAuth();
            }
        };

        // Also listen for custom auth event (for same-page updates)
        const handleAuthEvent = () => {
            checkAuth();
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('auth-updated', handleAuthEvent);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('auth-updated', handleAuthEvent);
        };
    }, []);

    const logout = () => {
        auth.logout();
        setIsAuthenticated(false);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, isLoading, logout, setUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}