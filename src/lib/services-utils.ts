/**
 * Services page utilities
 * Phase 3: Mirror of properties-utils pattern
 */

import type { Service } from '@/types/dashboard';
import { UserRole } from './role-redirects';

const OBJECT_ID_HEX = /^[a-f\d]{24}$/i;

/**
 * Resolved provider label for tables and admin review modal.
 */
export function getServiceProviderLabel(service: Service): string {
  const direct = service.providerName?.trim();
  if (direct) return direct;

  const p = service.provider;
  if (typeof p === 'string' && p.trim()) {
    if (OBJECT_ID_HEX.test(p)) return '';
    return p.trim();
  }
  if (p && typeof p === 'object' && p.name?.trim()) {
    return p.name.trim();
  }
  return '';
}

/**
 * Category for display — prefers API label, else formats slug.
 */
export function getServiceCategoryLabel(service: Service): string {
  const label = service.categoryLabel?.trim();
  if (label) return label;
  const c = service.category?.trim();
  if (!c) return '';
  return c
    .replace(/_/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Business / company line for admin views.
 */
export function getServiceBusinessLabel(service: Service): string {
  return service.businessName?.trim() || '';
}
/**
 * Normalize image URLs to a usable list (handles optional API quirks).
 */
export function getServiceImageUrls(service: Service): string[] {
  const raw = service.images;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === 'string') return item.trim();
      return '';
    })
    .filter(Boolean);
}

export type ServiceView = 'all' | 'mine' | 'pending';
export type ServiceTab = 'active' | 'saved';

/**
 * Get default view for a user role
 */
export function getDefaultServiceView(role: UserRole | string): ServiceView {
  switch (role) {
    case 'service_provider':
      return 'mine';
    case 'admin':
      return 'all';
    case 'home_seeker':
    default:
      return 'all'; // home_seekers don't use view param, they use tab
  }
}

/**
 * Get default tab for home_seekers
 */
export function getDefaultServiceTab(): ServiceTab {
  return 'active';
}

/**
 * Service awaiting first-time admin review.
 * Backend may set status: "pending" without verificationStatus on new submissions.
 */
export function serviceNeedsReview(service: Service): boolean {
  if (service.status !== 'pending') return false;
  return !service.verificationStatus || service.verificationStatus === 'pending';
}

/**
 * Already verified but status is still pending (e.g. after an admin edit reset status).
 */
export function serviceNeedsActivation(service: Service): boolean {
  return service.status === 'pending' && service.verificationStatus === 'verified';
}

/**
 * Check if user can create services
 */
export function canCreateService(role: UserRole | string): boolean {
  return ['service_provider', 'admin'].includes(role);
}

/**
 * Check if user can see all services
 */
export function canViewAllServices(role: UserRole | string): boolean {
  return role === 'admin';
}

/**
 * Check if user can verify/reject services
 */
export function canModerateServices(role: UserRole | string): boolean {
  return role === 'admin';
}

/**
 * Check if user is a service provider
 */
export function isServiceProvider(role: UserRole | string): boolean {
  return role === 'service_provider';
}

/**
 * Check if user is a home seeker
 */
export function isHomeSeeker(role: UserRole | string): boolean {
  return role === 'home_seeker';
}

/**
 * Saved services manager (localStorage-based, client-side only)
 * Mirror of savedPropertiesManager pattern
 */
export const savedServicesManager = {
  STORAGE_KEY: 'saved_services',

  /**
   * Get all saved service IDs for current user
   */
  getSavedIds(): string[] {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  },

  /**
   * Check if a service is saved
   */
  isSaved(serviceId: string): boolean {
    return this.getSavedIds().includes(serviceId);
  },

  /**
   * Save a service
   */
  save(serviceId: string): void {
    if (typeof window === 'undefined') return;
    const saved = this.getSavedIds();
    if (!saved.includes(serviceId)) {
      saved.push(serviceId);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(saved));
    }
  },

  /**
   * Unsave a service
   */
  unsave(serviceId: string): void {
    if (typeof window === 'undefined') return;
    const saved = this.getSavedIds();
    const filtered = saved.filter(id => id !== serviceId);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
  },

  /**
   * Toggle saved status
   */
  toggle(serviceId: string): boolean {
    if (this.isSaved(serviceId)) {
      this.unsave(serviceId);
      return false;
    } else {
      this.save(serviceId);
      return true;
    }
  },

  /**
   * Clear all saved services
   */
  clear(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.STORAGE_KEY);
  },
};
