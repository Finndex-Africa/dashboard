import type { BuySellListing, BuySellSeller, BuySellStatus } from '@/types/buy-sell';
import { CATEGORY_LABELS } from './buy-sell-categories';

// ─── Role helpers ─────────────────────────────────────────────────────────────

/** Only the full `admin` role can moderate Buy & Sell listings (Phase 1). */
export function canModerateBuySell(role: string | undefined): boolean {
    return role === 'admin';
}

// ─── Seller display ───────────────────────────────────────────────────────────

/** Returns the populated seller object if present, otherwise the id string. */
export function getBuySellSellerRef(listing: BuySellListing): BuySellSeller | string | undefined {
    return listing.sellerId;
}

/** Resolves the seller's display name from a listing. */
export function getBuySellSellerDisplayName(listing: BuySellListing): string {
    const ref = listing.sellerId;
    if (!ref) return '—';
    if (typeof ref === 'string') return ref;
    const fullName = `${ref.firstName ?? ''} ${ref.lastName ?? ''}`.trim();
    return fullName || ref.name || ref.email || ref._id || '—';
}

/** Resolves the seller's id string (populated or raw). */
export function getBuySellSellerId(listing: BuySellListing): string | undefined {
    const ref = listing.sellerId;
    if (!ref) return undefined;
    if (typeof ref === 'string') return ref;
    return ref._id;
}

// ─── Category / status display ────────────────────────────────────────────────

export function getBuySellCategoryLabel(category: BuySellListing['category']): string {
    return CATEGORY_LABELS[category] ?? category;
}

export function getStatusColor(status: BuySellStatus): string {
    switch (status) {
        case 'approved':  return 'green';
        case 'pending':   return 'orange';
        case 'rejected':  return 'red';
        case 'suspended': return 'default';
        default:          return 'default';
    }
}

export function getStatusLabel(status: BuySellStatus): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
}

// ─── Price formatting ─────────────────────────────────────────────────────────

export function formatBuySellPrice(price: number): string {
    return `$${price.toLocaleString()}`;
}
