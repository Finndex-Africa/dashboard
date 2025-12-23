/**
 * Properties page utilities
 * Phase 2: Query-driven views for /properties
 */

import { UserRole } from './role-redirects';

export type PropertyView = 'all' | 'mine' | 'pending';
export type PropertyTab = 'active' | 'saved';

/**
 * Get default view for a user role
 */
export function getDefaultPropertyView(role: UserRole | string): PropertyView {
  switch (role) {
    case 'agent':
    case 'landlord':
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
export function getDefaultPropertyTab(): PropertyTab {
  return 'active';
}

/**
 * Check if user can create properties
 */
export function canCreateProperty(role: UserRole | string): boolean {
  return ['agent', 'landlord', 'admin'].includes(role);
}

/**
 * Check if user can see all properties
 */
export function canViewAllProperties(role: UserRole | string): boolean {
  return role === 'admin';
}

/**
 * Check if user can approve/reject properties
 */
export function canModerateProperties(role: UserRole | string): boolean {
  return role === 'admin';
}

/**
 * Check if user is a property creator (agent/landlord)
 */
export function isPropertyCreator(role: UserRole | string): boolean {
  return ['agent', 'landlord'].includes(role);
}

/**
 * Check if user is a home seeker
 */
export function isHomeSeeker(role: UserRole | string): boolean {
  return role === 'home_seeker';
}

/**
 * Saved properties manager (localStorage-based, client-side only)
 * In future phases, this should be moved to backend API
 */
export const savedPropertiesManager = {
  STORAGE_KEY: 'saved_properties',

  /**
   * Get all saved property IDs for current user
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
   * Check if a property is saved
   */
  isSaved(propertyId: string): boolean {
    return this.getSavedIds().includes(propertyId);
  },

  /**
   * Save a property
   */
  save(propertyId: string): void {
    if (typeof window === 'undefined') return;
    const saved = this.getSavedIds();
    if (!saved.includes(propertyId)) {
      saved.push(propertyId);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(saved));
    }
  },

  /**
   * Unsave a property
   */
  unsave(propertyId: string): void {
    if (typeof window === 'undefined') return;
    const saved = this.getSavedIds();
    const filtered = saved.filter(id => id !== propertyId);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
  },

  /**
   * Toggle saved status
   */
  toggle(propertyId: string): boolean {
    if (this.isSaved(propertyId)) {
      this.unsave(propertyId);
      return false;
    } else {
      this.save(propertyId);
      return true;
    }
  },

  /**
   * Clear all saved properties
   */
  clear(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.STORAGE_KEY);
  },
};
