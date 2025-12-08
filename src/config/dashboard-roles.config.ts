/**
 * Dashboard Role Configuration
 * Defines which widgets/modules each user role should see
 */

export enum UserRole {
    GUEST = 'guest',
    HOME_SEEKER = 'home_seeker',
    LANDLORD = 'landlord',
    AGENT = 'agent',
    SERVICE_PROVIDER = 'service_provider',
    ADMIN = 'admin',
}

export interface DashboardWidget {
    id: string;
    title: string;
    component: string;
    icon?: string;
    gridSize?: { xs: number; sm: number; md: number; lg: number };
}

export interface RoleDashboardConfig {
    role: UserRole;
    displayName: string;
    widgets: DashboardWidget[];
    statsCards: string[];
}

export const DASHBOARD_WIDGETS = {
    // Stats Cards
    TOTAL_PROPERTIES: 'total_properties',
    TOTAL_BOOKINGS: 'total_bookings',
    TOTAL_REVENUE: 'total_revenue',
    TOTAL_INQUIRIES: 'total_inquiries',
    TOTAL_SERVICES: 'total_services',
    ACTIVE_LISTINGS: 'active_listings',
    PENDING_APPROVALS: 'pending_approvals',
    TOTAL_USERS: 'total_users',

    // Charts & Analytics
    REVENUE_CHART: 'revenue_chart',
    BOOKINGS_CHART: 'bookings_chart',
    PROPERTY_STATUS_CHART: 'property_status_chart',
    SERVICE_CATEGORY_CHART: 'service_category_chart',
    USER_GROWTH_CHART: 'user_growth_chart',

    // Lists & Tables
    RECENT_BOOKINGS: 'recent_bookings',
    RECENT_PROPERTIES: 'recent_properties',
    RECENT_INQUIRIES: 'recent_inquiries',
    NOTIFICATIONS: 'notifications',
    UPCOMING_APPOINTMENTS: 'upcoming_appointments',
    TOP_PROPERTIES: 'top_properties',
    RECENT_REVIEWS: 'recent_reviews',
    SAVED_PROPERTIES: 'saved_properties',
} as const;

