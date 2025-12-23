/**
 * Services page utilities
 * Phase 3: Mirror of properties-utils pattern
 */

import { UserRole } from './role-redirects';

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
