export enum ServiceCategory {
    MAINTENANCE = 'maintenance',
    CLEANING = 'cleaning',
    SECURITY = 'security',
    MOVING = 'moving',
    LANDSCAPING = 'landscaping',
    PEST_CONTROL = 'pest_control',
    PAINTING = 'painting',
    OTHER = 'other'
}

export interface Service {
    _id: string;
    name: string;
    description: string;
    category: string;
    provider: string;
    price: number;
    status: 'Active' | 'Inactive' | 'Pending';
    rating?: number;
    createdAt: string;
    updatedAt: string;
}

export interface Property {
    _id: string;
    title: string;
    type: 'Apartment' | 'House' | 'Commercial' | 'Land' | 'Other';
    location: string;
    price: number;
    status: 'Available' | 'Rented' | 'Sold' | 'Pending';
    bedrooms?: number;
    bathrooms?: number;
    area: number;
    description: string;
    images: string[];
    agentId?: string;
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
    propertyId: string | Property;
    userId: string;
    checkIn: string;
    checkOut: string;
    status: 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed';
    totalPrice: number;
    guests?: number;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Notification {
    _id: string;
    userId: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    read: boolean;
    link?: string;
    createdAt: string;
    updatedAt: string;
}