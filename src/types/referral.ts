export interface Referral {
  _id: string;
  referrerId: string | {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
  refereeId: string | {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
  referralCode: string;
  status: 'pending' | 'completed' | 'rewarded' | 'expired' | 'invalid';
  completedAt?: string;
  completionAction?: string;
  referrerReward: number;
  refereeReward: number;
  rewardType?: 'points' | 'cash' | 'discount' | 'free_listing' | 'premium_upgrade';
  rewardClaimed: boolean;
  rewardClaimedAt?: string;
  campaignId?: string;
  expiresAt?: string;
  metadata?: Record<string, any>;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalRewardsEarned: number;
  totalRewardsClaimed: number;
}
