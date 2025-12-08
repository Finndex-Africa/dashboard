import { apiClient, PaginatedResponse } from '@/lib/api-client';
import type { Referral, ReferralStats } from '@/types/referral';

export const referralsApi = {
  // Generate referral code for current user
  generateCode: async () => {
    return apiClient.post<{ code: string }>('/referrals/generate-code', {});
  },

  // Get user's referral code
  getMyCode: async () => {
    return apiClient.get<{ code: string }>('/referrals/my-code');
  },

  // Apply referral code
  applyReferralCode: async (referralCode: string) => {
    return apiClient.post<Referral>('/referrals/apply', { referralCode });
  },

  // Get user's referrals
  getMyReferrals: async (page?: number, limit?: number) => {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());

    return apiClient.get<PaginatedResponse<Referral>>(
      `/referrals?${params.toString()}`,
    );
  },

  // Get user's referral statistics
  getStats: async () => {
    return apiClient.get<ReferralStats>('/referrals/stats');
  },

  // Claim referral reward
  claimReward: async (referralId: string) => {
    return apiClient.post<Referral>(`/referrals/${referralId}/claim`, {});
  },

  // Validate referral code (public)
  validateCode: async (code: string) => {
    return apiClient.get<{
      referrerName: string;
      referrerEmail: string;
      referrerAvatar?: string;
      rewardForReferee: number;
    }>(`/referrals/validate/${code}`);
  },
};
