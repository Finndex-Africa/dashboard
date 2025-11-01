import { apiClient } from '@/lib/api-client';

export interface MediaResponse {
    _id: string;
    filename: string;
    originalName: string;
    type: 'properties' | 'users' | 'services';
    uploadedBy: string;
    url: string;
    mimeType: string;
    size: number;
    createdAt: string;
    updatedAt: string;
}

export const mediaApi = {
    // Upload single file with optional entityId for subfolder organization
    upload: async (
        file: File,
        type: 'properties' | 'users' | 'services',
        entityId?: string
    ): Promise<MediaResponse> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);
        if (entityId) {
            formData.append('entityId', entityId);
        }

        const response = await apiClient.post<MediaResponse>('/media/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data;
    },

    // Upload multiple files with optional entityId for subfolder organization
    uploadMultiple: async (
        files: File[],
        type: 'properties' | 'users' | 'services',
        entityId?: string
    ): Promise<MediaResponse[]> => {
        const formData = new FormData();
        files.forEach(file => {
            formData.append('files', file);
        });
        formData.append('type', type);
        if (entityId) {
            formData.append('entityId', entityId);
        }

        const response = await apiClient.post<MediaResponse[]>('/media/upload-multiple', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data;
    },

    // Get user's media
    getMyMedia: async (type?: string): Promise<MediaResponse[]> => {
        const params = type ? `?type=${type}` : '';
        const response = await apiClient.get<MediaResponse[]>(`/media/my-media${params}`);
        return response.data;
    },

    // Get media by ID
    getById: async (id: string): Promise<MediaResponse> => {
        const response = await apiClient.get<MediaResponse>(`/media/${id}`);
        return response.data;
    },

    // Delete media
    delete: async (id: string): Promise<{ message: string }> => {
        const response = await apiClient.delete<{ message: string }>(`/media/${id}`);
        return response.data;
    },
};
