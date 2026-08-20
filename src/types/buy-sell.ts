// ─── Enums ────────────────────────────────────────────────────────────────────

export type BuySellCategory = 'land' | 'house' | 'household_item';
export type BuySellStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export type LandSubcategory = 'residential' | 'commercial' | 'beach' | 'farm';
export type HouseSubcategory = 'duplex' | 'apartment' | 'commercial';
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

    // ── Land ────────────────────────────────────────────────────────────────
    landSubcategory?: LandSubcategory;
    landSize?: number;
    unit?: LandUnit;
    ownershipStatus?: string;
    sellerPhone?: string;
    whatsappNumber?: string;

    // ── House ───────────────────────────────────────────────────────────────
    houseSubcategory?: HouseSubcategory;
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

export interface UpdateBuySellDto {
    title?: string;
    description?: string;
    price?: number;
    location?: string;
    images?: string[];
    isPremium?: boolean;
    // Land
    landSubcategory?: LandSubcategory;
    landSize?: number;
    unit?: LandUnit;
    ownershipStatus?: string;
    sellerPhone?: string;
    whatsappNumber?: string;
    // House
    houseSubcategory?: HouseSubcategory;
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
