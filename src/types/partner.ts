export interface Partner {
  _id: string;
  organizationName: string;
  type:
    | 'university'
    | 'school'
    | 'youth_network'
    | 'real_estate_association'
    | 'real_estate_agency'
    | 'fintech_provider'
    | 'media_outlet'
    | 'local_printer'
    | 'government_agency'
    | 'ngo'
    | 'corporate'
    | 'other';
  description?: string;
  logo?: string;
  contactEmail: string;
  contactPhone: string;
  contactPerson?: string;
  contactPosition?: string;
  address?: string;
  city?: string;
  country?: string;
  website?: string;
  status: 'active' | 'inactive' | 'pending' | 'suspended' | 'expired';
  partnershipStartDate: string;
  partnershipEndDate?: string;
  partnershipType?:
    | 'field_agent_network'
    | 'payment_provider'
    | 'marketing'
    | 'listing_partner'
    | 'referral'
    | 'data_sharing';
  agreementDocument?: string;
  agreementNumber?: string;
  commissionRate?: number;
  fixedFee?: number;
  billingCycle?: 'monthly' | 'quarterly' | 'yearly' | 'per_transaction';
  totalReferrals: number;
  totalRevenue: number;
  totalCommissionPaid: number;
  totalUsers: number;
  totalListings: number;
  fieldAgents: string[];
  activeAgents: number;
  apiKey?: string;
  apiSecret?: string;
  integrationConfig?: Record<string, any>;
  notes?: string;
  metadata?: Record<string, any>;
  accountManager?: string | {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  lastActivityDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PartnerStats {
  totalPartners: number;
  activePartners: number;
  totalRevenue: number;
  totalUsers: number;
  totalListings: number;
  partnersByType: Record<string, number>;
}
