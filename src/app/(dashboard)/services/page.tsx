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
import Descriptions from 'antd/es/descriptions';
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
    getServiceBusinessLabel,
    getServiceCategoryLabel,
    getServiceImageUrls,
    getServiceProviderLabel,
    serviceNeedsReview,
    type ServiceView,
    type ServiceTab,
} from '@/lib/services-utils';
import { SERVICE_CATEGORY_OPTIONS } from '@/lib/service-categories';
import {
    LIST_PAGE_SIZE,
    EMPTY_LIST_PAGINATION,
    extractListItems,
    extractListPagination,
    tablePaginationConfig,
} from '@/lib/list-pagination';

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
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [serviceForReview, setServiceForReview] = useState<Service | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState(EMPTY_LIST_PAGINATION);
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Determine current view/tab based on role and query params
    const isHS = user?.role && isHomeSeeker(user.role);
    const isSP = user?.role && isServiceProvider(user.role);
    const isAdmin = user?.role === 'admin';

    // For home_seekers: use tab, for others: use view
    const currentTab = isHS ? (tabParam || getDefaultServiceTab()) : 'active';
    const currentView = !isHS ? (viewParam || getDefaultServiceView(user?.role || 'home_seeker')) : 'all';

    const useServerPagination = Boolean(
        isAdmin || (isHS && currentTab === 'active') || (isSP && currentView === 'all'),
    );

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchText.trim()), 400);
        return () => clearTimeout(timer);
    }, [searchText]);

    // Fetch services on mount and when view/tab/page/filters change
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

        fetchServices(currentPage);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.role, currentView, currentTab, tabParam, viewParam, isHS, currentPage, debouncedSearch, statusFilter, categoryFilter]);

    // Load saved services for home_seekers
    useEffect(() => {
        if (isHS) {
            setSavedIds(savedServicesManager.getSavedIds());
        }
    }, [isHS]);

    const fetchServices = async (page = currentPage) => {
        if (!user?.role) {
            return;
        }

        try {
            setLoading(true);
            let fetchedServices: Service[] = [];
            let response: unknown = null;
            const serverFilters = {
                page,
                limit: LIST_PAGE_SIZE,
                status: statusFilter !== 'all' ? statusFilter : undefined,
                search: debouncedSearch || undefined,
                category: categoryFilter !== 'all' ? categoryFilter : undefined,
            };

            if (isHS) {
                response = await servicesApi.getAll({
                    page,
                    limit: LIST_PAGE_SIZE,
                    status: 'active',
                    verified: true,
                    category: categoryFilter !== 'all' ? categoryFilter : undefined,
                    location: debouncedSearch || undefined,
                });
                fetchedServices = extractListItems<Service>(response).filter(
                    (s) => s.verificationStatus === 'verified' && s.status === 'active',
                );
            } else if (isAdmin) {
                if (currentView === 'pending') {
                    response = await servicesApi.getPendingServices(page, LIST_PAGE_SIZE);
                } else {
                    response = await servicesApi.getAllAdminServices(serverFilters);
                }
                fetchedServices = extractListItems<Service>(response);
            } else if (isSP) {
                if (currentView === 'mine') {
                    response = await servicesApi.getMyServices();
                    fetchedServices = extractListItems<Service>(response);
                    if (!fetchedServices.length && Array.isArray((response as any)?.data)) {
                        fetchedServices = (response as any).data;
                    }
                } else if (currentView === 'all') {
                    response = await servicesApi.getAll({
                        page,
                        limit: LIST_PAGE_SIZE,
                        status: 'active',
                        verified: true,
                        category: categoryFilter !== 'all' ? categoryFilter : undefined,
                        location: debouncedSearch || undefined,
                    });
                    fetchedServices = extractListItems<Service>(response).filter(
                        (s) => s.verificationStatus === 'verified' && s.status === 'active',
                    );
                } else if (currentView === 'pending') {
                    response = await servicesApi.getMyServices();
                    const myServices = extractListItems<Service>(response);
                    const source = myServices.length
                        ? myServices
                        : Array.isArray((response as any)?.data)
                          ? (response as any).data
                          : [];
                    fetchedServices = source.filter((s: Service) => serviceNeedsReview(s));
                }
            }

            setServices(fetchedServices);
            if (useServerPagination) {
                setPagination(extractListPagination(response, fetchedServices.length, page, LIST_PAGE_SIZE));
            } else {
                setPagination({
                    ...EMPTY_LIST_PAGINATION,
                    totalItems: fetchedServices.length,
                    itemsPerPage: LIST_PAGE_SIZE,
                    totalPages: Math.max(1, Math.ceil(fetchedServices.length / LIST_PAGE_SIZE)),
                });
            }
        } catch (error: any) {
            if (error.response?.status !== 404) {
                const errorMsg = error.response?.data?.message || error.message || 'Failed to load services';
                showToast.error(errorMsg);
            }
            setServices([]);
            setPagination(EMPTY_LIST_PAGINATION);
        } finally {
            setLoading(false);
        }
    };

    // Filter services for display. Admin / server-paged views already apply search & status.
    const filteredServices = services.filter(service => {
        if (isHS && currentTab === 'saved') {
            if (!savedIds.includes(service._id)) return false;
        }

        if (useServerPagination) {
            if (categoryFilter !== 'all' && service.category !== categoryFilter) return false;
            return true;
        }

        if (searchText) {
            const search = searchText.toLowerCase();
            const matchesTitle = service.title?.toLowerCase().includes(search);
            const matchesDescription = service.description?.toLowerCase().includes(search);
            if (!matchesTitle && !matchesDescription) return false;
        }

        if (statusFilter !== 'all' && service.status !== statusFilter) return false;

        if (categoryFilter !== 'all' && service.category !== categoryFilter) return false;

        return true;
    });

    // Calculate stats (only for view=mine)
    const stats = {
        total: services.length,
        verified: services.filter(s => s.verificationStatus === 'verified').length,
        pending: services.filter(s => serviceNeedsReview(s)).length,
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

    const handleActivate = async (service: Service) => {
        try {
            setActionLoading(service._id);
            await servicesApi.update(service._id, { status: 'active' });
            showToast.success('Service activated successfully');
            fetchServices();
        } catch (error: any) {
            showToast.error(error.response?.data?.message || 'Failed to activate service');
        } finally {
            setActionLoading(null);
        }
    };

    const handleReviewClick = (service: Service) => {
        setServiceForReview(service);
        setReviewModalOpen(true);
    };

    const handleRejectClick = (service: Service) => {
        setSelectedService(service);
        setReviewModalOpen(false);
        setServiceForReview(null);
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

    const handleToggleFeatured = async (service: Service) => {
        const newValue = !service.isPremium;
        try {
            setActionLoading(service._id);
            setServices((prev) =>
                prev.map((s) => (s._id === service._id ? { ...s, isPremium: newValue } : s)),
            );
            await servicesApi.toggleFeatured(service._id, newValue);
            showToast.success(newValue ? 'Service marked as featured' : 'Featured status removed');
        } catch (error: any) {
            setServices((prev) =>
                prev.map((s) => (s._id === service._id ? { ...s, isPremium: service.isPremium } : s)),
            );
            showToast.error(error.response?.data?.message || 'Failed to update featured status');
        } finally {
            setActionLoading(null);
        }
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const resetToFirstPage = () => {
        setCurrentPage(1);
    };

    const handleTabChange = (key: string) => {
        setCurrentPage(1);
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
                            onChange={(e) => {
                                setSearchText(e.target.value);
                                resetToFirstPage();
                            }}
                        />
                    </Col>
                    <Col xs={12} md={6}>
                        <Select
                            size="large"
                            value={statusFilter}
                            onChange={(v) => {
                                setStatusFilter(v);
                                resetToFirstPage();
                            }}
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
                            onChange={(v) => {
                                setCategoryFilter(v);
                                resetToFirstPage();
                            }}
                            style={{ width: '100%' }}
                        >
                            <Select.Option value="all">All Categories</Select.Option>
                            {SERVICE_CATEGORY_OPTIONS.map((cat) => (
                                <Select.Option key={cat.value} value={cat.value}>
                                    {cat.label}
                                </Select.Option>
                            ))}
                        </Select>
                    </Col>
                </Row>
            </Card>

            {/* Services Table */}
            <Card>
                <ServicesTable
                    services={filteredServices}
                    loading={loading}
                    adminStatusColumn={isAdmin}
                    pagination={
                        useServerPagination
                            ? tablePaginationConfig(pagination, handlePageChange, 'services')
                            : {
                                  pageSize: LIST_PAGE_SIZE,
                                  showSizeChanger: false,
                                  hideOnSinglePage: true,
                                  showTotal: (total) => `Total ${total} services`,
                              }
                    }
                    onEdit={(s) => router.push(`/services/${s._id}`)}
                    onDelete={canCreateService(user.role) ? handleDelete : undefined}
                    onReview={canModerateServices(user.role) ? handleReviewClick : undefined}
                    onVerify={canModerateServices(user.role) ? handleVerify : undefined}
                    onReject={canModerateServices(user.role) ? handleRejectClick : undefined}
                    onActivate={canModerateServices(user.role) ? handleActivate : undefined}
                    onUnpublish={canCreateService(user.role) ? handleUnpublish : undefined}
                    onRepublish={canCreateService(user.role) ? handleRepublish : undefined}
                    onSaveToggle={isHS ? handleSaveToggle : undefined}
                    onToggleFeatured={isAdmin ? handleToggleFeatured : undefined}
                    savedIds={isHS ? savedIds : undefined}
                    approvingId={actionLoading}
                />
            </Card>

            {/* Review Modal (Admin): view full details then Verify or Reject */}
            <Modal
                title="Review Service"
                open={reviewModalOpen}
                onCancel={() => {
                    setReviewModalOpen(false);
                    setServiceForReview(null);
                }}
                width={720}
                footer={null}
            >
                {serviceForReview && (
                    <>
                        <Descriptions bordered column={1} size="small" className="mb-4">
                            <Descriptions.Item label="Title">{serviceForReview.title}</Descriptions.Item>
                            <Descriptions.Item label="Category">{getServiceCategoryLabel(serviceForReview) || '—'}</Descriptions.Item>
                            <Descriptions.Item label="Provider">{getServiceProviderLabel(serviceForReview) || '—'}</Descriptions.Item>
                            <Descriptions.Item label="Location">{serviceForReview.location || '—'}</Descriptions.Item>
                            <Descriptions.Item label="Price">{serviceForReview.price != null ? `$${serviceForReview.price.toLocaleString()}` : '—'}</Descriptions.Item>
                            <Descriptions.Item label="Business">{getServiceBusinessLabel(serviceForReview) || '—'}</Descriptions.Item>
                            <Descriptions.Item label="Description">
                                <div className="max-h-32 overflow-y-auto whitespace-pre-wrap">{serviceForReview.description || '—'}</div>
                            </Descriptions.Item>
                        </Descriptions>

                        <div className="mb-4">
                            <div className="text-sm font-medium text-gray-700 mb-2">Images</div>
                            {(() => {
                                const urls = getServiceImageUrls(serviceForReview);
                                if (!urls.length) {
                                    return <div className="text-sm text-gray-500">No images</div>;
                                }
                                return (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {urls.map((img, idx) => (
                                            <a
                                                key={`${img}-${idx}`}
                                                href={img}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block border border-gray-200 rounded-lg overflow-hidden hover:border-blue-400 transition-colors"
                                                title={`Open image ${idx + 1}`}
                                            >
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={img}
                                                    alt={`Service image ${idx + 1}`}
                                                    className="w-full h-28 object-cover bg-gray-50"
                                                    loading="lazy"
                                                />
                                            </a>
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button onClick={() => { setReviewModalOpen(false); setServiceForReview(null); }}>Cancel</Button>
                            <Button danger onClick={() => handleRejectClick(serviceForReview)}>Reject</Button>
                            <Button
                                type="primary"
                                icon={<CheckCircleOutlined />}
                                loading={actionLoading === serviceForReview._id}
                                onClick={async () => {
                                    await handleVerify(serviceForReview);
                                    setReviewModalOpen(false);
                                    setServiceForReview(null);
                                }}
                                style={{ background: '#52c41a', borderColor: '#52c41a' }}
                            >
                                Verify
                            </Button>
                        </div>
                    </>
                )}
            </Modal>

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
