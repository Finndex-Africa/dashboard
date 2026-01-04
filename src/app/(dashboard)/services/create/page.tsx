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

            // Step 1: Upload images to Digital Ocean FIRST
            let uploadedUrls: string[] = [];
            if (files.length > 0) {
                for (const file of files) {
                    try {
                        const imageUrl = await mediaApi.upload(file, 'services');
                        uploadedUrls.push(imageUrl);
                    } catch (error) {
                        showToast.error('Failed to upload some images');
                    }
                }
            }

            // Step 2: Prepare clean data - BUILD FROM SCRATCH (safest approach)
            const cleanData: any = {
                title: values.title,
                category: values.category,
                description: values.description,
                location: values.location,
            };

            // Add optional fields only if they exist
            if (values.businessName) cleanData.businessName = values.businessName;
            if (values.experience !== undefined && values.experience !== null) cleanData.experience = Number(values.experience);
            if (values.phoneNumber) cleanData.phoneNumber = values.phoneNumber;
            if (values.whatsappNumber) cleanData.whatsappNumber = values.whatsappNumber;
            if (values.verificationNumber) cleanData.verificationNumber = values.verificationNumber;
            if (values.priceUnit) cleanData.priceUnit = values.priceUnit;
            if (values.duration) cleanData.duration = values.duration;

            // Handle price (optional, defaults to 0)
            if (values.price !== undefined && values.price !== null && values.price !== '') {
                cleanData.price = Number(values.price);
                if (cleanData.price < 0) cleanData.price = 0;
            } else {
                cleanData.price = 0;
            }

            // Add uploaded image URLs (required)
            if (uploadedUrls.length > 0) {
                cleanData.images = uploadedUrls;
            } else {
                showToast.error('At least 1 image is required');
                setSubmitting(false);
                return;
            }

            // Step 3: Create service with images already included
            const response = await servicesApi.create(cleanData);

            showToast.success('Service created successfully');

            // Redirect back to services with appropriate view
            const defaultView = user?.role ? getDefaultServiceView(user.role) : 'mine';
            router.push(`/services?view=${defaultView}`);
        } catch (error: any) {
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
