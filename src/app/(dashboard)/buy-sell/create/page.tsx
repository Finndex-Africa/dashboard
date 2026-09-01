'use client';

import { useTranslations } from "next-intl";
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
    const t_nav2 = useTranslations("nav2");
    const t_common = useTranslations("common");
    const t_errors2 = useTranslations("errors2");
    const t_toasts = useTranslations("toasts");
    const { user } = useAuth();
    const router   = useRouter();
    const [submitting, setSubmitting] = useState(false);

    const hasAccess = user?.role === 'admin';

    const handleCancel = () => router.push('/buy-sell');

    const handleSubmit = async ({ values, files, keptImages }: BuySellFormSubmitPayload) => {
        try {
            setSubmitting(true);

            // Step 1: Upload images first so URLs can be included in the initial POST.
            // The backend requires images[] in the create payload.
            const imageUrls: string[] = [...(keptImages ?? [])];
            if (files.length > 0) {
                for (const file of files) {
                    try {
                        const url = await mediaApi.upload(file, 'buy_sell');
                        imageUrls.push(url);
                    } catch {
                        showToast.error(t_errors2("uploadOneOrMore"));
                    }
                }
            }

            // Step 2: Create listing with image URLs already set (auto-approved for admin)
            await buySellApi.create({
                title:             values.title,
                description:       values.description,
                category:          values.category,
                price:             values.price,
                currency:          values.currency,
                location:          values.location,
                images:            imageUrls.length > 0 ? imageUrls : undefined,
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

            showToast.success(t_toasts("listingPosted"));
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
                title={t_common("accessDenied")}
                subTitle="Only admins can post Buy & Sell listings."
                extra={
                    <Button type="primary" onClick={() => router.push('/buy-sell')}>
                        {t_nav2("goToBuySell")}
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
                    {t_nav2("backToBuySell")}
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
