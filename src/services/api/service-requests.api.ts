import { apiClient } from "@/lib/api-client";

export type ServiceRequestCategory = "property" | "service" | "buy_and_sell";
export type ServiceRequestStatus =
  | "new"
  | "in_progress"
  | "resolved"
  | "closed";

export interface ServiceRequestEntry {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  category: ServiceRequestCategory;
  details: string;
  location?: string;
  budget?: string;
  status: ServiceRequestStatus;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceRequestFilters {
  status?: ServiceRequestStatus;
  category?: ServiceRequestCategory;
  page?: number;
  limit?: number;
}

export interface ServiceRequestPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface ServiceRequestListResult {
  data: ServiceRequestEntry[];
  pagination?: ServiceRequestPagination;
}

export interface ServiceRequestStats {
  total: number;
  new: number;
  inProgress: number;
  resolved: number;
  closed: number;
  byCategory: Record<string, number>;
}

/**
 * The API wraps payloads in `{ data: ... }`, and the paginated endpoint wraps
 * again in `{ data, pagination }`. Unwrap both shapes so callers see one.
 */
function unwrapListResponse(response: unknown): ServiceRequestListResult {
  const root = response as Record<string, unknown>;
  const nested = root.data as
    | Record<string, unknown>
    | ServiceRequestEntry[]
    | undefined;

  if (Array.isArray(nested)) {
    return { data: nested };
  }

  if (nested && typeof nested === "object" && Array.isArray(nested.data)) {
    return {
      data: nested.data as ServiceRequestEntry[],
      pagination: nested.pagination as ServiceRequestPagination | undefined,
    };
  }

  return { data: [] };
}

export const serviceRequestsApi = {
  getAll: async (
    filters?: ServiceRequestFilters,
  ): Promise<ServiceRequestListResult> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.category) params.append("category", filters.category);
    if (filters?.page) params.append("page", String(filters.page));
    if (filters?.limit) params.append("limit", String(filters.limit));
    const query = params.toString();
    const response = await apiClient.get<ServiceRequestEntry[]>(
      `/service-requests${query ? `?${query}` : ""}`,
    );
    return unwrapListResponse(response);
  },

  getStats: async (): Promise<ServiceRequestStats | null> => {
    const response = await apiClient.get<ServiceRequestStats>(
      "/service-requests/stats",
    );
    return response.data ?? null;
  },

  update: async (
    id: string,
    payload: { status?: ServiceRequestStatus; adminNotes?: string },
  ): Promise<void> => {
    await apiClient.patch(`/service-requests/${id}`, payload);
  },
};
