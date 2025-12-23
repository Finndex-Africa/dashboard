'use client';

import AdminDashboard from '@/components/dashboard/AdminDashboard';

/**
 * Dashboard page - ADMIN ONLY
 *
 * Only admin users can access this route (enforced by middleware).
 * All other roles are redirected to their task-based pages:
 * - home_seeker → /properties?tab=active
 * - agent/landlord → /properties?view=mine
 * - service_provider → /services?view=mine
 */
export default function DashboardPage() {
    return <AdminDashboard />;
}
