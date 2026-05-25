import { apiClient } from '@/lib/api-client';

export interface DashboardStats {
    totalProperties: number;
    totalServices: number;
    totalUsers: number;
    totalBookings: number;
    totalRevenue: number;
    activeProperties: number;
    activeServices: number;
    pendingBookings: number;
    recentActivity: Activity[];
}

export interface Activity {
    _id: string;
    type: 'property' | 'service' | 'booking' | 'user' | 'message';
    title: string;
    description: string;
    timestamp: string;
    user?: {
        firstName: string;
        lastName: string;
    };
}

/** Matches GET /admin/dashboard response `data` shape from the backend */
export interface AdminDashboardStats {
    users: {
        total: number;
        homeSeeker: number;
        landlord: number;
        agent: number;
        serviceProvider: number;
        blocked: number;
    };
    properties: {
        total: number;
        pending: number;
        approved: number;
        rejected: number;
        flaggedDuplicates: number;
    };
    services: {
        total: number;
        active: number;
        pending: number;
        verified: number;
    };
    bookings: {
        total: number;
        pending: number;
        confirmed: number;
        completed: number;
        cancelled: number;
    };
    reviews: {
        total: number;
        flagged: number;
        hidden: number;
    };
    recentActivity: {
        newUsers: number;
        newProperties: number;
        newServices: number;
        newBookings: number;
        newReviews: number;
    };
}

export const dashboardApi = {
    // Get user dashboard statistics
    getStats: async () => {
        return apiClient.get<DashboardStats>('/dashboard/stats');
    },

    // Get recent activity
    getActivity: async (limit?: number) => {
        const params = limit ? `?limit=${limit}` : '';
        return apiClient.get<Activity[]>(`/dashboard/activity${params}`);
    },

    // Get admin dashboard statistics
    getAdminStats: async () => {
        return apiClient.get<AdminDashboardStats>('/admin/dashboard');
    },
};
