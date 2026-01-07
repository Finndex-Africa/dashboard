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
import {
    PlusOutlined,
    ToolOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    SearchOutlined,
} from '@ant-design/icons';
import { ServicesTable } from '@/components/dashboard/ServicesTable';
import type { Service } from '@/types/dashboard';
import { servicesApi } from '@/services/api/services.api';
import { showToast } from '@/lib/toast';
import { useAuth } from '@/providers/AuthProvider';
import {
    canCreateService,
    canModerateServices,
    isHomeSeeker,
    isServiceProvider,
    getDefaultServiceView,
    getDefaultServiceTab,
    savedServicesManager,
    type ServiceView,
    type ServiceTab,
} from '@/lib/services-utils';

const { Title, Text } = Typography;
const { Search } = Input;
const { TextArea } = Input;

function ServicesPageContent() {
    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    // Query params
    const viewParam = (searchParams.get('view') as ServiceView) || null;
    const tabParam = (searchParams.get('tab') as ServiceTab) || null;

    // State
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [savedIds, setSavedIds] = useState<string[]>([]);

    // Determine current view/tab based on role and query params
    const isHS = user?.role && isHomeSeeker(user.role);
    const isSP = user?.role && isServiceProvider(user.role);
    const isAdmin = user?.role === 'admin';

    // For home_seekers: use tab, for others: use view
    const currentTab = isHS ? (tabParam || getDefaultServiceTab()) : 'active';
    const currentView = !isHS ? (viewParam || getDefaultServiceView(user?.role || 'home_seeker')) : 'all';

    // Fetch services on mount and when view/tab changes
    useEffect(() => {
        if (!user?.role) {
            return;
        }

        // Handle default redirects
        if (isHS && !tabParam) {
            router.replace(`/services?tab=${getDefaultServiceTab()}`);
            return;
        }
        if (!isHS && !viewParam) {
            const defaultView = getDefaultServiceView(user.role);
            router.replace(`/services?view=${defaultView}`);
            return;
        }

        fetchServices();
    }, [user?.role, currentView, currentTab, tabParam, viewParam, isHS]);

    // Load saved services for home_seekers
    useEffect(() => {
        if (isHS) {
            setSavedIds(savedServicesManager.getSavedIds());
        }
    }, [isHS]);

    const fetchServices = async () => {
        if (!user?.role) {
            return;
        }

        try {
            setLoading(true);
            let fetchedServices: Service[] = [];

            if (isHS) {
                // Home seekers: fetch verified/active services only (REDUCED to 10 for fastest loading)
                const response = await servicesApi.getAll({ page: 1, limit: 10 });
                const allServices = Array.isArray(response.data) ? response.data : response.data?.data || [];
                fetchedServices = allServices.filter((s: Service) =>
                    s.verificationStatus === 'verified' && s.status === 'active'
                );
            } else if (isAdmin) {
                // Admin: fetch ALL services with no restrictions using admin endpoint
                if (currentView === 'all') {
                    // Admin "all" view: use admin endpoint to see ALL services regardless of status
                    const response = await servicesApi.getAllAdminServices({ page: 1, limit: 10 });
                    // Use same pattern as properties: try both response.data (if array) and response.data.data (if nested)
                    fetchedServices = Array.isArray(response.data) ? response.data : response.data?.data || [];
                } else if (currentView === 'pending') {
                    // Admin viewing pending: use admin-specific endpoint
                    const response = await servicesApi.getPendingServices(1, 10);
                    // Use same pattern as properties: try both response.data (if array) and response.data.data (if nested)
                    fetchedServices = Array.isArray(response.data) ? response.data : response.data?.data || [];
                } else {
                    // Admin viewing "mine" - still use admin endpoint but could filter by user if needed
                    const response = await servicesApi.getAllAdminServices({ page: 1, limit: 10 });
                    // Use same pattern as properties: try both response.data (if array) and response.data.data (if nested)
                    fetchedServices = Array.isArray(response.data) ? response.data : response.data?.data || [];
                }
            } else if (isSP) {
                // Service Providers: fetch based on view
                if (currentView === 'mine') {
                    const response = await servicesApi.getMyServices();
                    fetchedServices = Array.isArray(response.data) ? response.data : [];
                } else if (currentView === 'all') {
                    // Browse all verified services (REDUCED to 10 for fastest loading)
                    const response = await servicesApi.getAll({ page: 1, limit: 10 });
                    const allServices = Array.isArray(response.data) ? response.data : response.data?.data || [];
                    fetchedServices = allServices.filter((s: Service) =>
                        s.verificationStatus === 'verified' && s.status === 'active'
                    );
                } else if (currentView === 'pending') {
                    const response = await servicesApi.getMyServices();
                    const myServices = Array.isArray(response.data) ? response.data : [];
                    fetchedServices = myServices.filter((s: Service) => s.verificationStatus === 'pending');
                }
            }

            setServices(fetchedServices);
        } catch (error: any) {
            if (error.response?.status !== 404) {
                const errorMsg = error.response?.data?.message || error.message || 'Failed to load services';
                showToast.error(errorMsg);
            }
            setServices([]);
        } finally {
            setLoading(false);
        }
    };

    // Filter services for display
    const filteredServices = services.filter(service => {
        // Home seeker: filter by tab (active vs saved)
        if (isHS && currentTab === 'saved') {
            if (!savedIds.includes(service._id)) return false;
        }

        // Search filter
        if (searchText) {
            const search = searchText.toLowerCase();
            const matchesTitle = service.title?.toLowerCase().includes(search);
            const matchesDescription = service.description?.toLowerCase().includes(search);
            if (!matchesTitle && !matchesDescription) return false;
        }

        // Status filter
        if (statusFilter !== 'all' && service.status !== statusFilter) return false;

        // Category filter
        if (categoryFilter !== 'all' && service.category !== categoryFilter) return false;

        return true;
    });

    // Calculate stats (only for view=mine)
    const stats = {
        total: services.length,
        verified: services.filter(s => s.verificationStatus === 'verified').length,
        pending: services.filter(s => s.verificationStatus === 'pending').length,
        rejected: services.filter(s => s.verificationStatus === 'rejected').length,
    };

    // Handlers
    const handleDelete = async (service: Service) => {
        Modal.confirm({
            title: 'Delete Service',
            content: 'Are you sure you want to delete this service?',
            okText: 'Delete',
            okType: 'danger',
            onOk: async () => {
                try {
                    await servicesApi.delete(service._id);
                    showToast.success('Service deleted successfully');
                    fetchServices();
                } catch (error) {
                    showToast.error('Failed to delete service');
                }
            },
        });
    };

    const handleVerify = async (service: Service) => {
        try {
            setActionLoading(service._id);
            await servicesApi.verify(service._id);
            showToast.success('Service verified successfully');
            fetchServices();
        } catch (error) {
            showToast.error('Failed to verify service');
        } finally {
            setActionLoading(null);
        }
    };

    const handleRejectClick = (service: Service) => {
        setSelectedService(service);
        setIsRejectModalOpen(true);
    };

    const handleRejectSubmit = async () => {
        if (!selectedService || !rejectionReason.trim()) {
            showToast.error('Please provide a rejection reason');
            return;
        }

        try {
            setActionLoading(selectedService._id);
            await servicesApi.reject(selectedService._id, rejectionReason);
            showToast.success('Service rejected');
            setIsRejectModalOpen(false);
            setSelectedService(null);
            setRejectionReason('');
            fetchServices();
        } catch (error) {
            showToast.error('Failed to reject service');
        } finally {
            setActionLoading(null);
        }
    };

    const handleUnpublish = async (service: Service) => {
        try {
            setActionLoading(service._id);
            // Optimistically update the local state immediately for instant UI feedback
            setServices(prevServices =>
                prevServices.map(s =>
                    s._id === service._id
                        ? { ...s, status: 'suspended' as const }
                        : s
                )
            );
            
            await servicesApi.unpublish(service._id);
            showToast.success('Service unpublished successfully');
            
            // Refresh to ensure consistency with backend
            await fetchServices();
        } catch (error: any) {
            // Revert optimistic update on error
            setServices(prevServices =>
                prevServices.map(s =>
                    s._id === service._id
                        ? { ...s, status: service.status }
                        : s
                )
            );
            showToast.error(error.response?.data?.message || 'Failed to unpublish service');
        } finally {
            setActionLoading(null);
        }
    };

    const handleRepublish = async (service: Service) => {
        try {
            setActionLoading(service._id);
            // Optimistically update the local state immediately for instant UI feedback
            setServices(prevServices =>
                prevServices.map(s =>
                    s._id === service._id
                        ? { ...s, status: 'active' as const }
                        : s
                )
            );
            
            await servicesApi.republish(service._id);
            showToast.success('Service republished successfully');
            
            // Refresh to ensure consistency with backend
            await fetchServices();
        } catch (error: any) {
            // Revert optimistic update on error
            setServices(prevServices =>
                prevServices.map(s =>
                    s._id === service._id
                        ? { ...s, status: service.status }
                        : s
                )
            );
            showToast.error(error.response?.data?.message || 'Failed to republish service');
        } finally {
            setActionLoading(null);
        }
    };

    const handleSaveToggle = (serviceId: string) => {
        const isSaved = savedServicesManager.toggle(serviceId);
        setSavedIds(savedServicesManager.getSavedIds());
        showToast.success(isSaved ? 'Service saved' : 'Service unsaved');
    };

    const handleTabChange = (key: string) => {
        if (isHS) {
            router.push(`/services?tab=${key}`);
        } else {
            router.push(`/services?view=${key}`);
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
                    <Title level={2} className="mb-1">Services</Title>
                    <Text type="secondary">
                        {isHS && 'Browse available services'}
                        {isSP && currentView === 'mine' && 'Manage your service listings'}
                        {isSP && currentView === 'all' && 'Browse all services'}
                        {isSP && currentView === 'pending' && 'Services awaiting verification'}
                        {isAdmin && 'Manage all services'}
                    </Text>
                </div>
                {canCreateService(user.role) && (
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => router.push('/services/create')}
                        size="large"
                    >
                        Create Service
                    </Button>
                )}
            </div>

            {/* Tabs */}
            {isHS ? (
                <Tabs activeKey={currentTab} onChange={handleTabChange}>
                    <Tabs.TabPane tab="Browse Services" key="active" />
                    <Tabs.TabPane tab={`Saved (${savedIds.length})`} key="saved" />
                </Tabs>
            ) : (isSP || isAdmin) ? (
                <Tabs activeKey={currentView} onChange={handleTabChange}>
                    {isSP && <Tabs.TabPane tab="My Services" key="mine" />}
                    {(isSP || isAdmin) && <Tabs.TabPane tab="All Services" key="all" />}
                    {isSP && <Tabs.TabPane tab="Pending Verification" key="pending" />}
                </Tabs>
            ) : null}

            {/* Contextual Stats (only for view=mine) */}
            {!isHS && currentView === 'mine' && (
                <Row gutter={[16, 16]}>
                    <Col xs={12} sm={8} lg={6}>
                        <Card>
                            <Statistic
                                title="Total Services"
                                value={stats.total}
                                prefix={<ToolOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col xs={12} sm={8} lg={6}>
                        <Card>
                            <Statistic
                                title="Verified"
                                value={stats.verified}
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
                </Row>
            )}

            {/* Search and Filters */}
            <Card>
                <Row gutter={[16, 16]}>
                    <Col xs={24} md={12}>
                        <Search
                            placeholder="Search by title or description..."
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
                            <Select.Option value="active">Active</Select.Option>
                            <Select.Option value="inactive">Inactive</Select.Option>
                            <Select.Option value="suspended">Suspended</Select.Option>
                        </Select>
                    </Col>
                    <Col xs={12} md={6}>
                        <Select
                            size="large"
                            value={categoryFilter}
                            onChange={setCategoryFilter}
                            style={{ width: '100%' }}
                        >
                            <Select.Option value="all">All Categories</Select.Option>
                            <Select.Option value="Plumbing">Plumbing</Select.Option>
                            <Select.Option value="Electrical">Electrical</Select.Option>
                            <Select.Option value="Cleaning">Cleaning</Select.Option>
                            <Select.Option value="Moving">Moving</Select.Option>
                        </Select>
                    </Col>
                </Row>
            </Card>

            {/* Services Table */}
            <Card>
                <ServicesTable
                    services={filteredServices}
                    loading={loading}
                    onEdit={(s) => router.push(`/services/${s._id}`)}
                    onDelete={canCreateService(user.role) ? handleDelete : undefined}
                    onVerify={canModerateServices(user.role) ? handleVerify : undefined}
                    onReject={canModerateServices(user.role) ? handleRejectClick : undefined}
                    onUnpublish={canCreateService(user.role) ? handleUnpublish : undefined}
                    onRepublish={canCreateService(user.role) ? handleRepublish : undefined}
                    onSaveToggle={isHS ? handleSaveToggle : undefined}
                    savedIds={isHS ? savedIds : undefined}
                    approvingId={actionLoading}
                />
            </Card>

            {/* Rejection Modal (Admin Only) */}
            <Modal
                title="Reject Service"
                open={isRejectModalOpen}
                onOk={handleRejectSubmit}
                onCancel={() => {
                    setIsRejectModalOpen(false);
                    setSelectedService(null);
                    setRejectionReason('');
                }}
                confirmLoading={actionLoading === selectedService?._id}
            >
                <div style={{ marginBottom: 16 }}>
                    <Text>Service: <strong>{selectedService?.title}</strong></Text>
                </div>
                <TextArea
                    rows={4}
                    placeholder="Enter rejection reason (will be sent to the provider via email)..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                />
            </Modal>
        </div>
    );
}

export default function ServicesPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        }>
            <ServicesPageContent />
        </Suspense>
    );
}
