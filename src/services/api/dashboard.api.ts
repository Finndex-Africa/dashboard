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

export interface AdminDashboardStats {
    totalUsers: number;
    totalProperties: number;
    totalServices: number;
    totalBookings: number;
    totalRevenue: number;
    userGrowth: number;
    propertyGrowth: number;
    serviceGrowth: number;
    bookingGrowth: number;
    revenueGrowth: number;
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
