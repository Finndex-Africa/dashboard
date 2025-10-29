import { ReactNode } from 'react';

export type UserRole = 'admin' | 'agent' | 'landlord' | 'service_provider' | 'home_seeker' | 'guest';
export type UserStatus = 'active' | 'inactive' | 'pending' | 'blocked';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
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