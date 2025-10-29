import axios from 'axios';
import message from 'antd/es/message';
import { jwtDecode } from 'jwt-decode';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface IUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
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
                this.token = window.localStorage.getItem('token');
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
        return this.token;
    }

    isAuthenticated(): boolean {
        return !!this.token;
    }

    public getUser(): IUser | null {
        if (typeof window === 'undefined') return null;

        try {
            const token = window.localStorage.getItem('token');
            if (!token) return null;

            const decodedToken = jwtDecode(token) as IJwtPayload;
            if (!decodedToken || !decodedToken.user) {
                // Invalid token structure
                window.localStorage.removeItem('token');
                return null;
            }

            // Check if token is expired
            const currentTime = Date.now() / 1000;
            if (decodedToken.exp && decodedToken.exp < currentTime) {
                // Token is expired
                window.localStorage.removeItem('token');
                return null;
            }

            return decodedToken.user;
        } catch (error) {
            console.error('Error getting user data:', error);
            // Clear invalid token
            window.localStorage.removeItem('token');
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
                if (error.response?.status === 401) {
                    this.logout();
                }
                return Promise.reject(error);
            }
        );
    }
}