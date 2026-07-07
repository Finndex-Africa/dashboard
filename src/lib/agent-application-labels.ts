/** Human-readable labels for agent application fields */

export const GENDER_LABELS: Record<string, string> = {
  male: 'Male',
  female: 'Female',
  other: 'Other',
  prefer_not_to_say: 'Prefer Not to Say',
};

export const APPLICATION_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

export function labelFromMap(
  map: Record<string, string>,
  value?: string | null,
  fallback = '—',
): string {
  if (value == null || value === '') return fallback;
  return map[value] ?? value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatGender(value?: string | null): string {
  return labelFromMap(GENDER_LABELS, value);
}
