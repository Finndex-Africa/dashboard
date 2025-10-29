import type { Property, PropertiesQueryParams, ApiResponse } from '@/types/dashboard';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

class PropertiesApi {
    private baseUrl: string;

    constructor(baseUrl: string = API_BASE_URL) {
        this.baseUrl = baseUrl;
    }

    private async handleResponse<T>(response: Response): Promise<T> {
        if (!response.ok) {
            const error = await response.json();
            throw error;
        }
        return response.json();
    }

    async getProperties(params: PropertiesQueryParams): Promise<ApiResponse<Property[]>> {
        const queryParams = new URLSearchParams();
        
        if (params.search) queryParams.set('search', params.search);
        if (params.type) queryParams.set('type', params.type);
        if (params.status) queryParams.set('status', params.status);
        if (params.verified !== undefined) queryParams.set('verified', params.verified.toString());
        if (params.sort) queryParams.set('sort', params.sort);
        if (params.page) queryParams.set('page', params.page.toString());
        if (params.limit) queryParams.set('limit', params.limit.toString());

        const response = await fetch(`${this.baseUrl}/properties?${queryParams.toString()}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        return this.handleResponse<ApiResponse<Property[]>>(response);
    }

    async createProperty(data: Omit<Property, '_id' | 'createdAt' | 'updatedAt'>): Promise<Property> {
        const response = await fetch(`${this.baseUrl}/properties`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
            credentials: 'include',
        });

        return this.handleResponse<Property>(response);
    }

    async updateProperty(id: string, data: Partial<Property>): Promise<Property> {
        const response = await fetch(`${this.baseUrl}/properties/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
            credentials: 'include',
        });

        return this.handleResponse<Property>(response);
    }

    async deleteProperty(id: string): Promise<void> {
        const response = await fetch(`${this.baseUrl}/properties/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        return this.handleResponse<void>(response);
    }

    async verifyProperty(id: string): Promise<Property> {
        const response = await fetch(`${this.baseUrl}/properties/${id}/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        return this.handleResponse<Property>(response);
    }
}

export const propertiesApi = new PropertiesApi();