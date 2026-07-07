import { ServiceCategory } from '@/types/dashboard';

export interface ServiceCategoryOption {
  value: ServiceCategory;
  label: string;
}

/** Canonical service categories aligned with backend enum */
export const SERVICE_CATEGORY_OPTIONS: ServiceCategoryOption[] = [
  { value: ServiceCategory.ELECTRICAL, label: 'Electrical' },
  { value: ServiceCategory.PLUMBING, label: 'Plumbing' },
  { value: ServiceCategory.CLEANING, label: 'Cleaning' },
  { value: ServiceCategory.PAINTING_DECORATION, label: 'Painting & Decoration' },
  { value: ServiceCategory.CARPENTRY_FURNITURE, label: 'Carpentry & Furniture' },
  { value: ServiceCategory.MOVING_LOGISTICS, label: 'Moving & Logistics' },
  { value: ServiceCategory.SECURITY_SERVICES, label: 'Security Services' },
  { value: ServiceCategory.SANITATION_SERVICES, label: 'Sanitation Services' },
  { value: ServiceCategory.MAINTENANCE, label: 'Maintenance' },
  { value: ServiceCategory.CATERING, label: 'Catering' },
  { value: ServiceCategory.CONSTRUCTION, label: 'Construction' },
  { value: ServiceCategory.LAUNDRY, label: 'Laundry' },
  { value: ServiceCategory.OTHER, label: 'Other' },
];

export function getServiceCategoryLabelFromSlug(slug: string | undefined): string {
  if (!slug) return '';
  const match = SERVICE_CATEGORY_OPTIONS.find((o) => o.value === slug);
  if (match) return match.label;
  return slug
    .replace(/_/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}
