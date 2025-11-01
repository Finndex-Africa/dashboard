import { apiClient, PaginatedResponse } from '@/lib/api-client';
import { Property } from '@/types/dashboard';

export interface PropertyFilters {
    page?: number;
    limit?: number;
    propertyType?: string;
    status?: string;
    minPrice?: number;
    maxPrice?: number;
    location?: string;
}

export interface CreatePropertyDto {
    title: string;
    description: string;
    location: string;
    price: number;
    priceUnit?: string;
    propertyType: string;
    rooms?: number;
    furnished?: boolean;
    isPremium?: boolean;
    images?: string[];
    videos?: string[];
    amenities?: string[];
    availableFrom?: string;
    availableTo?: string;
}

export interface UpdatePropertyDto extends Partial<CreatePropertyDto> {}

export const propertiesApi = {
    // Get all properties with filters and pagination
    getAll: async (filters?: PropertyFilters) => {
        const params = new URLSearchParams();
        if (filters?.page) params.append('page', filters.page.toString());
        if (filters?.limit) params.append('limit', filters.limit.toString());
        if (filters?.propertyType) params.append('propertyType', filters.propertyType);
        if (filters?.status) params.append('status', filters.status);
        if (filters?.minPrice) params.append('minPrice', filters.minPrice.toString());
        if (filters?.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
        if (filters?.location) params.append('location', filters.location);

        return apiClient.get<PaginatedResponse<Property>>(`/properties?${params.toString()}`);
    },

    // Get single property by ID
    getById: async (id: string) => {
        return apiClient.get<Property>(`/properties/${id}`);
    },

    // Get current user's properties
    getMyProperties: async (status?: string) => {
        const params = status ? `?status=${status}` : '';
        return apiClient.get<Property[]>(`/properties/my-properties${params}`);
    },

    // Create new property
    create: async (data: CreatePropertyDto) => {
        return apiClient.post<Property>('/properties', data);
    },

    // Update property
    update: async (id: string, data: UpdatePropertyDto) => {
        return apiClient.patch<Property>(`/properties/${id}`, data);
    },

    // Delete property
    delete: async (id: string) => {
        return apiClient.delete<void>(`/properties/${id}`);
    },

    // Search properties
    search: async (query: string) => {
        return apiClient.get<Property[]>(`/properties/search?q=${encodeURIComponent(query)}`);
    },

    // Approve property (Admin only)
    approve: async (id: string) => {
        return apiClient.patch<Property>(`/properties/${id}/approve`, {});
    },

    // Reject property (Admin only)
    reject: async (id: string, rejectionReason: string) => {
        return apiClient.patch<Property>(`/properties/${id}/reject`, { rejectionReason });
    },
};
