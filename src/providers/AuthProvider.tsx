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
        // Check authentication status on mount
        const checkAuth = () => {
            const token = auth.getToken();
            const currentUser = auth.getUser();
            setIsAuthenticated(!!token);
            setUser(currentUser);
        };

        checkAuth();
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