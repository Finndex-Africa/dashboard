'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Typography from 'antd/es/typography';
import Card from 'antd/es/card';
import Button from 'antd/es/button';
import Result from 'antd/es/result';
import Spin from 'antd/es/spin';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { ServiceForm } from '@/components/dashboard/ServiceForm';
import { servicesApi } from '@/services/api/services.api';
import { mediaApi } from '@/services/api/media.api';
import { showToast } from '@/lib/toast';
import { useAuth } from '@/providers/AuthProvider';
import { canCreateService, getDefaultServiceView, canModerateServices } from '@/lib/services-utils';
import type { Service } from '@/types/dashboard';

const { Title, Text } = Typography;

export default function EditServicePage() {
    const { user } = useAuth();
    const router = useRouter();
    const params = useParams();
    const serviceId = params.id as string;

    const [service, setService] = useState<Service | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Check basic access
    const hasAccess = user?.role && canCreateService(user.role);

    useEffect(() => {
        if (hasAccess && serviceId) {
            fetchService();
        }
    }, [hasAccess, serviceId]);

    const fetchService = async () => {
        try {
            setLoading(true);
            const response = await servicesApi.getById(serviceId);
            const fetchedService = response.data;

            // Check ownership (non-admins can only edit their own services)
            if (user?.role !== 'admin') {
                const isOwner = fetchedService.provider === user?.id ||
                    (typeof fetchedService.provider === 'object' && fetchedService.provider?._id === user?.id);

                if (!isOwner) {
                    showToast.error('You can only edit your own services');
                    router.push('/services');
                    return;
                }
            }

            setService(fetchedService);
        } catch (error: any) {
            console.error('Failed to fetch service:', error);
            showToast.error('Failed to load service');
            router.push('/services');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        const defaultView = user?.role ? getDefaultServiceView(user.role) : 'mine';
        router.push(`/services?view=${defaultView}`);
    };

    const handleSubmit = async (values: any, files: File[]) => {
        if (!service) return;

        try {
            setSubmitting(true);

            // If service was rejected, change status to pending for resubmission
            const updateData = { ...values };
            if (service.verificationStatus === 'rejected') {
                updateData.verificationStatus = 'pending';
            }

            // Step 1: Update service data
            await servicesApi.update(service._id, updateData);

            // Step 2: Upload new images if any
            if (files.length > 0) {
                console.log('📸 Uploading', files.length, 'new images...');

                const uploadedUrls: string[] = [];
                for (const file of files) {
                    try {
                        const imageUrl = await mediaApi.upload(file, 'services', serviceId);
                        uploadedUrls.push(imageUrl);
                        console.log('✅ Uploaded:', imageUrl);
                    } catch (error) {
                        console.error('❌ Failed to upload image:', error);
                        showToast.error('Failed to upload some images');
                    }
                }

                // Step 3: Update service with new image URLs (append to existing)
                if (uploadedUrls.length > 0) {
                    const existingImages = service.images || [];
                    await servicesApi.update(service._id, {
                        images: [...existingImages, ...uploadedUrls],
                    });
                    console.log('✅ Service images updated');
                }
            }

            if (service.verificationStatus === 'rejected') {
                showToast.success('Service updated and resubmitted for verification');
            } else {
                showToast.success('Service updated successfully');
            }

            // Redirect back to services
            const defaultView = user?.role ? getDefaultServiceView(user.role) : 'mine';
            router.push(`/services?view=${defaultView}`);
        } catch (error: any) {
            console.error('Failed to update service:', error);
            showToast.error(error.response?.data?.message || 'Failed to update service');
        } finally {
            setSubmitting(false);
        }
    };

    if (!hasAccess) {
        return (
            <Result
                status="403"
                title="Access Denied"
                subTitle="You don't have permission to edit services."
                extra={
                    <Button type="primary" onClick={() => router.push('/services')}>
                        Go to Services
                    </Button>
                }
            />
        );
    }

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <Spin size="large" tip="Loading service..." />
            </div>
        );
    }

    if (!service) {
        return (
            <Result
                status="404"
                title="Service Not Found"
                subTitle="The service you're looking for doesn't exist."
                extra={
                    <Button type="primary" onClick={handleCancel}>
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
                <Title level={2}>Edit Service</Title>
                <Text type="secondary">Update service details</Text>
                {service.verificationStatus === 'rejected' && (
                    <div style={{ marginTop: 8 }}>
                        <Text type="danger">
                            This service was rejected. Updating it will resubmit for verification.
                        </Text>
                    </div>
                )}
            </div>

            <Card>
                <ServiceForm
                    initialValues={service}
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                    loading={submitting}
                />
            </Card>
        </div>
    );
}
