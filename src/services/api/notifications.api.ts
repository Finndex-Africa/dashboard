import { apiClient, PaginatedResponse } from '@/lib/api-client';
import { Notification } from '@/types/dashboard';

export interface NotificationFilters {
    page?: number;
    limit?: number;
    read?: boolean;
    type?: 'info' | 'success' | 'warning' | 'error';
}

export interface CreateNotificationDto {
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    link?: string;
}

export interface UpdateNotificationDto extends Partial<CreateNotificationDto> {
    read?: boolean;
}

export const notificationsApi = {
    // Get all notifications with filters and pagination
    getAll: async (filters?: NotificationFilters) => {
        const params = new URLSearchParams();
        if (filters?.page) params.append('page', filters.page.toString());
        if (filters?.limit) params.append('limit', filters.limit.toString());
        if (filters?.read !== undefined) params.append('read', filters.read.toString());
        if (filters?.type) params.append('type', filters.type);

        return apiClient.get<PaginatedResponse<Notification>>(`/notifications?${params.toString()}`);
    },

    // Get single notification by ID
    getById: async (id: string) => {
        return apiClient.get<Notification>(`/notifications/${id}`);
    },

    // Mark notification as read
    markAsRead: async (id: string) => {
        return apiClient.patch<Notification>(`/notifications/${id}/read`, {});
    },

    // Mark all notifications as read
    markAllAsRead: async () => {
        return apiClient.patch<void>('/notifications/read-all', {});
    },

    // Create new notification
    create: async (data: CreateNotificationDto) => {
        return apiClient.post<Notification>('/notifications', data);
    },

    // Update notification
    update: async (id: string, data: UpdateNotificationDto) => {
        return apiClient.patch<Notification>(`/notifications/${id}`, data);
    },

    // Delete notification
    delete: async (id: string) => {
        return apiClient.delete<void>(`/notifications/${id}`);
    },
};
