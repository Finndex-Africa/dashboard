'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';
import Typography from 'antd/es/typography';
import Button from 'antd/es/button';
import Card from 'antd/es/card';
import Row from 'antd/es/row';
import Col from 'antd/es/col';
import Statistic from 'antd/es/statistic';
import Input from 'antd/es/input';
import Select from 'antd/es/select';
import Tabs from 'antd/es/tabs';
import Modal from 'antd/es/modal';
import Result from 'antd/es/result';
import {
    PlusOutlined,
    HomeOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    SearchOutlined,
    HeartOutlined,
    HeartFilled,
} from '@ant-design/icons';
import { PropertiesTable } from '@/components/dashboard/PropertiesTable';
import type { Property } from '@/types/dashboard';
import { propertiesApi } from '@/services/api/properties.api';
import { showToast } from '@/lib/toast';
import { useAuth } from '@/providers/AuthProvider';
import {
    canCreateProperty,
    canModerateProperties,
    isHomeSeeker,
    isPropertyCreator,
    getDefaultPropertyView,
    getDefaultPropertyTab,
    savedPropertiesManager,
    type PropertyView,
    type PropertyTab,
} from '@/lib/properties-utils';

const { Title, Text } = Typography;
const { Search } = Input;
const { TextArea } = Input;

