/**
 * Properties page utilities
 * Phase 2: Query-driven views for /properties
 */

import type { CreatePropertyDto } from '@/services/api/properties.api';
import type { Property, PropertyPosterRef } from '@/types/dashboard';
import { UserRole } from './role-redirects';
import { isAgentLikeRole, canSetAgentFee } from './role-utils';

/** Bedroom count from either field (dashboard form uses bedrooms; main app may store rooms). */
export function getPropertyBedroomCount(property: {
    bedrooms?: number;
    rooms?: number;
}): number | undefined {
    return property.bedrooms ?? property.rooms;
}

/** Map form values to API payload (bedrooms → rooms, same as main FindAfriq app). */
export function mapPropertyFormToApi(
    values: Record<string, unknown>,
    options?: { includeAgentFee?: boolean },
): CreatePropertyDto & Record<string, unknown> {
    const { bedrooms, bathrooms, agentFee, ...rest } = values;
    const payload = { ...rest } as CreatePropertyDto & Record<string, unknown>;

    if (bedrooms !== undefined && bedrooms !== null && bedrooms !== '') {
        const count = Number(bedrooms);
        payload.rooms = count;
        payload.bedrooms = count;
    }
    if (bathrooms !== undefined && bathrooms !== null && bathrooms !== '') {
        payload.bathrooms = Number(bathrooms);
    }

    if (options?.includeAgentFee && agentFee !== undefined && agentFee !== null && agentFee !== '') {
        payload.agentFee = Number(agentFee);
    } else {
        delete payload.agentFee;
    }

    return payload;
}

/** Prefill edit form when listing only has rooms (legacy / main-app submissions). */
export function mapPropertyToFormValues(property: Property): Partial<Property> {
    return {
        ...property,
        bedrooms: getPropertyBedroomCount(property),
    };
}

/** Resolve the primary poster ref (landlordId is the listing owner on the backend). */
export function getPropertyPosterRef(property: {
    agentId?: PropertyPosterRef;
    landlordId?: PropertyPosterRef;
    userId?: PropertyPosterRef;
    owner?: PropertyPosterRef;
}): PropertyPosterRef | undefined {
    return property.landlordId ?? property.agentId ?? property.userId ?? property.owner;
}

/** userType from a populated poster ref, when the API includes it. */
export function getPropertyPosterUserType(property: {
    agentId?: PropertyPosterRef;
    landlordId?: PropertyPosterRef;
    userId?: PropertyPosterRef;
    owner?: PropertyPosterRef;
}): string | undefined {
    const refs = [property.landlordId, property.agentId, property.userId, property.owner];
    for (const ref of refs) {
        if (typeof ref === 'object' && ref?.userType) {
            return ref.userType;
        }
    }
    return undefined;
}

/** True when the listing was posted by an agent or real estate agency account. */
export function isPropertyPostedByAgentLike(property: {
    agentId?: PropertyPosterRef;
    landlordId?: PropertyPosterRef;
    userId?: PropertyPosterRef;
    owner?: PropertyPosterRef;
}): boolean {
    const posterType = getPropertyPosterUserType(property);
    return posterType ? isAgentLikeRole(posterType) : false;
}

/** Show/send agent fee: agent/agency on own listings, or admin on agent/agency listings. */
export function canEditPropertyAgentFee(
    role: UserRole | string | undefined,
    property?: {
        agentId?: PropertyPosterRef;
        landlordId?: PropertyPosterRef;
        userId?: PropertyPosterRef;
        owner?: PropertyPosterRef;
    } | null,
): boolean {
    if (canSetAgentFee(role)) return true;
    if (!property) return false;
    const isAdmin = role === 'admin' || role === 'admin_property';
    return isAdmin && isPropertyPostedByAgentLike(property);
}

/** Display name for the user who posted the property (matches admin review modal "Listed By"). */
export function getPropertyPosterDisplayName(property: {
    agentId?: PropertyPosterRef;
    landlordId?: PropertyPosterRef;
    userId?: PropertyPosterRef;
    owner?: PropertyPosterRef;
}): string {
    const raw = property.agentId ?? property.landlordId ?? property.userId ?? property.owner;
    if (raw == null || raw === '') return '—';
    if (typeof raw === 'string') return raw;
    const fullName = `${raw.firstName ?? ''} ${raw.lastName ?? ''}`.trim();
    return fullName || raw.name || raw.email || raw._id || '—';
}

/** Resolve poster id for ownership checks when agentId/landlordId may be populated objects. */
export function propertyPosterId(ref: PropertyPosterRef | undefined): string | undefined {
    if (ref == null || ref === '') return undefined;
    if (typeof ref === 'string') return ref;
    return ref._id;
}

export type PropertyView = 'all' | 'mine' | 'pending';
export type PropertyTab = 'active' | 'saved';

/**
 * Get default view for a user role
 */
export function getDefaultPropertyView(role: UserRole | string): PropertyView {
  switch (role) {
    case 'agent':
    case 'real_estate_agency':
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
  return ['agent', 'real_estate_agency', 'landlord', 'admin'].includes(role);
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
  return isAgentLikeRole(role) || role === 'landlord';
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
