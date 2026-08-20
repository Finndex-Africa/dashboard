'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Typography from 'antd/es/typography';
import Card from 'antd/es/card';
import Row from 'antd/es/row';
import Col from 'antd/es/col';
import Statistic from 'antd/es/statistic';
import Input from 'antd/es/input';
import Select from 'antd/es/select';
import Modal from 'antd/es/modal';
import Descriptions from 'antd/es/descriptions';
import Tag from 'antd/es/tag';
import Result from 'antd/es/result';
import Button from 'antd/es/button';
import Avatar from 'antd/es/avatar';
import Divider from 'antd/es/divider';
import {
    AppstoreOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    PauseCircleOutlined,
    SearchOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { BuySellTable } from '@/components/dashboard/BuySellTable';
import type { BuySellListing, BuySellSeller } from '@/types/buy-sell';
import { buySellApi } from '@/services/api/buy-sell.api';
import { showToast } from '@/lib/toast';
import { useAuth } from '@/providers/AuthProvider';
import {
    canModerateBuySell,
    getBuySellSellerDisplayName,
    getBuySellCategoryLabel,
    getStatusColor,
    getStatusLabel,
    formatBuySellPrice,
} from '@/lib/buy-sell-utils';
import {
    getSubcategoryLabel,
    LAND_UNIT_LABELS,
    ITEM_CONDITION_LABELS,
} from '@/lib/buy-sell-categories';

// Route Segment Config — must be after all imports
export const dynamic = 'force-dynamic';

const { Title, Text } = Typography;
const { Search } = Input;
const { TextArea } = Input;

export default function BuySellPage() {
    const { user } = useAuth();
    const router = useRouter();

    // ── State ──────────────────────────────────────────────────────────────────
    const [listings, setListings]               = useState<BuySellListing[]>([]);
    const [loading, setLoading]                 = useState(true);
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

    // Filters
    const [searchText, setSearchText]           = useState('');
    const [categoryFilter, setCategoryFilter]   = useState<string>('all');
    const [statusFilter, setStatusFilter]       = useState<string>('all');

    // Review modal
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [reviewListing, setReviewListing]     = useState<BuySellListing | null>(null);

    // Reject modal
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectTarget, setRejectTarget]       = useState<BuySellListing | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    const isAdmin = user?.role === 'admin';

    // ── Data fetching ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (user?.role) fetchListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.role]);

    const fetchListings = async () => {
        try {
            setLoading(true);
            const response = await buySellApi.getAll({ page: 1, limit: 100 });
            const raw = response.data;
            const items: BuySellListing[] = Array.isArray(raw)
                ? raw
                : (raw as any)?.data ?? [];
            setListings(items);
        } catch (error: any) {
            showToast.error(error.response?.data?.message || 'Failed to load listings');
            setListings([]);
        } finally {
            setLoading(false);
        }
    };

    // ── Client-side filtering ──────────────────────────────────────────────────
    const filtered = listings.filter((l) => {
        if (searchText) {
            const q = searchText.toLowerCase();
            if (
                !l.title?.toLowerCase().includes(q) &&
                !l.location?.toLowerCase().includes(q)
            ) return false;
        }
        if (categoryFilter !== 'all' && l.category !== categoryFilter) return false;
        if (statusFilter   !== 'all' && l.status   !== statusFilter)   return false;
        return true;
    });

    // ── Stats ──────────────────────────────────────────────────────────────────
    const stats = {
        total:     listings.length,
        pending:   listings.filter((l) => l.status === 'pending').length,
        approved:  listings.filter((l) => l.status === 'approved').length,
        suspended: listings.filter((l) => l.status === 'suspended').length,
    };

    // ── Handlers ───────────────────────────────────────────────────────────────

    const handleReviewClick = (listing: BuySellListing) => {
        setReviewListing(listing);
        setReviewModalOpen(true);
    };

    const handleRejectClick = (listing: BuySellListing) => {
        setRejectTarget(listing);
        setReviewModalOpen(false);
        setReviewListing(null);
        setRejectModalOpen(true);
    };

    const handleApprove = async (listing: BuySellListing) => {
        try {
            setActionLoadingId(listing._id);
            await buySellApi.approve(listing._id);
            showToast.success('Listing approved');
            setReviewModalOpen(false);
            setReviewListing(null);
            fetchListings();
        } catch (error: any) {
            showToast.error(error.response?.data?.message || 'Failed to approve listing');
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleRejectSubmit = async () => {
        if (!rejectTarget || !rejectionReason.trim()) {
            showToast.error('Please provide a rejection reason');
            return;
        }
        try {
            setActionLoadingId(rejectTarget._id);
            await buySellApi.reject(rejectTarget._id, rejectionReason);
            showToast.success('Listing rejected');
            setRejectModalOpen(false);
            setRejectTarget(null);
            setRejectionReason('');
            fetchListings();
        } catch (error: any) {
            showToast.error(error.response?.data?.message || 'Failed to reject listing');
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleUnpublish = async (listing: BuySellListing) => {
        try {
            setActionLoadingId(listing._id);
            setListings((prev) =>
                prev.map((l) => l._id === listing._id ? { ...l, status: 'suspended' as const } : l),
            );
            await buySellApi.unpublish(listing._id);
            showToast.success('Listing suspended');
            fetchListings();
        } catch (error: any) {
            setListings((prev) =>
                prev.map((l) => l._id === listing._id ? { ...l, status: listing.status } : l),
            );
            showToast.error(error.response?.data?.message || 'Failed to suspend listing');
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleRepublish = async (listing: BuySellListing) => {
        try {
            setActionLoadingId(listing._id);
            setListings((prev) =>
                prev.map((l) => l._id === listing._id ? { ...l, status: 'approved' as const } : l),
            );
            await buySellApi.republish(listing._id);
            showToast.success('Listing reactivated');
            fetchListings();
        } catch (error: any) {
            setListings((prev) =>
                prev.map((l) => l._id === listing._id ? { ...l, status: listing.status } : l),
            );
            showToast.error(error.response?.data?.message || 'Failed to reactivate listing');
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleDelete = (listing: BuySellListing) => {
        Modal.confirm({
            title: 'Delete Listing',
            content: `Are you sure you want to delete "${listing.title}"? This action cannot be undone.`,
            okText: 'Delete',
            okType: 'danger',
            onOk: async () => {
                try {
                    await buySellApi.delete(listing._id);
                    showToast.success('Listing deleted');
                    fetchListings();
                } catch (error: any) {
                    showToast.error(error.response?.data?.message || 'Failed to delete listing');
                }
            },
        });
    };

    const handleToggleFeatured = async (listing: BuySellListing) => {
        const newValue = !listing.isPremium;
        try {
            setActionLoadingId(listing._id);
            setListings((prev) =>
                prev.map((l) => l._id === listing._id ? { ...l, isPremium: newValue } : l),
            );
            await buySellApi.toggleFeatured(listing._id, newValue);
            showToast.success(newValue ? 'Listing marked as featured' : 'Featured status removed');
        } catch (error: any) {
            setListings((prev) =>
                prev.map((l) => l._id === listing._id ? { ...l, isPremium: listing.isPremium } : l),
            );
            showToast.error(error.response?.data?.message || 'Failed to update featured status');
        } finally {
            setActionLoadingId(null);
        }
    };

    // ── Access guard ───────────────────────────────────────────────────────────
    if (user && !isAdmin) {
        return (
            <Result
                status="403"
                title="Access Denied"
                subTitle="You don't have permission to manage Buy & Sell listings."
                extra={
                    <Button type="primary" onClick={() => router.push('/dashboard')}>
                        Go to Dashboard
                    </Button>
                }
            />
        );
    }

    return (
        <div className="space-y-6">
            {/* ── Header ────────────────────────────────────────────────────── */}
            <div>
                <Title level={2} className="mb-1">Buy &amp; Sell</Title>
                <Text type="secondary">Manage all Buy &amp; Sell listings</Text>
            </div>

            {/* ── Stats ─────────────────────────────────────────────────────── */}
            <Row gutter={[16, 16]}>
                <Col xs={12} sm={6}>
                    <Card>
                        <Statistic
                            title="Total Listings"
                            value={stats.total}
                            prefix={<AppstoreOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card>
                        <Statistic
                            title="Pending Review"
                            value={stats.pending}
                            valueStyle={{ color: '#faad14' }}
                            prefix={<ClockCircleOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card>
                        <Statistic
                            title="Approved"
                            value={stats.approved}
                            valueStyle={{ color: '#52c41a' }}
                            prefix={<CheckCircleOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card>
                        <Statistic
                            title="Suspended"
                            value={stats.suspended}
                            valueStyle={{ color: '#8c8c8c' }}
                            prefix={<PauseCircleOutlined />}
                        />
                    </Card>
                </Col>
            </Row>

            {/* ── Filters ───────────────────────────────────────────────────── */}
            <Card>
                <Row gutter={[16, 16]}>
                    <Col xs={24} md={10}>
                        <Search
                            placeholder="Search by title or location…"
                            allowClear
                            size="large"
                            prefix={<SearchOutlined />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                    </Col>
                    <Col xs={12} md={7}>
                        <Select
                            size="large"
                            value={categoryFilter}
                            onChange={setCategoryFilter}
                            style={{ width: '100%' }}
                        >
                            <Select.Option value="all">All Categories</Select.Option>
                            <Select.Option value="land">Land</Select.Option>
                            <Select.Option value="house">House</Select.Option>
                            <Select.Option value="household_item">Household Item</Select.Option>
                        </Select>
                    </Col>
                    <Col xs={12} md={7}>
                        <Select
                            size="large"
                            value={statusFilter}
                            onChange={setStatusFilter}
                            style={{ width: '100%' }}
                        >
                            <Select.Option value="all">All Status</Select.Option>
                            <Select.Option value="pending">Pending</Select.Option>
                            <Select.Option value="approved">Approved</Select.Option>
                            <Select.Option value="rejected">Rejected</Select.Option>
                            <Select.Option value="suspended">Suspended</Select.Option>
                        </Select>
                    </Col>
                </Row>
            </Card>

            {/* ── Table ─────────────────────────────────────────────────────── */}
            <Card>
                <BuySellTable
                    listings={filtered}
                    loading={loading}
                    actionLoadingId={actionLoadingId}
                    onReview={canModerateBuySell(user?.role) ? handleReviewClick : undefined}
                    onApprove={canModerateBuySell(user?.role) ? handleApprove : undefined}
                    onReject={canModerateBuySell(user?.role) ? handleRejectClick : undefined}
                    onEdit={(l) => router.push(`/buy-sell/${l._id}`)}
                    onDelete={canModerateBuySell(user?.role) ? handleDelete : undefined}
                    onUnpublish={canModerateBuySell(user?.role) ? handleUnpublish : undefined}
                    onRepublish={canModerateBuySell(user?.role) ? handleRepublish : undefined}
                    onToggleFeatured={canModerateBuySell(user?.role) ? handleToggleFeatured : undefined}
                />
            </Card>

            {/* ── Review Modal ───────────────────────────────────────────────── */}
            <Modal
                title={
                    reviewListing ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span>Review Listing</span>
                            <Tag color="blue" style={{ margin: 0 }}>{reviewListing && getBuySellCategoryLabel(reviewListing.category)}</Tag>
                            <Tag color={reviewListing && getStatusColor(reviewListing.status)} style={{ margin: 0 }}>
                                {reviewListing && getStatusLabel(reviewListing.status)}
                            </Tag>
                            {reviewListing?.isPremium && <Tag color="gold" style={{ margin: 0 }}>Featured</Tag>}
                        </div>
                    ) : 'Review Listing'
                }
                open={reviewModalOpen}
                onCancel={() => { setReviewModalOpen(false); setReviewListing(null); }}
                width={820}
                footer={null}
            >
                {reviewListing && (() => {
                    const seller = typeof reviewListing.sellerId === 'object'
                        ? reviewListing.sellerId as BuySellSeller
                        : null;

                    return (
                        <>
                            {/* ── Images ── */}
                            {reviewListing.images?.length > 0 && (
                                <div style={{ marginBottom: 20 }}>
                                    <div
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                                            gap: 10,
                                        }}
                                    >
                                        {reviewListing.images.map((img, idx) => (
                                            <a
                                                key={`${img}-${idx}`}
                                                href={img}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    display: 'block',
                                                    borderRadius: 8,
                                                    overflow: 'hidden',
                                                    border: '1px solid #f0f0f0',
                                                    transition: 'border-color 0.2s',
                                                }}
                                            >
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={img}
                                                    alt={`Image ${idx + 1}`}
                                                    style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block', background: '#fafafa' }}
                                                    loading="lazy"
                                                />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Core details ── */}
                            <Descriptions bordered column={{ xs: 1, sm: 2 }} size="small" style={{ marginBottom: 16 }}>
                                <Descriptions.Item label="Title" span={2}>{reviewListing.title}</Descriptions.Item>
                                <Descriptions.Item label="Price">
                                    <strong>{formatBuySellPrice(reviewListing.price)}</strong>
                                </Descriptions.Item>
                                <Descriptions.Item label="Location">{reviewListing.location}</Descriptions.Item>
                                <Descriptions.Item label="Category">
                                    <Tag color="blue" style={{ margin: 0 }}>{getBuySellCategoryLabel(reviewListing.category)}</Tag>
                                    {' '}
                                    <span style={{ color: '#8c8c8c', fontSize: 12 }}>{getSubcategoryLabel(reviewListing)}</span>
                                </Descriptions.Item>
                                <Descriptions.Item label="Views / Saves">
                                    {reviewListing.views ?? 0} / {reviewListing.saves ?? 0}
                                </Descriptions.Item>

                                {/* Land */}
                                {reviewListing.category === 'land' && (
                                    <>
                                        {reviewListing.landSize != null && (
                                            <Descriptions.Item label="Land Size">
                                                {reviewListing.landSize}{' '}
                                                {reviewListing.unit ? LAND_UNIT_LABELS[reviewListing.unit] ?? reviewListing.unit : ''}
                                            </Descriptions.Item>
                                        )}
                                        {reviewListing.ownershipStatus && (
                                            <Descriptions.Item label="Ownership">{reviewListing.ownershipStatus}</Descriptions.Item>
                                        )}
                                        {reviewListing.sellerPhone && (
                                            <Descriptions.Item label="Seller Phone">{reviewListing.sellerPhone}</Descriptions.Item>
                                        )}
                                        {reviewListing.whatsappNumber && (
                                            <Descriptions.Item label="WhatsApp">{reviewListing.whatsappNumber}</Descriptions.Item>
                                        )}
                                    </>
                                )}

                                {/* House */}
                                {reviewListing.category === 'house' && (
                                    <>
                                        {reviewListing.bedrooms != null && (
                                            <Descriptions.Item label="Bedrooms">{reviewListing.bedrooms}</Descriptions.Item>
                                        )}
                                        {reviewListing.bathrooms != null && (
                                            <Descriptions.Item label="Bathrooms">{reviewListing.bathrooms}</Descriptions.Item>
                                        )}
                                        {reviewListing.propertyType && (
                                            <Descriptions.Item label="Property Type" span={2}>{reviewListing.propertyType}</Descriptions.Item>
                                        )}
                                    </>
                                )}

                                {/* Household item */}
                                {reviewListing.category === 'household_item' && (
                                    <>
                                        {reviewListing.condition && (
                                            <Descriptions.Item label="Condition">
                                                {ITEM_CONDITION_LABELS[reviewListing.condition] ?? reviewListing.condition}
                                            </Descriptions.Item>
                                        )}
                                        <Descriptions.Item label="Warranty">{reviewListing.warranty ? 'Yes' : 'No'}</Descriptions.Item>
                                        <Descriptions.Item label="Delivery">{reviewListing.deliveryAvailable ? 'Yes' : 'No'}</Descriptions.Item>
                                    </>
                                )}

                                <Descriptions.Item label="Description" span={2}>
                                    <div style={{ maxHeight: 100, overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
                                        {reviewListing.description || '—'}
                                    </div>
                                </Descriptions.Item>
                            </Descriptions>

                            {/* ── Amenities (house) ── */}
                            {reviewListing.category === 'house' && reviewListing.amenities && reviewListing.amenities.length > 0 && (
                                <div style={{ marginBottom: 16 }}>
                                    <Divider orientation="left" plain style={{ fontSize: 13, margin: '12px 0' }}>
                                        Amenities ({reviewListing.amenities.length})
                                    </Divider>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                        {reviewListing.amenities.map((a, idx) => (
                                            <div
                                                key={idx}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 6,
                                                    padding: '6px 12px',
                                                    border: '1.5px solid #667eea',
                                                    borderRadius: 8,
                                                    background: 'rgba(102,126,234,0.06)',
                                                    color: '#667eea',
                                                    fontSize: 13,
                                                    fontWeight: 500,
                                                }}
                                            >
                                                {a.icon && <span style={{ fontSize: 16 }}>{a.icon}</span>}
                                                {a.label}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Seller ── */}
                            {seller && (
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 12,
                                        padding: '12px 14px',
                                        border: '1px solid #f0f0f0',
                                        borderRadius: 8,
                                        background: '#fafafa',
                                        marginBottom: 16,
                                    }}
                                >
                                    <Avatar
                                        size={44}
                                        src={seller.avatar ?? undefined}
                                        icon={!seller.avatar ? <UserOutlined /> : undefined}
                                    />
                                    <div>
                                        <div style={{ fontWeight: 600, color: '#262626', fontSize: 14 }}>
                                            {getBuySellSellerDisplayName(reviewListing)}
                                            {seller.verified && (
                                                <Tag color="blue" style={{ marginLeft: 6, fontSize: 11 }}>Verified</Tag>
                                            )}
                                        </div>
                                        <div style={{ color: '#595959', fontSize: 12 }}>
                                            {seller.email}{seller.phone ? ` · ${seller.phone}` : ''}
                                        </div>
                                    </div>
                                    <Tag style={{ marginLeft: 'auto' }}>{seller.userType}</Tag>
                                </div>
                            )}

                            {/* ── Review actions ── */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 8, borderTop: '1px solid #f0f0f0' }}>
                                <Button onClick={() => { setReviewModalOpen(false); setReviewListing(null); }}>
                                    Cancel
                                </Button>
                                <Button danger onClick={() => handleRejectClick(reviewListing)}>
                                    Reject
                                </Button>
                                <Button
                                    type="primary"
                                    icon={<CheckCircleOutlined />}
                                    loading={actionLoadingId === reviewListing._id}
                                    onClick={() => handleApprove(reviewListing)}
                                    style={{ background: '#43e97b', borderColor: '#43e97b' }}
                                >
                                    Approve
                                </Button>
                            </div>
                        </>
                    );
                })()}
            </Modal>

            {/* ── Reject Modal ───────────────────────────────────────────────── */}
            <Modal
                title="Reject Listing"
                open={rejectModalOpen}
                onOk={handleRejectSubmit}
                onCancel={() => {
                    setRejectModalOpen(false);
                    setRejectTarget(null);
                    setRejectionReason('');
                }}
                confirmLoading={actionLoadingId === rejectTarget?._id}
                okText="Reject"
                okButtonProps={{ danger: true }}
            >
                <div style={{ marginBottom: 12 }}>
                    <Text>
                        Listing: <strong>{rejectTarget?.title}</strong>
                    </Text>
                </div>
                <TextArea
                    rows={4}
                    placeholder="Enter rejection reason (will be sent to the seller via notification)…"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                />
            </Modal>
        </div>
    );
}
