import { apiClient, PaginatedResponse } from '@/lib/api-client';

export interface Advertisement {
    _id: string;
    title: string;
    description: string;
    imageUrl?: string;
    linkUrl?: string;
    placement: 'home' | 'properties' | 'services' | 'sidebar' | 'banner';
    status: 'active' | 'paused' | 'ended';
    startDate: string;
    endDate: string;
    budget?: number;
    impressions?: number;
    clicks?: number;
    createdAt: string;
    updatedAt: string;
}

export interface AdvertisementFilters {
    page?: number;
    limit?: number;
    placement?: string;
    status?: string;
}

export interface CreateAdvertisementDto {
    title: string;
    description: string;
    imageUrl?: string;
    linkUrl?: string;
    placement: 'home' | 'properties' | 'services' | 'sidebar' | 'banner';
    startDate: string;
    endDate: string;
    budget?: number;
}

export interface UpdateAdvertisementDto extends Partial<CreateAdvertisementDto> {
    status?: 'active' | 'paused' | 'ended';
}

export const advertisementsApi = {
    // Get all advertisements with filters and pagination
    getAll: async (filters?: AdvertisementFilters) => {
        const params = new URLSearchParams();
        if (filters?.page) params.append('page', filters.page.toString());
        if (filters?.limit) params.append('limit', filters.limit.toString());
        if (filters?.placement) params.append('placement', filters.placement);
        if (filters?.status) params.append('status', filters.status);

        return apiClient.get<PaginatedResponse<Advertisement>>(`/advertisements?${params.toString()}`);
    },

    // Get single advertisement by ID
    getById: async (id: string) => {
        return apiClient.get<Advertisement>(`/advertisements/${id}`);
    },

    // Create new advertisement
    create: async (data: CreateAdvertisementDto) => {
        return apiClient.post<Advertisement>('/advertisements', data);
    },

    // Update advertisement
    update: async (id: string, data: UpdateAdvertisementDto) => {
        return apiClient.patch<Advertisement>(`/advertisements/${id}`, data);
    },

    // Delete advertisement
    delete: async (id: string) => {
        return apiClient.delete<void>(`/advertisements/${id}`);
    },

    // Get advertisement statistics
    getStats: async (id: string) => {
        return apiClient.get<{ impressions: number; clicks: number; ctr: number }>(`/advertisements/${id}/stats`);
    },
};
