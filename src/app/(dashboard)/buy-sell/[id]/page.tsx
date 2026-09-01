'use client';

import { useTranslations } from "next-intl";
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Typography from 'antd/es/typography';
import Card from 'antd/es/card';
import Button from 'antd/es/button';
import Result from 'antd/es/result';
import Spin from 'antd/es/spin';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { BuySellForm } from '@/components/dashboard/BuySellForm';
import type { BuySellFormSubmitPayload } from '@/components/dashboard/BuySellForm';
import { buySellApi } from '@/services/api/buy-sell.api';
import { mediaApi } from '@/services/api/media.api';
import { showToast } from '@/lib/toast';
import { useAuth } from '@/providers/AuthProvider';
import { canModerateBuySell } from '@/lib/buy-sell-utils';
import type { BuySellListing } from '@/types/buy-sell';

const { Title, Text } = Typography;

export default function EditBuySellPage() {
    const t_nav2 = useTranslations("nav2");
    const t_common = useTranslations("common");
    const t_errors2 = useTranslations("errors2");
    const t_listing = useTranslations("listing");
    const t_toasts = useTranslations("toasts");
    const { user }      = useAuth();
    const router        = useRouter();
    const params        = useParams();
    const listingId     = params.id as string;

    const [listing, setListing]       = useState<BuySellListing | null>(null);
    const [loading, setLoading]       = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const hasAccess = user?.role && canModerateBuySell(user.role);

    useEffect(() => {
        if (hasAccess && listingId) fetchListing();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasAccess, listingId]);

    const fetchListing = async () => {
        try {
            setLoading(true);
            const response = await buySellApi.getById(listingId);

            // Backend may return a paginated array or a single object — handle both
            const raw = (response.data as any)?.data ?? response.data;
            const fetched: BuySellListing = Array.isArray(raw) ? raw[0] : raw;

            if (!fetched) {
                showToast.error(t_errors2("listingNotFound"));
                router.push('/buy-sell');
                return;
            }

            setListing(fetched);
        } catch (error: any) {
            showToast.error(t_errors2("loadListing"));
            router.push('/buy-sell');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => router.push('/buy-sell');

    const handleSubmit = async ({ values, files, keptImages }: BuySellFormSubmitPayload) => {
        if (!listing) return;

        try {
            setSubmitting(true);

            // Step 1 – update text fields
            await buySellApi.update(listing._id, values);

            // Step 2 – upload any new images
            const uploadedUrls: string[] = [];
            for (const file of files) {
                try {
                    const url = await mediaApi.upload(file, 'properties', listingId);
                    uploadedUrls.push(url);
                } catch {
                    showToast.error(t_errors2("uploadOneOrMore"));
                }
            }

            // Step 3 – sync final image array if anything changed
            const finalImages   = [...keptImages, ...uploadedUrls];
            const originalImages = listing.images ?? [];
            const changed =
                finalImages.length !== originalImages.length ||
                finalImages.some((u, i) => u !== originalImages[i]);

            if (changed) {
                await buySellApi.update(listing._id, { images: finalImages });
            }

            showToast.success(t_toasts("listingUpdated"));
            router.push('/buy-sell');
        } catch (error: any) {
            showToast.error(error.response?.data?.message || 'Failed to update listing');
        } finally {
            setSubmitting(false);
        }
    };

    // ── Guards ────────────────────────────────────────────────────────────────
    if (!hasAccess) {
        return (
            <Result
                status="403"
                title={t_common("accessDenied")}
                subTitle="You don't have permission to edit Buy & Sell listings."
                extra={
                    <Button type="primary" onClick={() => router.push('/buy-sell')}>
                        {t_nav2("goToBuySell")}
                    </Button>
                }
            />
        );
    }

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <Spin size="large" tip="Loading listing…" />
            </div>
        );
    }

    if (!listing) {
        return (
            <Result
                status="404"
                title={t_listing("listingNotFound")}
                subTitle="The listing you're looking for doesn't exist."
                extra={
                    <Button type="primary" onClick={handleCancel}>
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
                <Title level={2}>Edit Listing</Title>
                <Text type="secondary">Update listing details</Text>
                {listing.status === 'rejected' && listing.rejectionReason && (
                    <div style={{ marginTop: 8 }}>
                        <Text type="danger">
                            Rejected: {listing.rejectionReason}
                        </Text>
                    </div>
                )}
            </div>

            <Card>
                <BuySellForm
                    listing={listing}
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                    loading={submitting}
                />
            </Card>
        </div>
    );
}
