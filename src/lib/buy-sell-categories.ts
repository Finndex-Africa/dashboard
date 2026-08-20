import type {
    BuySellCategory,
    BuySellListing,
    HouseholdItemSubcategory,
    HouseSubcategory,
    ItemCondition,
    LandSubcategory,
    LandUnit,
} from '@/types/buy-sell';

// ─── Label maps ───────────────────────────────────────────────────────────────

export const CATEGORY_LABELS: Record<BuySellCategory, string> = {
    land: 'Land',
    house: 'House',
    household_item: 'Household Item',
};

export const LAND_SUBCATEGORY_LABELS: Record<LandSubcategory, string> = {
    residential: 'Residential Land',
    commercial: 'Commercial Land',
    beach: 'Beach Land',
    farm: 'Farm Land',
};

export const HOUSE_SUBCATEGORY_LABELS: Record<HouseSubcategory, string> = {
    duplex: 'Duplex',
    apartment: 'Apartment',
    commercial: 'Commercial',
};

export const HOUSEHOLD_SUBCATEGORY_LABELS: Record<HouseholdItemSubcategory, string> = {
    furniture: 'Furniture',
    electronics: 'Electronics',
    kitchen_item: 'Kitchen Item',
    office_equipment: 'Office Equipment',
};

export const LAND_UNIT_LABELS: Record<LandUnit, string> = {
    acres: 'Acres',
    lots: 'Lots',
    square_feet: 'Square Feet',
    square_meters: 'Square Meters',
};

export const ITEM_CONDITION_LABELS: Record<ItemCondition, string> = {
    new: 'New',
    fairly_used: 'Fairly Used',
};

// ─── Select options ───────────────────────────────────────────────────────────

export const CATEGORY_OPTIONS = (Object.keys(CATEGORY_LABELS) as BuySellCategory[]).map((key) => ({
    value: key,
    label: CATEGORY_LABELS[key],
}));

export const LAND_SUBCATEGORY_OPTIONS = (Object.keys(LAND_SUBCATEGORY_LABELS) as LandSubcategory[]).map((key) => ({
    value: key,
    label: LAND_SUBCATEGORY_LABELS[key],
}));

export const HOUSE_SUBCATEGORY_OPTIONS = (Object.keys(HOUSE_SUBCATEGORY_LABELS) as HouseSubcategory[]).map((key) => ({
    value: key,
    label: HOUSE_SUBCATEGORY_LABELS[key],
}));

export const HOUSEHOLD_SUBCATEGORY_OPTIONS = (
    Object.keys(HOUSEHOLD_SUBCATEGORY_LABELS) as HouseholdItemSubcategory[]
).map((key) => ({
    value: key,
    label: HOUSEHOLD_SUBCATEGORY_LABELS[key],
}));

export const LAND_UNIT_OPTIONS = (Object.keys(LAND_UNIT_LABELS) as LandUnit[]).map((key) => ({
    value: key,
    label: LAND_UNIT_LABELS[key],
}));

export const ITEM_CONDITION_OPTIONS = (Object.keys(ITEM_CONDITION_LABELS) as ItemCondition[]).map((key) => ({
    value: key,
    label: ITEM_CONDITION_LABELS[key],
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns the human-readable subcategory label for any listing. */
export function getSubcategoryLabel(
    listing: Pick<BuySellListing, 'category' | 'landSubcategory' | 'houseSubcategory' | 'itemSubcategory'>,
): string {
    switch (listing.category) {
        case 'land':
            return listing.landSubcategory
                ? (LAND_SUBCATEGORY_LABELS[listing.landSubcategory] ?? listing.landSubcategory)
                : '—';
        case 'house':
            return listing.houseSubcategory
                ? (HOUSE_SUBCATEGORY_LABELS[listing.houseSubcategory] ?? listing.houseSubcategory)
                : '—';
        case 'household_item':
            return listing.itemSubcategory
                ? (HOUSEHOLD_SUBCATEGORY_LABELS[listing.itemSubcategory] ?? listing.itemSubcategory)
                : '—';
        default:
            return '—';
    }
}
