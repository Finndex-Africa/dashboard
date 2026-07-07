'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Typography from 'antd/es/typography';
import Card from 'antd/es/card';
import Button from 'antd/es/button';
import Result from 'antd/es/result';
import Spin from 'antd/es/spin';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { PropertyForm } from '@/components/dashboard/PropertyForm';
import { propertiesApi } from '@/services/api/properties.api';
import { mediaApi } from '@/services/api/media.api';
import { showToast } from '@/lib/toast';
import { useAuth } from '@/providers/AuthProvider';
import {
    canCreateProperty,
    getDefaultPropertyView,
    canModerateProperties,
    mapPropertyFormToApi,
    mapPropertyToFormValues,
    propertyPosterId,
} from '@/lib/properties-utils';
import { canSetAgentFee } from '@/lib/role-utils';
import type { Property } from '@/types/dashboard';

const { Title, Text } = Typography;

export default function EditPropertyPage() {
    const { user } = useAuth();
    const router = useRouter();
    const params = useParams();
    const propertyId = params.id as string;

    const [property, setProperty] = useState<Property | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Check basic access
    const hasAccess = user?.role && canCreateProperty(user.role);

    useEffect(() => {
        if (hasAccess && propertyId) {
            fetchProperty();
        }
    }, [hasAccess, propertyId]);

    const fetchProperty = async () => {
        try {
            setLoading(true);
            const response = await propertiesApi.getById(propertyId);
            const fetchedProperty = response.data;

            // Check ownership (non-admins can only edit their own properties)
            if (user?.role !== 'admin') {
                const isOwner =
                    propertyPosterId(fetchedProperty.agentId) === user?.id ||
                    propertyPosterId(fetchedProperty.landlordId) === user?.id;

                if (!isOwner) {
                    showToast.error('You can only edit your own properties');
                    router.push('/properties');
                    return;
                }
            }

            setProperty(fetchedProperty);
        } catch (error: any) {
            console.error('Failed to fetch property:', error);
            showToast.error('Failed to load property');
            router.push('/properties');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        const defaultView = user?.role ? getDefaultPropertyView(user.role) : 'mine';
        router.push(`/properties?view=${defaultView}`);
    };

    const handleSubmit = async (values: any, files: File[], keptImages: string[]) => {
        if (!property) return;

        try {
            setSubmitting(true);

            // If property was rejected, change status to pending for resubmission
            const updateData = mapPropertyFormToApi(values, {
                includeAgentFee: canSetAgentFee(user?.role),
            });
            if (property.status === 'rejected') {
                updateData.status = 'pending';
            }

            // Step 1: Update property data
            await propertiesApi.update(property._id, updateData);

            // Step 2: Upload new images if any
            const uploadedUrls: string[] = [];
            if (files.length > 0) {
                console.log('📸 Uploading', files.length, 'new images...');

                for (const file of files) {
                    try {
                        const imageUrl = await mediaApi.upload(file, 'properties', propertyId);
                        uploadedUrls.push(imageUrl);
                        console.log('✅ Uploaded:', imageUrl);
                    } catch (error) {
                        console.error('❌ Failed to upload image:', error);
                        showToast.error('Failed to upload some images');
                    }
                }
            }

            // Step 3: Sync images (kept existing + newly uploaded)
            const finalImages = [...keptImages, ...uploadedUrls];
            const originalImages = property.images ?? [];
            const imagesChanged =
                finalImages.length !== originalImages.length ||
                finalImages.some((url, i) => url !== originalImages[i]);

            if (imagesChanged) {
                await propertiesApi.update(property._id, { images: finalImages });
                console.log('✅ Property images updated');
            }

            if (property.status === 'rejected') {
                showToast.success('Property updated and resubmitted for approval');
            } else {
                showToast.success('Property updated successfully');
            }

            // Redirect back to properties
            const defaultView = user?.role ? getDefaultPropertyView(user.role) : 'mine';
            router.push(`/properties?view=${defaultView}`);
        } catch (error: any) {
            console.error('Failed to update property:', error);
            showToast.error(error.response?.data?.message || 'Failed to update property');
        } finally {
            setSubmitting(false);
        }
    };

    if (!hasAccess) {
        return (
            <Result
                status="403"
                title="Access Denied"
                subTitle="You don't have permission to edit properties."
                extra={
                    <Button type="primary" onClick={() => router.push('/properties')}>
                        Go to Properties
                    </Button>
                }
            />
        );
    }

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <Spin size="large" tip="Loading property..." />
            </div>
        );
    }

    if (!property) {
        return (
            <Result
                status="404"
                title="Property Not Found"
                subTitle="The property you're looking for doesn't exist."
                extra={
                    <Button type="primary" onClick={handleCancel}>
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
                <Title level={2}>Edit Property</Title>
                <Text type="secondary">Update property details</Text>
                {property.status === 'rejected' && (
                    <div style={{ marginTop: 8 }}>
                        <Text type="danger">
                            This property was rejected. Updating it will resubmit for approval.
                        </Text>
                    </div>
                )}
            </div>

            <Card>
                <PropertyForm
                    initialValues={mapPropertyToFormValues(property)}
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                    loading={submitting}
                    showAgentFee={canSetAgentFee(user?.role)}
                />
            </Card>
        </div>
    );
}
