import { apiClient, PaginatedResponse } from "@/lib/api-client";
import type {
  UserReportCategory,
  UserReportStatus,
} from "@/lib/user-report-labels";

export interface UserReportUserRef {
  _id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  userType?: string;
}

export interface UserReport {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  reportCategory: UserReportCategory;
  reportedTarget: string;
  status: UserReportStatus;
  userId?: string | UserReportUserRef | null;
  reviewedBy?: string | UserReportUserRef | null;
  reviewedAt?: string | null;
  adminNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserReportFilters {
  status?: UserReportStatus | "all";
  reportCategory?: UserReportCategory | "all";
  page?: number;
  limit?: number;
}

export interface UserReportListResult {
  data: UserReport[];
  pagination?: PaginatedResponse<UserReport>["pagination"];
}

export interface ReviewUserReportDto {
  status: "reviewed" | "resolved";
  adminNotes?: string;
}

function unwrapListResponse(response: unknown): UserReportListResult {
  const root = response as Record<string, unknown>;
  const nested = root.data as Record<string, unknown> | UserReport[] | undefined;

  if (Array.isArray(nested)) {
    return {
      data: nested,
      pagination: root.pagination as UserReportListResult["pagination"],
    };
  }

  if (nested && typeof nested === "object" && Array.isArray(nested.data)) {
    return {
      data: nested.data as UserReport[],
      pagination:
        (nested.pagination as UserReportListResult["pagination"]) ??
        (root.pagination as UserReportListResult["pagination"]),
    };
  }

  return { data: [] };
}

function unwrapDetailResponse(response: unknown): UserReport {
  const root = response as Record<string, unknown>;
  return (root.data ?? response) as UserReport;
}

export const userReportsApi = {
  getAll: async (filters?: UserReportFilters): Promise<UserReportListResult> => {
    const params = new URLSearchParams();
    if (filters?.status && filters.status !== "all") {
      params.append("status", filters.status);
    }
    if (filters?.reportCategory && filters.reportCategory !== "all") {
      params.append("reportCategory", filters.reportCategory);
    }
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());
    const query = params.toString();
    const response = await apiClient.get<PaginatedResponse<UserReport>>(
      `/admin/user-reports${query ? `?${query}` : ""}`,
    );
    return unwrapListResponse(response);
  },

  getById: async (id: string): Promise<UserReport> => {
    const response = await apiClient.get<UserReport>(`/admin/user-reports/${id}`);
    return unwrapDetailResponse(response);
  },

  review: async (id: string, data: ReviewUserReportDto): Promise<UserReport> => {
    const response = await apiClient.patch<UserReport>(
      `/admin/user-reports/${id}/review`,
      data,
    );
    return unwrapDetailResponse(response);
  },
};
