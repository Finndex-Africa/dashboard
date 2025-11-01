'use client';

import { useState, useEffect } from 'react';
import Typography from 'antd/es/typography';
import Button from 'antd/es/button';
import Card from 'antd/es/card';
import Row from 'antd/es/row';
import Col from 'antd/es/col';
import Input from 'antd/es/input';
import Select from 'antd/es/select';
import {
    PlusOutlined,
    ToolOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    StarOutlined,
    SearchOutlined,
} from '@ant-design/icons';
import { ServicesTable } from '@/components/dashboard/ServicesTable';
import { ServiceForm } from '@/components/dashboard/ServiceForm';
import type { Service } from '@/types/dashboard';
import { servicesApi } from '@/services/api/services.api';
import { uploadMultipleToDigitalOcean } from '@/lib/digitalocean-upload';
import Modal from 'antd/es/modal';
import message from 'antd/es/message';
import { showToast } from '@/lib/toast';

const { Title, Text } = Typography;
const { Search } = Input;
const { TextArea } = Input;

export default function ServicesPage() {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            setLoading(true);
            let allServices: Service[] = [];
            let currentPage = 1;
            let hasMore = true;

            while (hasMore) {
                const response = await servicesApi.getAll({ page: currentPage, limit: 100 });
                const pageData = response?.data?.data || [];
                const pagination = response?.data?.pagination;

                console.log(`Services - Page ${currentPage}: ${pageData.length} items, Total: ${pagination?.totalItems || 'unknown'}`);

                allServices = [...allServices, ...pageData];

                if (!pagination || currentPage >= pagination.totalPages) {
                    hasMore = false;
                    continue;
                }
                currentPage++;
            }

            setServices(allServices);
            console.log(`Fetched ${allServices.length} total services`);
        } catch (error: any) {
            console.error('Failed to fetch services:', error);
            if (error.response?.status !== 404) {
                showToast.error('Failed to load services');
            }
            setServices([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (service: Service) => {
        try {
            await servicesApi.delete(service._id);
            showToast.success('Service deleted successfully');
            fetchServices();
        } catch (error: any) {
            showToast.error(error.response?.data?.message || 'Failed to delete service');
        }
    };

    const handleAddService = () => {
        setEditingService(null);
        setIsModalOpen(true);
    };

    const handleSubmit = async (values: Partial<Service>, files: File[]) => {
        try {
            setSubmitting(true);

            if (editingService) {
                // For editing, just update the service
                await servicesApi.update(editingService._id, values);
                showToast.success('Service updated successfully');
            } else {
                // Step 1: Create service without images
                const response = await servicesApi.create(values as any);
                const createdService = response.data;

                // Step 2: Upload images to DigitalOcean with service ID as subfolder
                let imageUrls: string[] = [];
                if (files.length > 0) {
                    try {
                        imageUrls = await uploadMultipleToDigitalOcean(
                            files,
                            'services',
                            createdService._id
                        );
                    } catch (uploadError) {
                        console.error('Failed to upload images:', uploadError);
                        showToast.warning('Service created but image upload failed. You can add images later.');
                    }
                }

                // Step 3: Update service with image URLs if any were uploaded
                if (imageUrls.length > 0) {
                    await servicesApi.update(createdService._id, { images: imageUrls } as any);
                }

                showToast.success('Service created successfully');
            }

            setIsModalOpen(false);
            fetchServices();
        } catch (error: any) {
            showToast.error(error.response?.data?.message || 'Failed to save service');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = () => {
        setIsModalOpen(false);
        setEditingService(null);
    };

    const handleApprove = async (service: Service) => {
        try {
            setActionLoading(service._id);
            await servicesApi.verify(service._id);
            message.success('Service approved successfully');
            fetchServices();
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to approve service');
        } finally {
            setActionLoading(null);
        }
    };

    const handleRejectClick = (service: Service) => {
        setSelectedService(service);
        setRejectionReason('');
        setIsRejectModalOpen(true);
    };

    const handleRejectSubmit = async () => {
        if (!selectedService) return;

        if (!rejectionReason.trim()) {
            message.error('Please provide a rejection reason');
            return;
        }

        try {
            setActionLoading(selectedService._id);
            await servicesApi.reject(selectedService._id, rejectionReason);
            message.success('Service rejected successfully. An email has been sent to the creator.');
            setIsRejectModalOpen(false);
            setRejectionReason('');
            fetchServices();
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to reject service');
        } finally {
            setActionLoading(null);
        }
    };

    // Filter services
    const filteredServices = services.filter(service => {
        const matchesSearch = service.title?.toLowerCase().includes(searchText.toLowerCase()) ||
            service.description?.toLowerCase().includes(searchText.toLowerCase());
        const matchesStatus = statusFilter === 'all' || service.status === statusFilter;
        const matchesCategory = categoryFilter === 'all' || service.category === categoryFilter;
        return matchesSearch && matchesStatus && matchesCategory;
    });

    const stats = [
        {
            title: 'Total Services',
            value: services.length,
            icon: <ToolOutlined />,
            color: '#4facfe',
            bgColor: '#4facfe15',
        },
        {
            title: 'Active',
            value: services.filter(s => s.status === 'active').length,
            icon: <CheckCircleOutlined />,
            color: '#43e97b',
            bgColor: '#43e97b15',
        },
        {
            title: 'Pending',
            value: services.filter(s => s.status === 'pending').length,
            icon: <ClockCircleOutlined />,
            color: '#ffa94d',
            bgColor: '#ffa94d15',
        },
        {
            title: 'Avg Rating',
            value: services.length > 0
                ? (services.reduce((sum, s) => sum + (s.rating || 0), 0) / services.length).toFixed(1)
                : '0.0',
            icon: <StarOutlined />,
            color: '#f093fb',
            bgColor: '#f093fb15',
        },
    ];

    return (
        <div className="space-y-6">
            {/* Modern Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <Title level={2} className="mb-1" style={{
                        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        Services
                    </Title>
                    <Text type="secondary">Manage property services and providers</Text>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    size="large"
                    onClick={handleAddService}
                    style={{
                        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                        border: 'none',
                        borderRadius: '8px',
                        height: '44px',
                        padding: '0 24px',
                    }}
                >
                    Add Service
                </Button>
            </div>

            {/* Compact Statistics */}
            <Row gutter={[16, 16]}>
                {stats.map((stat, index) => (
                    <Col xs={12} sm={12} lg={6} key={index}>
                        <Card
                            className="hover:shadow-lg transition-all duration-300"
                            style={{
                                borderRadius: '12px',
                                border: '1px solid #f0f0f0',
                            }}
                            styles={{ body: { padding: '20px' } }}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                                        {stat.title}
                                    </Text>
                                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: stat.color }}>
                                        {stat.value}
                                    </div>
                                </div>
                                <div
                                    style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '12px',
                                        backgroundColor: stat.bgColor,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '24px',
                                        color: stat.color,
                                    }}
                                >
                                    {stat.icon}
                                </div>
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* Search and Filters */}
            <Card
                style={{
                    borderRadius: '12px',
                    border: '1px solid #f0f0f0',
                }}
                styles={{ body: { padding: '20px' } }}
            >
                <Row gutter={[16, 16]}>
                    <Col xs={24} md={12} lg={10}>
                        <Search
                            placeholder="Search services by name or description..."
                            allowClear
                            size="large"
                            prefix={<SearchOutlined style={{ color: '#4facfe' }} />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            style={{
                                borderRadius: '8px',
                            }}
                        />
                    </Col>
                    <Col xs={12} md={6} lg={4}>
                        <Select
                            size="large"
                            value={statusFilter}
                            onChange={setStatusFilter}
                            style={{ width: '100%', borderRadius: '8px' }}
                            placeholder="Status"
                        >
                            <Select.Option value="all">All Status</Select.Option>
                            <Select.Option value="active">Active</Select.Option>
                            <Select.Option value="inactive">Inactive</Select.Option>
                            <Select.Option value="pending">Pending</Select.Option>
                            <Select.Option value="rejected">Rejected</Select.Option>
                        </Select>
                    </Col>
                    <Col xs={12} md={6} lg={4}>
                        <Select
                            size="large"
                            value={categoryFilter}
                            onChange={setCategoryFilter}
                            style={{ width: '100%', borderRadius: '8px' }}
                            placeholder="Category"
                        >
                            <Select.Option value="all">All Categories</Select.Option>
                            <Select.Option value="maintenance">Maintenance</Select.Option>
                            <Select.Option value="cleaning">Cleaning</Select.Option>
                            <Select.Option value="security">Security</Select.Option>
                            <Select.Option value="moving">Moving</Select.Option>
                            <Select.Option value="landscaping">Landscaping</Select.Option>
                            <Select.Option value="pest_control">Pest Control</Select.Option>
                            <Select.Option value="painting">Painting</Select.Option>
                            <Select.Option value="other">Other</Select.Option>
                        </Select>
                    </Col>
                    <Col xs={24} md={24} lg={6}>
                        <div className="flex items-center justify-end gap-2">
                            <Text type="secondary" style={{ fontSize: '14px' }}>
                                Showing {filteredServices.length} of {services.length} services
                            </Text>
                        </div>
                    </Col>
                </Row>
            </Card>

            {/* Services Table */}
            <Card
                style={{
                    borderRadius: '12px',
                    border: '1px solid #f0f0f0',
                }}
            >
                <ServicesTable
                    services={filteredServices}
                    loading={loading}
                    onDelete={handleDelete}
                    onApprove={handleApprove}
                    onReject={handleRejectClick}
                    approvingId={actionLoading}
                />
            </Card>

            {/* Add/Edit Service Modal */}
            <Modal
                title={editingService ? 'Edit Service' : 'Add New Service'}
                open={isModalOpen}
                onCancel={handleCancel}
                footer={null}
                width={800}
                styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
            >
                <ServiceForm
                    initialValues={editingService || undefined}
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                    loading={submitting}
                />
            </Modal>

            {/* Reject Service Modal */}
            <Modal
                title="Reject Service"
                open={isRejectModalOpen}
                onCancel={() => {
                    setIsRejectModalOpen(false);
                    setRejectionReason('');
                }}
                onOk={handleRejectSubmit}
                okText="Reject"
                okButtonProps={{ danger: true, loading: actionLoading === selectedService?._id }}
            >
                <div style={{ marginTop: '16px' }}>
                    <Text strong>Rejection Reason:</Text>
                    <Text type="secondary" style={{ display: 'block', marginTop: '4px', marginBottom: '8px' }}>
                        This reason will be sent to the service provider via email.
                    </Text>
                    <TextArea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Please provide a clear reason for rejecting this service..."
                        rows={4}
                        style={{ marginTop: '8px' }}
                    />
                </div>
            </Modal>
        </div>
    );
}
