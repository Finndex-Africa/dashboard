import type { Currency } from '@/lib/currency/config';

// ─── Enums ────────────────────────────────────────────────────────────────────

export type BuySellCategory = 'land' | 'house' | 'household_item';
export type BuySellStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export type LandSubcategory = 'residential' | 'commercial' | 'beach' | 'farm';
export type HouseholdItemSubcategory =
    | 'furniture'
    | 'electronics'
    | 'kitchen_item'
    | 'office_equipment';
export type LandUnit = 'acres' | 'lots' | 'square_feet' | 'square_meters';
export type ItemCondition = 'new' | 'fairly_used';

// ─── Seller (populated on reads) ─────────────────────────────────────────────

export interface BuySellSeller {
    _id: string;
    firstName: string;
    lastName: string;
    /** Computed full name */
    name: string;
    email: string;
    avatar: string | null;
    phone: string;
    verified: boolean;
    userType: string;
}

// ─── Main listing document ────────────────────────────────────────────────────

export interface BuySellListing {
    _id: string;

    // ── Shared ──────────────────────────────────────────────────────────────
    title: string;
    description: string;
    category: BuySellCategory;
    price: number;
    /** Currency the owner priced in; absent on pre-multi-currency rows (all USD). */
    currency?: Currency;
    /** Backend-normalized USD price. Use this, never raw `price`, for any total. */
    priceUsd?: number;
    location: string;
    images: string[];
    status: BuySellStatus;
    /** Admin-controlled featured flag; default false */
    isPremium: boolean;
    sellerId: string | BuySellSeller;
    views: number;
    saves: number;
    rejectionReason?: string;
    approvedAt?: string;
    mapCoordinates?: { lat: number; lng: number };
    /** Agent fee set by agent/agency sellers or admin */
    agentFee?: number;

    // ── Land ────────────────────────────────────────────────────────────────
    landSubcategory?: LandSubcategory;
    landSize?: number;
    unit?: LandUnit;
    ownershipStatus?: string;
    sellerPhone?: string;
    whatsappNumber?: string;

    // ── House ───────────────────────────────────────────────────────────────
    // Note: houseSubcategory removed — propertyType now serves as the type selector
    bedrooms?: number;
    bathrooms?: number;
    propertyType?: string;
    amenities?: Array<{ icon?: string; label: string; description?: string | null }>;

    // ── Household Item ───────────────────────────────────────────────────────
    itemSubcategory?: HouseholdItemSubcategory;
    condition?: ItemCondition;
    warranty?: boolean;
    deliveryAvailable?: boolean;

    createdAt: string;
    updatedAt: string;
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface CreateBuySellDto {
    title: string;
    description: string;
    category: BuySellCategory;
    price: number;
    /** Currency the seller is pricing in; the backend normalizes to USD. */
    currency?: Currency;
    location: string;
    images?: string[];
    agentFee?: number;
    // Land
    landSubcategory?: LandSubcategory;
    landSize?: number;
    unit?: LandUnit;
    ownershipStatus?: string;
    sellerPhone?: string;
    whatsappNumber?: string;
    // House
    bedrooms?: number;
    bathrooms?: number;
    propertyType?: string;
    amenities?: Array<{ icon?: string; label: string; description?: string | null }>;
    // Household
    itemSubcategory?: HouseholdItemSubcategory;
    condition?: ItemCondition;
    warranty?: boolean;
    deliveryAvailable?: boolean;
}

export interface UpdateBuySellDto {
    title?: string;
    description?: string;
    price?: number;
    /** Currency the seller is pricing in; the backend normalizes to USD. */
    currency?: Currency;
    location?: string;
    images?: string[];
    isPremium?: boolean;
    agentFee?: number;
    // Land
    landSubcategory?: LandSubcategory;
    landSize?: number;
    unit?: LandUnit;
    ownershipStatus?: string;
    sellerPhone?: string;
    whatsappNumber?: string;
    // House
    bedrooms?: number;
    bathrooms?: number;
    propertyType?: string;
    amenities?: Array<{ icon?: string; label: string; description?: string | null }>;
    // Household
    itemSubcategory?: HouseholdItemSubcategory;
    condition?: ItemCondition;
    warranty?: boolean;
    deliveryAvailable?: boolean;
}
