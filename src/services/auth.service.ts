import axios from 'axios';
import message from 'antd/es/message';
// Small JWT decoder to avoid relying on package default export in the bundler.
function decodeJwt(token: string): any | null {
    try {
        const parts = token.split('.');
        if (parts.length < 2) return null;
        const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        let json = '';
        if (typeof window === 'undefined') {
            json = Buffer.from(b64, 'base64').toString('utf8');
        } else {
            const str = atob(b64);
            json = decodeURIComponent(
                Array.prototype.map
                    .call(str, (c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join(''),
            );
        }
        return JSON.parse(json);
    } catch (e) {
        return null;
    }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface IUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    avatar?: string;
    phone?: string;
}

export interface IJwtPayload {
    user: IUser;
    exp: number;
    iat: number;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface AuthResponse {
    token: string;
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
    };
}

export class AuthService {
    private static instance: AuthService;
    private token: string | null = null;

    private constructor() {
        // Initialize token from localStorage if it exists
        if (typeof window !== 'undefined') {
            try {
                // Check both 'authToken' (from auth transfer) and 'token' (from direct login)
                this.token = window.localStorage.getItem('authToken') || window.localStorage.getItem('token');
                // Validate stored user data
                const user = this.getUser();
                if (!user) {
                    // If user data is invalid, clear authentication
                    this.token = null;
                    window.localStorage.removeItem('token');
                }
            } catch (error) {
                console.error('Error initializing auth service:', error);
                this.token = null;
            }
        }
    }

    public static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }

    // Force re-initialization of token from storage
    public refreshToken(): void {
        if (typeof window !== 'undefined') {
            this.token = window.localStorage.getItem('authToken') || window.localStorage.getItem('token');
        }
    }

    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        try {
            const response = await axios.post<AuthResponse>(
                `${API_URL}/auth/login`,
                credentials
            );

            const { token, user } = response.data;
            
            if (typeof window !== 'undefined') {
                // Store token and user data
                window.localStorage.setItem('token', token);
                window.localStorage.setItem('user', JSON.stringify(user));
            }
            this.token = token;

            // Set up axios interceptors immediately after successful login
            this.setupAxiosInterceptors();

            return response.data;
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Login failed';
            message.error(errorMessage);
            throw new Error(errorMessage);
        }
    }

    logout(): void {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.token = null;
        window.location.href = '/login';
    }

    getToken(): string | null {
        // Always check storage for the most up-to-date token
        if (typeof window !== 'undefined' && !this.token) {
            this.token = window.localStorage.getItem('authToken') || window.localStorage.getItem('token');
        }
        return this.token;
    }

    isAuthenticated(): boolean {
        return !!this.token;
    }

    public getUser(): IUser | null {
        if (typeof window === 'undefined') return null;

        try {
            // First, try to get user data directly from localStorage (stored during login)
            const storedUserData = window.localStorage.getItem('user');
            if (storedUserData) {
                try {
                    const user = JSON.parse(storedUserData) as any;
                    // Ensure role is set
                    if (user.role) {
                        // Map _id or sub to id if needed
                        if (!user.id) {
                            user.id = user._id || user.sub;
                        }
                        return user as IUser;
                    }
                } catch (error) {
                    console.error('Error parsing stored user data:', error);
                }
            }

            // Fallback: extract from JWT token
            const token = window.localStorage.getItem('authToken') || window.localStorage.getItem('token');
            if (!token) return null;

            const decodedToken = decodeJwt(token) as any;
            if (!decodedToken) {
                window.localStorage.removeItem('token');
                window.localStorage.removeItem('authToken');
                return null;
            }

            // Check if token is expired
            const currentTime = Date.now() / 1000;
            if (decodedToken.exp && decodedToken.exp < currentTime) {
                window.localStorage.removeItem('token');
                window.localStorage.removeItem('authToken');
                window.localStorage.removeItem('user');
                return null;
            }

            // Handle both JWT structures: { user: {...} } or direct user data
            let userData = decodedToken.user || decodedToken;

            // Map _id or sub (JWT standard) to id if needed
            if (!userData.id) {
                userData.id = userData._id || userData.sub;
            }

            // Map userType to role for consistency, handling multiple possible role field names
            if (!userData.role) {
                if (userData.userType) {
                    userData = { ...userData, role: userData.userType };
                } else if (userData.roleType) {
                    userData = { ...userData, role: userData.roleType };
                } else {
                    // If no role can be determined, log warning and return null to force re-authentication
                    console.warn('No role found in user data:', userData);
                    return null;
                }
            }

            return userData as IUser;
        } catch (error) {
            console.error('Error getting user data:', error);
            // Clear invalid token
            window.localStorage.removeItem('token');
            window.localStorage.removeItem('user');
            return null;
        }
    }

    // Add axios interceptor to add token to requests
    setupAxiosInterceptors(): void {
        axios.interceptors.request.use(
            (config) => {
                if (this.token) {
                    config.headers.Authorization = `Bearer ${this.token}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        axios.interceptors.response.use(
            (response) => response,
            (error) => {
                try {
                    const status = error.response?.status;
                    const url = error.config?.url;
                    // eslint-disable-next-line @typescript-eslint/no-var-requires
                    const { logError, logInfo } = require('@/utils/persistentLogger');
                    logError('Dashboard AuthService: axios response error', { status, url, message: error.message });
                    if (status === 401) {
                        // In local development, avoid auto-logout so we can inspect the failing request
                        try {
                            const hostname = (typeof window !== 'undefined' && window.location && window.location.hostname) || '';
                            // eslint-disable-next-line @typescript-eslint/no-var-requires
                            const { logInfo } = require('@/utils/persistentLogger');
                            if (hostname === 'localhost' || hostname === '127.0.0.1') {
                                logInfo('Dashboard AuthService: detected 401 response but skipping auto-logout on localhost', { url });
                            } else {
                                logInfo('Dashboard AuthService: detected 401 response, invoking logout', { url });
                                this.logout();
                            }
                        } catch (e) {
                            // Fallback to logout if check fails
                            this.logout();
                        }
                    }
                } catch (e) {
                    // ignore logging failures
                }
                return Promise.reject(error);
            }
        );
    }
}