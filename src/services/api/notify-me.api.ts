import { apiClient } from "@/lib/api-client";

export interface NotifyMeEntry {
  _id: string;
  email: string;
  phoneNumber?: string;
  username?: string;
  isUser: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotifyMeFilters {
  isUser?: boolean;
  page?: number;
  limit?: number;
}

export interface NotifyMePagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface NotifyMeListResult {
  data: NotifyMeEntry[];
  pagination?: NotifyMePagination;
}

function unwrapListResponse(response: unknown): NotifyMeListResult {
  const root = response as Record<string, unknown>;
  const nested = root.data as Record<string, unknown> | NotifyMeEntry[] | undefined;

  if (Array.isArray(nested)) {
    return { data: nested };
  }

  if (nested && typeof nested === "object" && Array.isArray(nested.data)) {
    return {
      data: nested.data as NotifyMeEntry[],
      pagination: {
        total: (nested.total as number) ?? 0,
        page: (nested.page as number) ?? 1,
        limit: (nested.limit as number) ?? 20,
        totalPages: (nested.totalPages as number) ?? 1,
      },
    };
  }

  return { data: [] };
}

export const notifyMeApi = {
  getAll: async (filters?: NotifyMeFilters): Promise<NotifyMeListResult> => {
    const params = new URLSearchParams();
    if (filters?.isUser !== undefined) {
      params.append("isUser", String(filters.isUser));
    }
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());
    const query = params.toString();
    const response = await apiClient.get<NotifyMeEntry[]>(
      `/notify-me${query ? `?${query}` : ""}`,
    );
    return unwrapListResponse(response);
  },
};
