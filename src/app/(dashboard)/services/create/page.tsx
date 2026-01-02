'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Typography from 'antd/es/typography';
import Card from 'antd/es/card';
import Button from 'antd/es/button';
import Result from 'antd/es/result';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { ServiceForm } from '@/components/dashboard/ServiceForm';
import { servicesApi } from '@/services/api/services.api';
import { mediaApi } from '@/services/api/media.api';
import { showToast } from '@/lib/toast';
import { useAuth } from '@/providers/AuthProvider';
import { canCreateService, getDefaultServiceView } from '@/lib/services-utils';

const { Title, Text } = Typography;

export default function CreateServicePage() {
    const { user } = useAuth();
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);

    // Check access
    const hasAccess = user?.role && canCreateService(user.role);

    const handleCancel = () => {
        const defaultView = user?.role ? getDefaultServiceView(user.role) : 'mine';
        router.push(`/services?view=${defaultView}`);
    };

    const handleSubmit = async (values: any, files: File[]) => {
        try {
            setSubmitting(true);

            // Remove existingImages field if it exists (browser cache issue)
            const { existingImages, images, ...cleanValues } = values;

            console.log('🔍 Original values:', values);
            console.log('🧹 Cleaned values:', cleanValues);

            // Step 1: Create service without images
            const response = await servicesApi.create(cleanValues);
            const createdService = response.data;

            console.log('✅ Service created:', createdService);

            // Step 2: Upload images if any
            if (files.length > 0) {
                console.log('📸 Uploading', files.length, 'images...');

                const uploadedUrls: string[] = [];
                for (const file of files) {
                    try {
                        const imageUrl = await mediaApi.upload(file, 'services');
                        uploadedUrls.push(imageUrl);
                        console.log('✅ Uploaded:', imageUrl);
                    } catch (error) {
                        console.error('❌ Failed to upload image:', error);
                        showToast.error('Failed to upload some images');
                    }
                }

                // Step 3: Update service with image URLs
                if (uploadedUrls.length > 0) {
                    await servicesApi.update(createdService._id, {
                        images: uploadedUrls,
                    });
                    console.log('✅ Service images updated');
                }
            }

            showToast.success('Service created successfully');

            // Redirect back to services with appropriate view
            const defaultView = user?.role ? getDefaultServiceView(user.role) : 'mine';
            router.push(`/services?view=${defaultView}`);
        } catch (error: any) {
            console.error('Failed to create service:', error);
            showToast.error(error.response?.data?.message || 'Failed to create service');
        } finally {
            setSubmitting(false);
        }
    };

    if (!hasAccess) {
        return (
            <Result
                status="403"
                title="Access Denied"
                subTitle="You don't have permission to create services."
                extra={
                    <Button type="primary" onClick={() => router.push('/services')}>
                        Go to Services
                    </Button>
                }
            />
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={handleCancel}
                    style={{ marginBottom: 16 }}
                >
                    Back to Services
                </Button>
                <Title level={2}>Create New Service</Title>
                <Text type="secondary">Fill in the details to list a new service</Text>
            </div>

            <Card>
                <ServiceForm
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                    loading={submitting}
                />
            </Card>
        </div>
    );
}
