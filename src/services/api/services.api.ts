import { apiClient, PaginatedResponse } from '@/lib/api-client';
import { Service } from '@/types/dashboard';

export interface ServiceFilters {
    page?: number;
    limit?: number;
    category?: string;
    status?: string;
    minPrice?: number;
    maxPrice?: number;
    location?: string;
    verified?: boolean;
}

export interface CreateServiceDto {
    title: string;
    category: string;
    description: string;
    location: string;
    price: number;
    priceUnit?: string;
    duration?: number;
    included?: string[];
    tags?: string[];
    images?: string[];
    businessName?: string;
    experience?: number;
    phoneNumber?: string;
    whatsappNumber?: string;
}

export interface UpdateServiceDto extends Partial<CreateServiceDto> {}

export const servicesApi = {
    // Get all services with filters and pagination
    getAll: async (filters?: ServiceFilters) => {
        const params = new URLSearchParams();
        if (filters?.page) params.append('page', filters.page.toString());
        if (filters?.limit) params.append('limit', filters.limit.toString());
        if (filters?.category) params.append('category', filters.category);
        if (filters?.status) params.append('status', filters.status);
        if (filters?.minPrice) params.append('minPrice', filters.minPrice.toString());
        if (filters?.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
        if (filters?.location) params.append('location', filters.location);
        if (filters?.verified !== undefined) params.append('verified', filters.verified.toString());

        return apiClient.get<PaginatedResponse<Service>>(`/services?${params.toString()}`);
    },

    // Get single service by ID
    getById: async (id: string) => {
        return apiClient.get<Service>(`/services/${id}`);
    },

    // Get current user's services
    getMyServices: async () => {
        return apiClient.get<Service[]>('/services/my-services');
    },

    // Get featured services
    getFeatured: async (limit?: number) => {
        const params = limit ? `?limit=${limit}` : '';
        return apiClient.get<Service[]>(`/services/featured${params}`);
    },

    // Get verified services
    getVerified: async (page?: number, limit?: number) => {
        const params = new URLSearchParams();
        if (page) params.append('page', page.toString());
        if (limit) params.append('limit', limit.toString());
        return apiClient.get<PaginatedResponse<Service>>(`/services/verified?${params.toString()}`);
    },

    // Get services by category
    getByCategory: async (category: string) => {
        return apiClient.get<Service[]>(`/services/category/${category}`);
    },

    // Create new service
    create: async (data: CreateServiceDto) => {
        return apiClient.post<Service>('/services', data);
    },

    // Update service
    update: async (id: string, data: UpdateServiceDto) => {
        return apiClient.patch<Service>(`/services/${id}`, data);
    },

    // Delete service
    delete: async (id: string) => {
        return apiClient.delete<void>(`/services/${id}`);
    },

    // Search services
    search: async (query: string) => {
        return apiClient.get<Service[]>(`/services/search?q=${encodeURIComponent(query)}`);
    },

    // Verify service (Admin only) - This approves the service
    verify: async (id: string) => {
        return apiClient.patch<Service>(`/services/${id}/verify`, {});
    },

    // Reject service (Admin only)
    reject: async (id: string, rejectionReason: string) => {
        return apiClient.patch<Service>(`/services/${id}/reject`, { rejectionReason });
    },

    // Mark as featured (Admin only)
    feature: async (id: string, days: number) => {
        return apiClient.patch<Service>(`/services/${id}/feature?days=${days}`, {});
    },
};
