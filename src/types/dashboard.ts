export enum ServiceCategory {
    ELECTRICAL = 'electrical',
    PLUMBING = 'plumbing',
    CLEANING = 'cleaning',
    PAINTING_DECORATION = 'painting_decoration',
    CARPENTRY_FURNITURE = 'carpentry_furniture',
    MOVING_LOGISTICS = 'moving_logistics',
    SECURITY_SERVICES = 'security_services',
    SANITATION_SERVICES = 'sanitation_services',
    MAINTENANCE = 'maintenance',
    OTHER = 'other'
}

export interface Service {
    _id: string;
    title: string;
    description: string;
    category: string;
    location: string;
    price: number;
    priceUnit?: string;
    duration?: string;
    status: 'pending' | 'active' | 'rejected' | 'inactive' | 'suspended';
    verificationStatus?: 'pending' | 'verified' | 'rejected';
    rating?: number;
    reviewCount?: number;
    images?: string[];
    provider?: string | { _id: string; name: string; email: string };

    // Business details
    businessName?: string;
    experience?: number;
    phoneNumber?: string;
    whatsappNumber?: string;
    verificationNumber?: string;

    // Additional fields
    bookings?: number;
    views?: number;
    verified?: boolean;

    createdAt: string;
    updatedAt: string;
}

export interface Property {
    _id: string;
    title: string;
    type: 'Apartment' | 'House' ;
    propertyType: string;
    location: string;
    price: number;
    status: 'pending' | 'approved' | 'rejected' | 'rented' | 'archived' | 'suspended';
    bedrooms?: number;
    bathrooms?: number;
    rooms?: number;
    area?: number;
    description: string;
    images: string[];
    agentId?: string;
    landlordId?: string; // Legacy field - use agentId instead
    views?: number;
    inquiries?: number;
    isPremium?: boolean;
    rating?: number;
    reviewCount?: number;
    furnished?: boolean;
    priceUnit?: string;
    availableFrom?: string;
    availableTo?: string;

    // Additional property details (Airbnb-style)
    amenities?: string[];
    maxGuests?: number;
    parking?: boolean;
    parkingSpaces?: number;
    wifi?: boolean;
    airConditioning?: boolean;
    heating?: boolean;
    kitchen?: boolean;
    washer?: boolean;
    dryer?: boolean;
    tv?: boolean;
    workspace?: boolean;
    pool?: boolean;
    gym?: boolean;
    elevator?: boolean;
    balcony?: boolean;
    garden?: boolean;
    petFriendly?: boolean;
    smoking?: boolean;
    securitySystem?: boolean;

    createdAt: string;
    updatedAt: string;
}

export interface Agent {
    _id: string;
    name: string;
    email: string;
    phone: string;
    specialization: string;
    properties: number;
    sales: number;
    rating: number;
    status: 'Active' | 'Inactive';
    avatar?: string;
    createdAt: string;
}

export interface KPIData {
    title: string;
    value: number;
    change?: number;
    trend?: 'up' | 'down' | 'stable';
    icon?: React.ReactNode;
    suffix?: string;
    prefix?: string;
}

export interface AgentPerformance {
    agentName: string;
    totalProperties: number;
    successRate: number;
    revenue: number;
}

export interface PropertiesQueryParams {
    search?: string;
    type?: string;
    status?: string;
    verified?: boolean;
    sort?: string;
    page?: number;
    limit?: number;
}

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
}

export interface ApiResponse<T> {
    data: T;
    meta: PaginationMeta;
    message?: string;
}

export interface Booking {
    _id: string;
    serviceId: string | Service;
    userId: string | { _id: string; name: string; email: string; phone?: string; avatar?: string };
    providerId: string | { _id: string; name: string; email: string; phone?: string; avatar?: string };
    scheduledDate: string;
    duration: number; // Duration in hours
    notes?: string;
    contactPhone: string;
    serviceLocation?: string;
    serviceAddress?: string;
    totalPrice: number;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'in_progress' | 'rejected';
    paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
    paymentMethod?: string;
    paymentReference?: string;
    paidAt?: string;
    // Commission fields
    platformFee?: number; // 10% Finndex fee
    providerEarnings?: number; // 90% for service provider
    commissionProcessed: boolean;
    commissionProcessedAt?: string;
    commissionId?: string;
    cancellationReason?: string;
    cancelledAt?: string;
    completedAt?: string;
    confirmedAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Notification {
    _id: string;
    userId: string;
    title: string;
    message: string;
    /** Backend uses enum (e.g. new_user_registered, booking_created); dashboard also supports info | success | warning | error */
    type: 'info' | 'success' | 'warning' | 'error' | string;
    read: boolean;
    link?: string;
    icon?: string;
    priority?: string;
    relatedEntityId?: string;
    relatedEntityType?: string;
    createdAt: string;
    updatedAt: string;
}

export interface SidebarMenuItem {
    key: string;
    label: string;
    icon: React.ReactNode;
    path: string;
    roles: string[];
    children?: SidebarMenuItem[];
}