import { apiClient, PaginatedResponse } from '@/lib/api-client';
import type { Partner, PartnerStats } from '@/types/partner';

export interface PartnerFilters {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  partnershipType?: string;
}

export const partnersApi = {
  // Create new partner (Admin only)
  create: async (partnerData: Partial<Partner>) => {
    return apiClient.post<Partner>('/partners', partnerData);
  },

  // Get all partners with filters
  getAll: async (filters?: PartnerFilters) => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.type) params.append('type', filters.type);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.partnershipType)
      params.append('partnershipType', filters.partnershipType);

    return apiClient.get<PaginatedResponse<Partner>>(
      `/partners?${params.toString()}`,
    );
  },

  // Get partner by ID
  getById: async (id: string) => {
    return apiClient.get<Partner>(`/partners/${id}`);
  },

  // Update partner
  update: async (id: string, partnerData: Partial<Partner>) => {
    return apiClient.put<Partner>(`/partners/${id}`, partnerData);
  },

  // Deactivate partner
  delete: async (id: string) => {
    return apiClient.delete<void>(`/partners/${id}`);
  },

  // Get partner statistics
  getStats: async () => {
    return apiClient.get<PartnerStats>('/partners/stats/overview');
  },

  // Assign field agent to partner
  assignAgent: async (partnerId: string, agentId: string) => {
    return apiClient.post<Partner>(`/partners/${partnerId}/agents`, {
      agentId,
    });
  },

  // Remove field agent from partner
  removeAgent: async (partnerId: string, agentId: string) => {
    return apiClient.delete<Partner>(
      `/partners/${partnerId}/agents/${agentId}`,
    );
  },
};
