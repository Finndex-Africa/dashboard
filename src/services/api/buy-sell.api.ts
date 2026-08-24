import { apiClient } from '@/lib/api-client';
import type {
    BuySellListing,
    BuySellCategory,
    BuySellStatus,
    CreateBuySellDto,
    UpdateBuySellDto,
} from '@/types/buy-sell';

// ─── Filter / response shapes ─────────────────────────────────────────────────

export interface BuySellFilters {
    page?: number;
    limit?: number;
    /** Pass 'all' or omit to skip the filter */
    status?: BuySellStatus | 'all';
    /** Pass 'all' or omit to skip the filter */
    category?: BuySellCategory | 'all';
    search?: string;
}

export interface BuySellPagination {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
}

export interface BuySellListResponse {
    data: BuySellListing[];
    pagination: BuySellPagination;
}

// ─── API module ───────────────────────────────────────────────────────────────

export const buySellApi = {
    // ── Admin: list all listings ─────────────────────────────────────────────

    getAll: async (filters?: BuySellFilters) => {
        const params = new URLSearchParams();
        if (filters?.page)   params.append('page',     filters.page.toString());
        if (filters?.limit)  params.append('limit',    filters.limit.toString());
        if (filters?.status   && filters.status   !== 'all') params.append('status',   filters.status);
        if (filters?.category && filters.category !== 'all') params.append('category', filters.category);
        if (filters?.search)  params.append('search',  filters.search);
        return apiClient.get<BuySellListResponse>(`/admin/buy-sell?${params.toString()}`);
    },

    // ── Admin: pending queue ─────────────────────────────────────────────────

    getPending: async (page = 1, limit = 20) => {
        return apiClient.get<BuySellListResponse>(`/admin/buy-sell/pending?page=${page}&limit=${limit}`);
    },

    // ── Single listing ───────────────────────────────────────────────────────

    getById: async (id: string) => {
        return apiClient.get<BuySellListing>(`/admin/buy-sell/${id}`);
    },

    // ── Create (admin-post — auto-approved by backend) ────────────────────────

    create: async (data: CreateBuySellDto) => {
        return apiClient.post<BuySellListing>('/buy-sell', data);
    },

    // ── Moderation ───────────────────────────────────────────────────────────

    approve: async (id: string) => {
        return apiClient.patch<BuySellListing>(`/admin/buy-sell/${id}/approve`, {});
    },

    reject: async (id: string, rejectionReason: string) => {
        return apiClient.patch<BuySellListing>(`/admin/buy-sell/${id}/reject`, { rejectionReason });
    },

    /** Suspend an approved listing */
    unpublish: async (id: string) => {
        return apiClient.patch<BuySellListing>(`/admin/buy-sell/${id}/unpublish`, {});
    },

    /** Reactivate a suspended listing back to approved */
    republish: async (id: string) => {
        return apiClient.patch<BuySellListing>(`/admin/buy-sell/${id}/republish`, {});
    },

    // ── Edit ─────────────────────────────────────────────────────────────────

    update: async (id: string, data: UpdateBuySellDto) => {
        return apiClient.patch<BuySellListing>(`/admin/buy-sell/${id}`, data);
    },

    // ── Delete ───────────────────────────────────────────────────────────────

    delete: async (id: string) => {
        return apiClient.delete<void>(`/admin/buy-sell/${id}`);
    },

    // ── Featured toggle ──────────────────────────────────────────────────────

    /** Toggle the isPremium (featured) flag — admin only, default false. */
    toggleFeatured: async (id: string, isPremium: boolean) => {
        return apiClient.patch<BuySellListing>(`/admin/buy-sell/${id}`, { isPremium });
    },
};
