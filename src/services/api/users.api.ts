import { apiClient, PaginatedResponse } from '@/lib/api-client';
import { User } from '@/types/users';

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

    // Get all users without pagination (for verification operations)
    getAllUsers: async () => {
        return apiClient.get<User[]>(`/admin/users/all`);
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

    // Verify user (Admin only) - Try dedicated endpoint first, then fallback
    verify: async (id: string) => {
        try {
            // Try dedicated verify endpoint first
            return await apiClient.patch<User>(`/admin/users/${id}/verify`, {});
        } catch (error: any) {
            // If 404, the endpoint doesn't exist - fetch user and update with required fields
            if (error?.response?.status === 404) {
                try {
                    // Get the current user data
                    const userResponse = await apiClient.get<User>(`/admin/users/${id}`);
                    const userData = userResponse.data;

                    // Update with only verified status and userType (email/phone are immutable)
                    return apiClient.patch<User>(`/admin/users/${id}`, {
                        verified: true,
                        userType: userData.userType,
                    });
                } catch (fetchError) {
                    console.error('Failed to fetch user for verification:', fetchError);
                    throw error; // Throw original error if fetch fails
                }
            }
            throw error;
        }
    },

    // Unverify user (Admin only) - Try dedicated endpoint first, then fallback
    unverify: async (id: string) => {
        try {
            // Try dedicated unverify endpoint first
            return await apiClient.patch<User>(`/admin/users/${id}/unverify`, {});
        } catch (error: any) {
            // If 404, the endpoint doesn't exist - fetch user and update with required fields
            if (error?.response?.status === 404) {
                try {
                    // Get the current user data
                    const userResponse = await apiClient.get<User>(`/admin/users/${id}`);
                    const userData = userResponse.data;

                    // Update with only verified status and userType (email/phone are immutable)
                    return apiClient.patch<User>(`/admin/users/${id}`, {
                        verified: false,
                        userType: userData.userType,
                    });
                } catch (fetchError) {
                    console.error('Failed to fetch user for unverification:', fetchError);
                    throw error; // Throw original error if fetch fails
                }
            }
            throw error;
        }
    },
};
