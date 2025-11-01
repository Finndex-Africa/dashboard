import { apiClient, PaginatedResponse } from '@/lib/api-client';
import { Booking } from '@/types/dashboard';

export interface BookingFilters {
    page?: number;
    limit?: number;
    status?: string;
    userId?: string;
    serviceId?: string;
    providerId?: string;
}

export interface CreateBookingDto {
    serviceId: string;
    scheduledDate: string;
    duration: number;
    contactPhone: string;
    notes?: string;
    serviceLocation?: string;
    serviceAddress?: string;
}

export interface UpdateBookingDto extends Partial<CreateBookingDto> {
    status?: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'in_progress' | 'rejected';
}

export const bookingsApi = {
    // Get all bookings with filters and pagination
    getAll: async (filters?: BookingFilters) => {
        const params = new URLSearchParams();
        if (filters?.page) params.append('page', filters.page.toString());
        if (filters?.limit) params.append('limit', filters.limit.toString());
        if (filters?.status) params.append('status', filters.status);
        if (filters?.userId) params.append('userId', filters.userId);
        if (filters?.serviceId) params.append('serviceId', filters.serviceId);
        if (filters?.providerId) params.append('providerId', filters.providerId);

        return apiClient.get<PaginatedResponse<Booking>>(`/bookings?${params.toString()}`);
    },

    // Get single booking by ID
    getById: async (id: string) => {
        return apiClient.get<Booking>(`/bookings/${id}`);
    },

    // Create new booking
    create: async (data: CreateBookingDto) => {
        return apiClient.post<Booking>('/bookings', data);
    },

    // Update booking
    update: async (id: string, data: UpdateBookingDto) => {
        return apiClient.patch<Booking>(`/bookings/${id}`, data);
    },

    // Delete booking
    delete: async (id: string) => {
        return apiClient.delete<void>(`/bookings/${id}`);
    },
};
