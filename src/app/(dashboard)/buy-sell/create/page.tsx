'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Typography from 'antd/es/typography';
import Card from 'antd/es/card';
import Button from 'antd/es/button';
import Result from 'antd/es/result';
import Alert from 'antd/es/alert';
import { ArrowLeftOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { BuySellForm, type BuySellFormSubmitPayload } from '@/components/dashboard/BuySellForm';
import { buySellApi } from '@/services/api/buy-sell.api';
import { mediaApi } from '@/services/api/media.api';
import { showToast } from '@/lib/toast';
import { useAuth } from '@/providers/AuthProvider';

const { Title, Text } = Typography;

export default function CreateBuySellPage() {
    const { user } = useAuth();
    const router   = useRouter();
    const [submitting, setSubmitting] = useState(false);

    const hasAccess = user?.role === 'admin';

    const handleCancel = () => router.push('/buy-sell');

    const handleSubmit = async ({ values, files, keptImages }: BuySellFormSubmitPayload) => {
        try {
            setSubmitting(true);

            // Step 1: Create listing (auto-approved for admin by backend)
            const { data: created } = await buySellApi.create({
                title:             values.title,
                description:       values.description,
                category:          values.category,
                price:             values.price,
                location:          values.location,
                agentFee:          values.agentFee,
                isPremium:         values.isPremium ?? false,
                // Land
                landSubcategory:   values.landSubcategory,
                landSize:          values.landSize,
                unit:              values.unit,
                ownershipStatus:   values.ownershipStatus,
                sellerPhone:       values.sellerPhone,
                whatsappNumber:    values.whatsappNumber,
                // House
                bedrooms:          values.bedrooms,
                bathrooms:         values.bathrooms,
                propertyType:      values.propertyType,
                amenities:         values.amenities,
                // Household
                itemSubcategory:   values.itemSubcategory,
                condition:         values.condition,
                warranty:          values.warranty,
                deliveryAvailable: values.deliveryAvailable,
            } as any);

            // Step 2: Upload images if any
            if (files.length > 0) {
                const uploadedUrls: string[] = [...(keptImages ?? [])];
                for (const file of files) {
                    try {
                        const imageUrl = await mediaApi.upload(file, 'buy_sell');
                        uploadedUrls.push(imageUrl);
                    } catch {
                        showToast.error('Failed to upload some images');
                    }
                }

                if (uploadedUrls.length > 0) {
                    await buySellApi.update(created._id, { images: uploadedUrls });
                }
            }

            showToast.success('Listing posted and published successfully');
            router.push('/buy-sell');
        } catch (error: any) {
            console.error('Failed to create Buy & Sell listing:', error);
            showToast.error(error.response?.data?.message || 'Failed to create listing');
        } finally {
            setSubmitting(false);
        }
    };

    if (!hasAccess) {
        return (
            <Result
                status="403"
                title="Access Denied"
                subTitle="Only admins can post Buy & Sell listings."
                extra={
                    <Button type="primary" onClick={() => router.push('/buy-sell')}>
                        Go to Buy &amp; Sell
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
                    Back to Buy &amp; Sell
                </Button>
                <Title level={2}>Post Buy &amp; Sell Listing</Title>
                <Text type="secondary">Create a listing on behalf of the platform</Text>
            </div>

            <Alert
                icon={<CheckCircleOutlined />}
                showIcon
                type="success"
                message="Admin listings are automatically approved and published"
                description="This listing will go live immediately — no review step required."
                style={{ marginBottom: 24, borderRadius: 8 }}
            />

            <Card>
                <BuySellForm
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                    loading={submitting}
                />
            </Card>
        </div>
    );
}
