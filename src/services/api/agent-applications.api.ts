import { apiClient, PaginatedResponse } from '@/lib/api-client';

export type AgentApplicationStatus = 'pending' | 'approved' | 'rejected';
export type AgentApplicationGender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export interface AgentApplicationUserRef {
  _id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  userType?: string;
}

/** Matches initial contract: Full Name, Email, Location, Phone, Gender */
export interface AgentApplication {
  _id: string;
  fullName: string;
  email: string;
  location: string;
  phone: string;
  gender: AgentApplicationGender;
  status: AgentApplicationStatus;
  userId?: string | AgentApplicationUserRef | null;
  reviewedBy?: string | AgentApplicationUserRef | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  reviewNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AgentApplicationFilters {
  status?: AgentApplicationStatus | 'all';
  page?: number;
  limit?: number;
}

export interface AgentApplicationListResult {
  data: AgentApplication[];
  pagination?: PaginatedResponse<AgentApplication>['pagination'];
}

function unwrapListResponse(response: unknown): AgentApplicationListResult {
  const root = response as Record<string, unknown>;
  const nested = root.data as Record<string, unknown> | AgentApplication[] | undefined;

  if (Array.isArray(nested)) {
    return {
      data: nested,
      pagination: root.pagination as AgentApplicationListResult['pagination'],
    };
  }

  if (nested && typeof nested === 'object' && Array.isArray(nested.data)) {
    return {
      data: nested.data as AgentApplication[],
      pagination:
        (nested.pagination as AgentApplicationListResult['pagination']) ??
        (root.pagination as AgentApplicationListResult['pagination']),
    };
  }

  return { data: [] };
}

function unwrapDetailResponse(response: unknown): AgentApplication {
  const root = response as Record<string, unknown>;
  return (root.data ?? response) as AgentApplication;
}

export const agentApplicationsApi = {
  getAll: async (filters?: AgentApplicationFilters): Promise<AgentApplicationListResult> => {
    const params = new URLSearchParams();
    if (filters?.status && filters.status !== 'all') {
      params.append('status', filters.status);
    }
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    const query = params.toString();
    const response = await apiClient.get<PaginatedResponse<AgentApplication>>(
      `/admin/agent-applications${query ? `?${query}` : ''}`,
    );
    return unwrapListResponse(response);
  },

  getById: async (id: string): Promise<AgentApplication> => {
    const response = await apiClient.get<AgentApplication>(`/admin/agent-applications/${id}`);
    return unwrapDetailResponse(response);
  },

  approve: async (id: string, reviewNotes?: string): Promise<AgentApplication> => {
    const response = await apiClient.patch<AgentApplication>(
      `/admin/agent-applications/${id}/approve`,
      { reviewNotes },
    );
    return unwrapDetailResponse(response);
  },

  reject: async (
    id: string,
    rejectionReason: string,
    reviewNotes?: string,
  ): Promise<AgentApplication> => {
    const response = await apiClient.patch<AgentApplication>(
      `/admin/agent-applications/${id}/reject`,
      { rejectionReason, reviewNotes },
    );
    return unwrapDetailResponse(response);
  },
};
