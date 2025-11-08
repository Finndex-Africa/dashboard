import { v4 as uuidv4 } from 'uuid';

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '';
const CLOUDINARY_API_KEY = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || '';

export interface UploadOptions {
    file: File;
    folder: 'properties' | 'users' | 'services';
    entityId?: string;
    onProgress?: (progress: number) => void;
}

/**
 * Upload a file directly to Cloudinary
 * @param options Upload options
 * @returns Cloudinary URL of the uploaded file
 */
export async function uploadToCloudinary(options: UploadOptions): Promise<string> {
    const { file, folder, entityId, onProgress } = options;

    if (!CLOUDINARY_CLOUD_NAME) {
        throw new Error('Cloudinary cloud name is not configured');
    }

    if (!CLOUDINARY_UPLOAD_PRESET) {
        throw new Error('Cloudinary upload preset is not configured');
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const uniqueFilename = `${uuidv4()}.${fileExtension}`;

    // Create folder path
    const folderPath = entityId ? `${folder}/${entityId}` : folder;

    // Create FormData
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', folderPath);
    formData.append('public_id', uniqueFilename.replace(`.${fileExtension}`, ''));

    if (CLOUDINARY_API_KEY) {
        formData.append('api_key', CLOUDINARY_API_KEY);
    }

    try {
        const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

        const xhr = new XMLHttpRequest();

        return new Promise((resolve, reject) => {
            xhr.upload.addEventListener('progress', (event) => {
                if (event.lengthComputable && onProgress) {
                    const progress = Math.round((event.loaded / event.total) * 100);
                    onProgress(progress);
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    const response = JSON.parse(xhr.responseText);
                    resolve(response.secure_url);
                } else {
                    reject(new Error(`Upload failed with status ${xhr.status}`));
                }
            });

            xhr.addEventListener('error', () => {
                reject(new Error('Upload failed'));
            });

            xhr.open('POST', uploadUrl);
            xhr.send(formData);
        });
    } catch (error: any) {
        console.error('Failed to upload file to Cloudinary:', error);
        throw new Error(`Upload failed: ${error.message || 'Unknown error'}`);
    }
}

/**
 * Upload multiple files to Cloudinary
 * @param files Array of files to upload
 * @param folder Folder to upload to
 * @param entityId Optional entity ID for subfolder
 * @param onProgress Optional progress callback (receives overall progress 0-100)
 * @returns Array of Cloudinary URLs
 */
export async function uploadMultipleToCloudinary(
    files: File[],
    folder: 'properties' | 'users' | 'services',
    entityId?: string,
    onProgress?: (progress: number) => void
): Promise<string[]> {
    if (files.length === 0) {
        return [];
    }

    let completedCount = 0;

    const uploadPromises = files.map(async (file) => {
        const url = await uploadToCloudinary({
            file,
            folder,
            entityId,
            onProgress: () => {
                completedCount++;
                if (onProgress) {
                    const overallProgress = Math.round((completedCount / files.length) * 100);
                    onProgress(overallProgress);
                }
            },
        });
        return url;
    });

    return await Promise.all(uploadPromises);
}
