import { apiClient, PaginatedResponse } from '@/lib/api-client';
import type {
  LoyaltyPoints,
  LoyaltyTransaction,
  LoyaltyTierBenefits,
} from '@/types/loyalty';

export const loyaltyApi = {
  // Get user's loyalty points
  getPoints: async () => {
    return apiClient.get<LoyaltyPoints>('/loyalty/points');
  },

  // Get user's transaction history
  getTransactions: async (page?: number, limit?: number) => {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());

    return apiClient.get<PaginatedResponse<LoyaltyTransaction>>(
      `/loyalty/transactions?${params.toString()}`,
    );
  },

  // Redeem points for a reward
  redeemPoints: async (
    points: number,
    rewardId: string,
    description: string,
  ) => {
    return apiClient.post<LoyaltyTransaction>('/loyalty/redeem', {
      points,
      rewardId,
      description,
    });
  },

  // Get tier information and benefits
  getTiers: async () => {
    return apiClient.get<LoyaltyTierBenefits[]>('/loyalty/tiers');
  },
};
