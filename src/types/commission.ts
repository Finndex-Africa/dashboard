export interface Commission {
  _id: string;
  paymentId: string;
  bookingId?: string;
  propertyId?: string;
  type: 'booking_fee' | 'service_fee' | 'listing_fee' | 'premium_fee' | 'advertisement_fee';
  totalAmount: number;
  platformFee: number;
  platformFeePercentage: number;
  agentFee: number;
  agentFeePercentage: number;
  agentId?: string | {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  serviceProviderId?: string | {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  customerId: string | {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  status: 'pending' | 'processed' | 'paid_out' | 'failed' | 'refunded';
  payoutDate?: string;
  payoutReference?: string;
  payoutMethod?: string;
  settled: boolean;
  settledAt?: string;
  settlementBatch?: string;
  currency: string;
  metadata?: Record<string, any>;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommissionStats {
  totalCommissions: number;
  platformRevenue: number;
  agentEarnings: number;
  pendingPayouts: number;
  completedPayouts: number;
}