export const ROLE_DASHBOARD_CONFIG: Record<string, RoleDashboardConfig> = {
    [UserRole.HOME_SEEKER]: {
        role: UserRole.HOME_SEEKER,
        displayName: 'Home Seeker Dashboard',
        statsCards: [
            DASHBOARD_WIDGETS.TOTAL_BOOKINGS,
            DASHBOARD_WIDGETS.SAVED_PROPERTIES,
            DASHBOARD_WIDGETS.TOTAL_INQUIRIES,
            DASHBOARD_WIDGETS.UPCOMING_APPOINTMENTS,
        ],
        widgets: [
            {
                id: DASHBOARD_WIDGETS.RECENT_BOOKINGS,
                title: 'My Bookings',
                component: 'BookingsList',
                gridSize: { xs: 24, sm: 24, md: 12, lg: 12 },
            },
            {
                id: DASHBOARD_WIDGETS.SAVED_PROPERTIES,
                title: 'Saved Properties',
                component: 'SavedPropertiesList',
                gridSize: { xs: 24, sm: 24, md: 12, lg: 12 },
            },
            {
                id: DASHBOARD_WIDGETS.NOTIFICATIONS,
                title: 'Recent Notifications',
                component: 'NotificationsList',
                gridSize: { xs: 24, sm: 24, md: 24, lg: 24 },
            },
        ],
    },
    [UserRole.LANDLORD]: {
        role: UserRole.LANDLORD,
        displayName: 'Landlord Dashboard',
        statsCards: [
            DASHBOARD_WIDGETS.TOTAL_PROPERTIES,
            DASHBOARD_WIDGETS.ACTIVE_LISTINGS,
            DASHBOARD_WIDGETS.TOTAL_BOOKINGS,
            DASHBOARD_WIDGETS.TOTAL_REVENUE,
        ],
        widgets: [
            {
                id: DASHBOARD_WIDGETS.REVENUE_CHART,
                title: 'Revenue Overview',
                component: 'RevenueChart',
                gridSize: { xs: 24, sm: 24, md: 16, lg: 16 },
            },
            {
                id: DASHBOARD_WIDGETS.PROPERTY_STATUS_CHART,
                title: 'Property Status',
                component: 'PropertyStatusChart',
                gridSize: { xs: 24, sm: 24, md: 8, lg: 8 },
            },
            {
                id: DASHBOARD_WIDGETS.RECENT_BOOKINGS,
                title: 'Recent Bookings',
                component: 'BookingsList',
                gridSize: { xs: 24, sm: 24, md: 12, lg: 12 },
            },
            {
                id: DASHBOARD_WIDGETS.RECENT_PROPERTIES,
                title: 'My Properties',
                component: 'PropertiesList',
                gridSize: { xs: 24, sm: 24, md: 12, lg: 12 },
            },
            {
                id: DASHBOARD_WIDGETS.NOTIFICATIONS,
                title: 'Notifications',
                component: 'NotificationsList',
                gridSize: { xs: 24, sm: 24, md: 24, lg: 24 },
            },
        ],
    },
    [UserRole.AGENT]: {
        role: UserRole.AGENT,
        displayName: 'Agent Dashboard',
        statsCards: [
            DASHBOARD_WIDGETS.TOTAL_PROPERTIES,
            DASHBOARD_WIDGETS.ACTIVE_LISTINGS,
            DASHBOARD_WIDGETS.TOTAL_BOOKINGS,
            DASHBOARD_WIDGETS.TOTAL_INQUIRIES,
        ],
        widgets: [
            {
                id: DASHBOARD_WIDGETS.BOOKINGS_CHART,
                title: 'Bookings Trend',
                component: 'BookingsChart',
                gridSize: { xs: 24, sm: 24, md: 16, lg: 16 },
            },
            {
                id: DASHBOARD_WIDGETS.PROPERTY_STATUS_CHART,
                title: 'Listings Status',
                component: 'PropertyStatusChart',
                gridSize: { xs: 24, sm: 24, md: 8, lg: 8 },
            },
            {
                id: DASHBOARD_WIDGETS.RECENT_PROPERTIES,
                title: 'My Listings',
                component: 'PropertiesList',
                gridSize: { xs: 24, sm: 24, md: 12, lg: 12 },
            },
            {
                id: DASHBOARD_WIDGETS.RECENT_INQUIRIES,
                title: 'Recent Inquiries',
                component: 'InquiriesList',
                gridSize: { xs: 24, sm: 24, md: 12, lg: 12 },
            },
            {
                id: DASHBOARD_WIDGETS.TOP_PROPERTIES,
                title: 'Top Performing Properties',
                component: 'TopPropertiesList',
                gridSize: { xs: 24, sm: 24, md: 24, lg: 24 },
            },
        ],
    },
    [UserRole.SERVICE_PROVIDER]: {
        role: UserRole.SERVICE_PROVIDER,
        displayName: 'Service Provider Dashboard',
        statsCards: [
            DASHBOARD_WIDGETS.TOTAL_SERVICES,
            DASHBOARD_WIDGETS.TOTAL_BOOKINGS,
            DASHBOARD_WIDGETS.TOTAL_REVENUE,
            DASHBOARD_WIDGETS.UPCOMING_APPOINTMENTS,
        ],
        widgets: [
            {
                id: DASHBOARD_WIDGETS.REVENUE_CHART,
                title: 'Revenue Overview',
                component: 'RevenueChart',
                gridSize: { xs: 24, sm: 24, md: 16, lg: 16 },
            },
            {
                id: DASHBOARD_WIDGETS.SERVICE_CATEGORY_CHART,
                title: 'Services by Category',
                component: 'ServiceCategoryChart',
                gridSize: { xs: 24, sm: 24, md: 8, lg: 8 },
            },
            {
                id: DASHBOARD_WIDGETS.RECENT_BOOKINGS,
                title: 'Recent Bookings',
                component: 'BookingsList',
                gridSize: { xs: 24, sm: 24, md: 12, lg: 12 },
            },
            {
                id: DASHBOARD_WIDGETS.UPCOMING_APPOINTMENTS,
                title: 'Upcoming Appointments',
                component: 'AppointmentsList',
                gridSize: { xs: 24, sm: 24, md: 12, lg: 12 },
            },
            {
                id: DASHBOARD_WIDGETS.RECENT_REVIEWS,
                title: 'Recent Reviews',
                component: 'ReviewsList',
                gridSize: { xs: 24, sm: 24, md: 24, lg: 24 },
            },
        ],
    },
    [UserRole.ADMIN]: {
        role: UserRole.ADMIN,
        displayName: 'Admin Dashboard',
        statsCards: [
            DASHBOARD_WIDGETS.TOTAL_USERS,
            DASHBOARD_WIDGETS.TOTAL_PROPERTIES,
            DASHBOARD_WIDGETS.TOTAL_SERVICES,
            DASHBOARD_WIDGETS.PENDING_APPROVALS,
        ],
        widgets: [
            {
                id: DASHBOARD_WIDGETS.USER_GROWTH_CHART,
                title: 'User Growth',
                component: 'UserGrowthChart',
                gridSize: { xs: 24, sm: 24, md: 12, lg: 12 },
            },
            {
                id: DASHBOARD_WIDGETS.REVENUE_CHART,
                title: 'Platform Revenue',
                component: 'RevenueChart',
                gridSize: { xs: 24, sm: 24, md: 12, lg: 12 },
            },
            {
                id: DASHBOARD_WIDGETS.PROPERTY_STATUS_CHART,
                title: 'Properties Overview',
                component: 'PropertyStatusChart',
                gridSize: { xs: 24, sm: 24, md: 8, lg: 8 },
            },
            {
                id: DASHBOARD_WIDGETS.SERVICE_CATEGORY_CHART,
                title: 'Services Overview',
                component: 'ServiceCategoryChart',
                gridSize: { xs: 24, sm: 24, md: 8, lg: 8 },
            },
            {
                id: DASHBOARD_WIDGETS.PENDING_APPROVALS,
                title: 'Pending Approvals',
                component: 'ApprovalsList',
                gridSize: { xs: 24, sm: 24, md: 8, lg: 8 },
            },
            {
                id: DASHBOARD_WIDGETS.NOTIFICATIONS,
                title: 'System Notifications',
                component: 'NotificationsList',
                gridSize: { xs: 24, sm: 24, md: 24, lg: 24 },
            },
        ],
    },
};

/**
 * Get dashboard configuration for a specific user role
 */
export function getDashboardConfig(role: string): RoleDashboardConfig {
    const config = ROLE_DASHBOARD_CONFIG[role];

    // Default to home seeker if role not found
    if (!config) {
        console.warn(`Dashboard config not found for role: ${role}, using HOME_SEEKER default`);
        return ROLE_DASHBOARD_CONFIG[UserRole.HOME_SEEKER];
    }

    return config;
}

/**
 * Check if a user role has access to a specific widget
 */
export function hasWidgetAccess(role: string, widgetId: string): boolean {
    const config = getDashboardConfig(role);
    return config.widgets.some(widget => widget.id === widgetId) ||
           config.statsCards.includes(widgetId);
}
