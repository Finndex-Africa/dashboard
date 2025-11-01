import { ReactNode } from 'react';

export type UserRole = 'admin' | 'agent' | 'landlord' | 'service_provider' | 'home_seeker';
export type UserStatus = 'active' | 'inactive' | 'pending' | 'blocked';

export interface User {
  _id: string;
  id?: string; // For backward compatibility
  firstName?: string;
  lastName?: string;
  name?: string;
  email: string;
  phone: string;
  avatar?: string;
  userType: UserRole;
  role?: UserRole; // For backward compatibility
  status: string;
  verified: boolean;
  phoneVerified: boolean;
  blocked: boolean;
  blockedReason?: string;
  blockedAt?: string;
  createdAt: string;
  updatedAt?: string;
  lastActive?: string;
  properties?: number;
  bookings?: number;
  revenue?: number;
  successRate?: number;
}

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  homeSeeker: number;
  landlord: number;
  agent: number;
  serviceProvider: number;
  newUsersThisMonth: number;
  verifiedUsers: number;
}

export interface KPIData {
  title: string;
  value: number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon: ReactNode;
  color?: string;
  prefix?: string;
  suffix?: string;
}

export interface PaginationMeta {
  current: number;
  pageSize: number;
  total: number;
}