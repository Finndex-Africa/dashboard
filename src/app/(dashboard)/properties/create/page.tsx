'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Typography from 'antd/es/typography';
import Card from 'antd/es/card';
import Button from 'antd/es/button';
import Result from 'antd/es/result';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { PropertyForm } from '@/components/dashboard/PropertyForm';
import { propertiesApi } from '@/services/api/properties.api';
import { mediaApi } from '@/services/api/media.api';
import { showToast } from '@/lib/toast';
import { useAuth } from '@/providers/AuthProvider';
import { canCreateProperty, getDefaultPropertyView } from '@/lib/properties-utils';

const { Title, Text } = Typography;

export default function CreatePropertyPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);

    // Check access
    const hasAccess = user?.role && canCreateProperty(user.role);

    const handleCancel = () => {
        const defaultView = user?.role ? getDefaultPropertyView(user.role) : 'mine';
        router.push(`/properties?view=${defaultView}`);
    };

    const handleSubmit = async (values: any, files: File[]) => {
        try {
            setSubmitting(true);

            // Step 1: Create property without images
            const response = await propertiesApi.create(values);
            const createdProperty = response.data;

            console.log('✅ Property created:', createdProperty);

            // Step 2: Upload images if any
            if (files.length > 0) {
                console.log('📸 Uploading', files.length, 'images...');

                const uploadedUrls: string[] = [];
                for (const file of files) {
                    try {
                        const imageUrl = await mediaApi.upload(file, 'properties');
                        uploadedUrls.push(imageUrl);
                        console.log('✅ Uploaded:', imageUrl);
                    } catch (error) {
                        console.error('❌ Failed to upload image:', error);
                        showToast.error('Failed to upload some images');
                    }
                }

                // Step 3: Update property with image URLs
                if (uploadedUrls.length > 0) {
                    await propertiesApi.update(createdProperty._id, {
                        images: uploadedUrls,
                    });
                    console.log('✅ Property images updated');
                }
            }

            showToast.success('Property created successfully');

            // Redirect back to properties with appropriate view
            const defaultView = user?.role ? getDefaultPropertyView(user.role) : 'mine';
            router.push(`/properties?view=${defaultView}`);
        } catch (error: any) {
            console.error('Failed to create property:', error);
            showToast.error(error.response?.data?.message || 'Failed to create property');
        } finally {
            setSubmitting(false);
        }
    };

    if (!hasAccess) {
        return (
            <Result
                status="403"
                title="Access Denied"
                subTitle="You don't have permission to create properties."
                extra={
                    <Button type="primary" onClick={() => router.push('/properties')}>
                        Go to Properties
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
                    Back to Properties
                </Button>
                <Title level={2}>Create New Property</Title>
                <Text type="secondary">Fill in the details to list a new property</Text>
            </div>

            <Card>
                <PropertyForm
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                    loading={submitting}
                />
            </Card>
        </div>
    );
}
