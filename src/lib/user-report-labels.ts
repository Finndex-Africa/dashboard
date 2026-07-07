/** Human-readable labels for user report enums */

export type UserReportCategory =
  | "fraud_scam"
  | "fake_property_listing"
  | "misinformation"
  | "impersonation"
  | "misconduct"
  | "payment_issue"
  | "other";

export type UserReportStatus = "pending" | "reviewed" | "resolved";

export const REPORT_CATEGORY_LABELS: Record<UserReportCategory, string> = {
  fraud_scam: "Fraud/Scam",
  fake_property_listing: "Fake Property Listing",
  misinformation: "Misinformation",
  impersonation: "Impersonation",
  misconduct: "Misconduct",
  payment_issue: "Payment Issue",
  other: "Other",
};

export const REPORT_STATUS_LABELS: Record<UserReportStatus, string> = {
  pending: "Pending",
  reviewed: "Reviewed",
  resolved: "Resolved",
};

export const REPORT_CATEGORY_OPTIONS = Object.entries(REPORT_CATEGORY_LABELS).map(
  ([value, label]) => ({ value: value as UserReportCategory, label }),
);

export function formatReportCategory(value?: string | null): string {
  if (!value) return "—";
  return (
    REPORT_CATEGORY_LABELS[value as UserReportCategory] ??
    value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

export function formatReportStatus(value?: string | null): string {
  if (!value) return "—";
  return REPORT_STATUS_LABELS[value as UserReportStatus] ?? value;
}
