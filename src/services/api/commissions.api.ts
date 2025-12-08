import { apiClient, PaginatedResponse } from '@/lib/api-client';
import type { Commission, CommissionStats } from '@/types/commission';

export interface CommissionFilters {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  settled?: boolean;
}

export const commissionsApi = {
  // Get all commissions with filters
  getAll: async (filters?: CommissionFilters) => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.status) params.append('status', filters.status);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.settled !== undefined)
      params.append('settled', filters.settled.toString());

    return apiClient.get<PaginatedResponse<Commission>>(
      `/commissions?${params.toString()}`,
    );
  },

  // Get commission statistics
  getStats: async () => {
    return apiClient.get<CommissionStats>('/commissions/stats');
  },

  // Get user's earnings
  getEarnings: async () => {
    return apiClient.get<{
      totalEarnings: number;
      pendingPayouts: number;
      paidOut: number;
      commissionsCount: number;
    }>('/commissions/earnings');
  },

  // Process payout (Admin only)
  processPayout: async (
    commissionId: string,
    payoutDetails: {
      payoutMethod: string;
      payoutReference: string;
    },
  ) => {
    return apiClient.post<Commission>(
      `/commissions/${commissionId}/payout`,
      payoutDetails,
    );
  },

  // Create batch payout (Admin only)
  createBatchPayout: async (commissionIds: string[], batchId: string) => {
    return apiClient.post('/commissions/batch-payout', {
      commissionIds,
      batchId,
    });
  },
};