function PropertiesPageContent() {
    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    // Query params
    const viewParam = (searchParams.get('view') as PropertyView) || null;
    const tabParam = (searchParams.get('tab') as PropertyTab) || null;

    // State
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [savedIds, setSavedIds] = useState<string[]>([]);

    // Determine current view/tab based on role and query params
    const isHS = user?.role && isHomeSeeker(user.role);
    const isPC = user?.role && isPropertyCreator(user.role);
    const isAdmin = user?.role === 'admin';

    // For home_seekers: use tab, for others: use view
    const currentTab = isHS ? (tabParam || getDefaultPropertyTab()) : 'active';
    const currentView = !isHS ? (viewParam || getDefaultPropertyView(user?.role || 'home_seeker')) : 'all';

    // Fetch properties on mount and when view/tab changes
    useEffect(() => {
        if (!user?.role) {
            return;
        }

        // Handle default redirects
        if (isHS && !tabParam) {
            router.replace(`/properties?tab=${getDefaultPropertyTab()}`);
            return;
        }
        if (!isHS && !viewParam) {
            const defaultView = getDefaultPropertyView(user.role);
            router.replace(`/properties?view=${defaultView}`);
            return;
        }

        fetchProperties();
    }, [user?.role, currentView, currentTab, tabParam, viewParam, isHS]);

    // Load saved properties for home_seekers
    useEffect(() => {
        if (isHS) {
            setSavedIds(savedPropertiesManager.getSavedIds());
        }
    }, [isHS]);

    const fetchProperties = async () => {
        if (!user?.role) {
            return;
        }

        try {
            setLoading(true);
            let fetchedProperties: Property[] = [];

            if (isHS) {
                // Home seekers: fetch approved properties only (REDUCED to 10 for fastest loading)
                const response = await propertiesApi.getAll({ page: 1, limit: 10 });
                const allProps = Array.isArray(response.data) ? response.data : response.data?.data || [];
                fetchedProperties = allProps.filter((p: Property) => p.status === 'approved');
            } else if (isAdmin) {
                // Admin: fetch based on view (REDUCED to 10 for fastest loading)
                if (currentView === 'all') {
                    // Fetch FIRST page only with minimal limit for fast initial load
                    const response = await propertiesApi.getAll({ page: 1, limit: 10 });
                    fetchedProperties = Array.isArray(response.data) ? response.data : response.data?.data || [];
                } else {
                    // Admin viewing "mine" or "pending"
                    const response = await propertiesApi.getAll({ page: 1, limit: 10 });
                    fetchedProperties = Array.isArray(response.data) ? response.data : response.data?.data || [];
                }
            } else if (isPC) {
                // Agents/Landlords: fetch based on view
                if (currentView === 'mine') {
                    const response = await propertiesApi.getMyProperties();
                    fetchedProperties = Array.isArray(response.data) ? response.data : [];
                } else if (currentView === 'all') {
                    // Browse all approved properties (REDUCED to 10 for fastest loading)
                    const response = await propertiesApi.getAll({ page: 1, limit: 10 });
                    const allProps = Array.isArray(response.data) ? response.data : response.data?.data || [];
                    fetchedProperties = allProps.filter((p: Property) => p.status === 'approved');
                } else if (currentView === 'pending') {
                    const response = await propertiesApi.getMyProperties();
                    const myProps = Array.isArray(response.data) ? response.data : [];
                    fetchedProperties = myProps.filter((p: Property) => p.status === 'pending');
                }
            }

            setProperties(fetchedProperties);
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || error.message || 'Failed to load properties';
            showToast.error(errorMsg);
            setProperties([]);
        } finally {
            setLoading(false);
        }
    };

    // Filter properties for display
    const filteredProperties = properties.filter(property => {
        // Home seeker: filter by tab (active vs saved)
        if (isHS && currentTab === 'saved') {
            if (!savedIds.includes(property._id)) return false;
        }

        // Search filter
        if (searchText) {
            const search = searchText.toLowerCase();
            const matchesTitle = property.title?.toLowerCase().includes(search);
            const matchesLocation = property.location?.toLowerCase().includes(search);
            if (!matchesTitle && !matchesLocation) return false;
        }

        // Status filter
        if (statusFilter !== 'all' && property.status !== statusFilter) return false;

        // Type filter
        if (typeFilter !== 'all' && property.type !== typeFilter) return false;

        return true;
    });

    // Calculate stats (only for view=mine)
    const stats = {
        total: properties.length,
        approved: properties.filter(p => p.status === 'approved').length,
        pending: properties.filter(p => p.status === 'pending').length,
        rejected: properties.filter(p => p.status === 'rejected').length,
        totalValue: properties.reduce((sum, p) => sum + (p.price || 0), 0),
    };

    // Handlers
    const handleDelete = async (property: Property) => {
        Modal.confirm({
            title: 'Delete Property',
            content: 'Are you sure you want to delete this property?',
            okText: 'Delete',
            okType: 'danger',
            onOk: async () => {
                try {
                    await propertiesApi.delete(property._id);
                    showToast.success('Property deleted successfully');
                    fetchProperties();
                } catch (error) {
                    showToast.error('Failed to delete property');
                }
            },
        });
    };

    const handleApprove = async (property: Property) => {
        try {
            setActionLoading(property._id);
            await propertiesApi.approve(property._id);
            showToast.success('Property approved successfully');
            fetchProperties();
        } catch (error) {
            showToast.error('Failed to approve property');
        } finally {
            setActionLoading(null);
        }
    };

    const handleRejectClick = (property: Property) => {
        setSelectedProperty(property);
        setIsRejectModalOpen(true);
    };

    const handleRejectSubmit = async () => {
        if (!selectedProperty || !rejectionReason.trim()) {
            showToast.error('Please provide a rejection reason');
            return;
        }

        try {
            setActionLoading(selectedProperty._id);
            await propertiesApi.reject(selectedProperty._id, rejectionReason);
            showToast.success('Property rejected');
            setIsRejectModalOpen(false);
            setSelectedProperty(null);
            setRejectionReason('');
            fetchProperties();
        } catch (error) {
            showToast.error('Failed to reject property');
        } finally {
            setActionLoading(null);
        }
    };

    const handleSaveToggle = (propertyId: string) => {
        const isSaved = savedPropertiesManager.toggle(propertyId);
        setSavedIds(savedPropertiesManager.getSavedIds());
        showToast.success(isSaved ? 'Property saved' : 'Property unsaved');
    };

    const handleTabChange = (key: string) => {
        if (isHS) {
            router.push(`/properties?tab=${key}`);
        } else {
            router.push(`/properties?view=${key}`);
        }
    };

    // Render: No access
    if (!user) {
        return null; // Auth provider will redirect
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <Title level={2} className="mb-1">Properties</Title>
                    <Text type="secondary">
                        {isHS && 'Browse available properties'}
                        {isPC && currentView === 'mine' && 'Manage your property listings'}
                        {isPC && currentView === 'all' && 'Browse all properties'}
                        {isPC && currentView === 'pending' && 'Properties awaiting approval'}
                        {isAdmin && 'Manage all properties'}
                    </Text>
                </div>
                {canCreateProperty(user.role) && (
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => router.push('/properties/create')}
                        size="large"
                    >
                        Create Property
                    </Button>
                )}
            </div>

            {/* Tabs */}
            {isHS ? (
                <Tabs activeKey={currentTab} onChange={handleTabChange}>
                    <Tabs.TabPane tab="Browse Properties" key="active" />
                    <Tabs.TabPane tab={`Saved (${savedIds.length})`} key="saved" />
                </Tabs>
            ) : (isPC || isAdmin) ? (
                <Tabs activeKey={currentView} onChange={handleTabChange}>
                    {isPC && <Tabs.TabPane tab="My Listings" key="mine" />}
                    {(isPC || isAdmin) && <Tabs.TabPane tab="All Properties" key="all" />}
                    {isPC && <Tabs.TabPane tab="Pending Approval" key="pending" />}
                </Tabs>
            ) : null}

            {/* Contextual Stats (only for view=mine) */}
            {!isHS && currentView === 'mine' && (
                <Row gutter={[16, 16]}>
                    <Col xs={12} sm={8} lg={6}>
                        <Card>
                            <Statistic
                                title="Total Listings"
                                value={stats.total}
                                prefix={<HomeOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col xs={12} sm={8} lg={6}>
                        <Card>
                            <Statistic
                                title="Approved"
                                value={stats.approved}
                                valueStyle={{ color: '#52c41a' }}
                                prefix={<CheckCircleOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col xs={12} sm={8} lg={6}>
                        <Card>
                            <Statistic
                                title="Pending"
                                value={stats.pending}
                                valueStyle={{ color: '#faad14' }}
                                prefix={<ClockCircleOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col xs={12} sm={8} lg={6}>
                        <Card>
                            <Statistic
                                title="Total Value"
                                value={stats.totalValue}
                                prefix="$"
                            />
                        </Card>
                    </Col>
                </Row>
            )}

            {/* Search and Filters */}
            <Card>
                <Row gutter={[16, 16]}>
                    <Col xs={24} md={12}>
                        <Search
                            placeholder="Search by title or location..."
                            allowClear
                            size="large"
                            prefix={<SearchOutlined />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                    </Col>
                    <Col xs={12} md={6}>
                        <Select
                            size="large"
                            value={statusFilter}
                            onChange={setStatusFilter}
                            style={{ width: '100%' }}
                        >
                            <Select.Option value="all">All Status</Select.Option>
                            <Select.Option value="approved">Approved</Select.Option>
                            <Select.Option value="pending">Pending</Select.Option>
                            <Select.Option value="rented">Rented</Select.Option>
                            <Select.Option value="rejected">Rejected</Select.Option>
                        </Select>
                    </Col>
                    <Col xs={12} md={6}>
                        <Select
                            size="large"
                            value={typeFilter}
                            onChange={setTypeFilter}
                            style={{ width: '100%' }}
                        >
                            <Select.Option value="all">All Types</Select.Option>
                            <Select.Option value="Apartment">Apartment</Select.Option>
                            <Select.Option value="House">House</Select.Option>
                        </Select>
                    </Col>
                </Row>
            </Card>

            {/* Properties Table */}
            <Card>
                <PropertiesTable
                    properties={filteredProperties}
                    loading={loading}
                    onEdit={(p) => router.push(`/properties/${p._id}`)}
                    onDelete={canCreateProperty(user.role) ? handleDelete : undefined}
                    onApprove={canModerateProperties(user.role) ? handleApprove : undefined}
                    onReject={canModerateProperties(user.role) ? handleRejectClick : undefined}
                    onSaveToggle={isHS ? handleSaveToggle : undefined}
                    savedIds={isHS ? savedIds : undefined}
                    approvingId={actionLoading}
                />
            </Card>

            {/* Rejection Modal (Admin Only) */}
            <Modal
                title="Reject Property"
                open={isRejectModalOpen}
                onOk={handleRejectSubmit}
                onCancel={() => {
                    setIsRejectModalOpen(false);
                    setSelectedProperty(null);
                    setRejectionReason('');
                }}
                confirmLoading={actionLoading === selectedProperty?._id}
            >
                <div style={{ marginBottom: 16 }}>
                    <Text>Property: <strong>{selectedProperty?.title}</strong></Text>
                </div>
                <TextArea
                    rows={4}
                    placeholder="Enter rejection reason (will be sent to the owner via email)..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                />
            </Modal>
        </div>
    );
}

export default function PropertiesPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        }>
            <PropertiesPageContent />
        </Suspense>
    );
}
