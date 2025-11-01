import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

// DigitalOcean Spaces configuration
const SPACES_ENDPOINT = process.env.NEXT_PUBLIC_DO_SPACES_ENDPOINT || 'https://nyc3.digitaloceanspaces.com';
const SPACES_BUCKET = process.env.NEXT_PUBLIC_DO_SPACES_BUCKET || 'finndexafrica';
const SPACES_REGION = process.env.NEXT_PUBLIC_DO_SPACES_REGION || 'nyc3';
const SPACES_KEY = process.env.NEXT_PUBLIC_DO_SPACES_KEY || '';
const SPACES_SECRET = process.env.NEXT_PUBLIC_DO_SPACES_SECRET || '';
const CDN_ENDPOINT = process.env.NEXT_PUBLIC_DO_SPACES_CDN_ENDPOINT || `https://${SPACES_BUCKET}.${SPACES_REGION}.cdn.digitaloceanspaces.com`;

// Initialize S3 client
const s3Client = new S3Client({
    endpoint: SPACES_ENDPOINT,
    region: SPACES_REGION,
    credentials: {
        accessKeyId: SPACES_KEY,
        secretAccessKey: SPACES_SECRET,
    },
});

export interface UploadOptions {
    file: File;
    folder: 'properties' | 'users' | 'services';
    entityId?: string; // Optional subfolder (e.g., propertyId, serviceId)
    onProgress?: (progress: number) => void;
}

/**
 * Upload a file directly to DigitalOcean Spaces
 * @param options Upload options
 * @returns CDN URL of the uploaded file
 */
export async function uploadToDigitalOcean(options: UploadOptions): Promise<string> {
    const { file, folder, entityId, onProgress } = options;

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const uniqueFilename = `${uuidv4()}.${fileExtension}`;

    // Create key with optional subfolder
    // e.g., properties/propertyId/uuid.jpg or properties/uuid.jpg
    const key = entityId
        ? `${folder}/${entityId}/${uniqueFilename}`
        : `${folder}/${uniqueFilename}`;

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Create upload command
    const command = new PutObjectCommand({
        Bucket: SPACES_BUCKET,
        Key: key,
        Body: buffer,
        ACL: 'public-read',
        ContentType: file.type,
    });

    try {
        // Upload file
        await s3Client.send(command);

        // Return CDN URL
        const cdnUrl = `${CDN_ENDPOINT}/${key}`;

        // Call progress callback if provided
        if (onProgress) {
            onProgress(100);
        }

        console.log(`✅ Successfully uploaded: ${key}`);
        return cdnUrl;
    } catch (error: any) {
        console.error('❌ Failed to upload file to DigitalOcean Spaces:', {
            error: error.message,
            code: error.code,
            statusCode: error.$metadata?.httpStatusCode,
            requestId: error.$metadata?.requestId,
            key,
            bucket: SPACES_BUCKET,
            endpoint: SPACES_ENDPOINT,
        });
        throw new Error(`Upload failed: ${error.message || 'Unknown error'}`);
    }
}

/**
 * Upload multiple files to DigitalOcean Spaces
 * @param files Array of files to upload
 * @param folder Folder to upload to
 * @param entityId Optional entity ID for subfolder
 * @param onProgress Optional progress callback (receives overall progress 0-100)
 * @returns Array of CDN URLs
 */
export async function uploadMultipleToDigitalOcean(
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
        const url = await uploadToDigitalOcean({
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
