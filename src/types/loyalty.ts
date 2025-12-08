export interface LoyaltyPoints {
  _id: string;
  userId: string;
  totalPoints: number;
  availablePoints: number;
  usedPoints: number;
  expiredPoints: number;
  lifetimePoints: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  tierProgress: number;
  nextExpiryDate?: string;
  pointsToExpire?: number;
  totalBookings: number;
  totalReferrals: number;
  totalReviews: number;
  totalListings: number;
  totalRewardsClaimed: number;
  totalRewardsValue: number;
  lastPointsEarned?: string;
  lastPointsRedeemed?: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate?: string;
  notificationsEnabled: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface LoyaltyTransaction {
  _id: string;
  userId: string;
  type: 'earned' | 'redeemed' | 'expired' | 'adjusted' | 'bonus' | 'refunded';
  points: number;
  balanceBefore: number;
  balanceAfter: number;
  source:
    | 'booking'
    | 'listing'
    | 'review'
    | 'referral'
    | 'signup'
    | 'profile_complete'
    | 'first_booking'
    | 'first_listing'
    | 'reward_redemption'
    | 'manual_adjustment'
    | 'expiry'
    | 'bonus_campaign'
    | 'streak_bonus'
    | 'tier_upgrade';
  description?: string;
  bookingId?: string;
  propertyId?: string;
  reviewId?: string;
  referralId?: string;
  rewardId?: string;
  expiresAt?: string;
  expired: boolean;
  expiredAt?: string;
  campaignId?: string;
  adjustedBy?: string;
  adjustmentReason?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface LoyaltyTierBenefits {
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  minPoints: number;
  benefits: string[];
  color: string;
  icon: string;
}

export const LOYALTY_TIERS: LoyaltyTierBenefits[] = [
  {
    tier: 'bronze',
    minPoints: 0,
    benefits: ['Earn 1 point per booking', 'Access to basic rewards'],
    color: '#CD7F32',
    icon: '🥉',
  },
  {
    tier: 'silver',
    minPoints: 500,
    benefits: ['Earn 1.5 points per booking', '5% discount on bookings', 'Priority support'],
    color: '#C0C0C0',
    icon: '🥈',
  },
  {
    tier: 'gold',
    minPoints: 2000,
    benefits: ['Earn 2 points per booking', '10% discount on bookings', 'Free listing boost monthly'],
    color: '#FFD700',
    icon: '🥇',
  },
  {
    tier: 'platinum',
    minPoints: 5000,
    benefits: [
      'Earn 3 points per booking',
      '15% discount on bookings',
      'Free premium listing',
      'Dedicated account manager',
    ],
    color: '#E5E4E2',
    icon: '💎',
  },
  {
    tier: 'diamond',
    minPoints: 10000,
    benefits: [
      'Earn 5 points per booking',
      '20% discount on bookings',
      'Unlimited free listings',
      'VIP support',
      'Exclusive events',
    ],
    color: '#B9F2FF',
    icon: '👑',
  },
];
