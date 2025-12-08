import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthService, IUser } from '@/services/auth.service';

interface AuthContextType {
    isAuthenticated: boolean;
    user: IUser | null;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
    isAuthenticated: false,
    user: null,
    logout: () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<IUser | null>(null);
    const auth = AuthService.getInstance();

    useEffect(() => {
        // Check authentication status on mount and when storage changes
        const checkAuth = () => {
            // Force refresh token from storage to ensure we check both keys
            auth.refreshToken();
            const token = auth.getToken();
            const currentUser = auth.getUser();

            if (token && currentUser && currentUser.role) {
                setIsAuthenticated(true);
                setUser(currentUser);
            } else if (token && !currentUser) {
                // Token exists but user data is invalid - clear auth
                auth.logout();
                setIsAuthenticated(false);
                setUser(null);
            } else {
                setIsAuthenticated(false);
                setUser(null);
            }
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
        <AuthContext.Provider value={{ isAuthenticated, user, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}