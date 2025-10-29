import { apiClient, PaginatedResponse } from '@/lib/api-client';

export interface User {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'ADMIN' | 'LANDLORD' | 'AGENT' | 'SERVICE_PROVIDER' | 'HOME_SEEKER';
    phoneNumber?: string;
    profilePicture?: string;
    verified: boolean;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface UserFilters {
    page?: number;
    limit?: number;
    userType?: string;
    verified?: boolean;
    active?: boolean;
}

export interface UpdateUserDto {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    profilePicture?: string;
    role?: string;
    active?: boolean;
}

export const usersApi = {
    // Get all users (Admin only)
    getAll: async (filters?: UserFilters) => {
        const params = new URLSearchParams();
        if (filters?.page) params.append('page', filters.page.toString());
        if (filters?.limit) params.append('limit', filters.limit.toString());
        if (filters?.userType) params.append('userType', filters.userType);
        if (filters?.verified !== undefined) params.append('verified', filters.verified.toString());
        if (filters?.active !== undefined) params.append('active', filters.active.toString());

        return apiClient.get<PaginatedResponse<User>>(`/admin/users?${params.toString()}`);
    },

    // Get single user by ID (Admin only)
    getById: async (id: string) => {
        return apiClient.get<User>(`/admin/users/${id}`);
    },

    // Update user (Admin only)
    update: async (id: string, data: UpdateUserDto) => {
        return apiClient.patch<User>(`/admin/users/${id}`, data);
    },

    // Delete user (Admin only)
    delete: async (id: string) => {
        return apiClient.delete<void>(`/admin/users/${id}`);
    },

    // Get current user profile
    getMe: async () => {
        return apiClient.get<User>('/auth/me');
    },
};
