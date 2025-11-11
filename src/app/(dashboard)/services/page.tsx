'use client';

import { useState, useEffect } from 'react';
import Typography from 'antd/es/typography';
import Button from 'antd/es/button';
import Card from 'antd/es/card';
import Row from 'antd/es/row';
import Col from 'antd/es/col';
import Input from 'antd/es/input';
import Select from 'antd/es/select';
import Tag from 'antd/es/tag';
import Descriptions from 'antd/es/descriptions';
import Image from 'antd/es/image';
import Space from 'antd/es/space';
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
import { mediaApi } from '@/services/api/media.api';
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
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
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

                // Handle both response formats
                let pageData: Service[] = [];
                let pagination: any = null;

                if (Array.isArray(response?.data)) {
                    pageData = response.data as Service[];
                } else if (response?.data?.data) {
                    pageData = response.data.data || [];
                    pagination = response.data.pagination;
                }

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

    const handleEdit = (service: Service) => {
        setEditingService(service);
        setIsModalOpen(true);
    };

    const handleSubmit = async (values: Partial<Service>, files: File[]) => {
        try {
            setSubmitting(true);

            if (editingService) {
                // For editing, just update the service
                await servicesApi.update(editingService._id, values as any);
                showToast.success('Service updated successfully');
            } else {
                // Step 1: Create service without images
                const response = await servicesApi.create(values as any);
                const createdService = response.data;

                // Step 2: Upload images via backend API to Digital Ocean Spaces
                let imageUrls: string[] = [];
                if (files.length > 0) {
                    try {
                        // uploadedMedia is MediaResponse[] directly
                        const uploadedMedia = await mediaApi.uploadMultiple(
                            files,
                            'services',
                            createdService._id
                        );
                        imageUrls = uploadedMedia.map(media => media.url);
                        console.log('✅ Images uploaded successfully:', imageUrls);
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
            setEditingService(null); // Reset editing service
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

    const handleApproveClick = async (service: Service) => {
        try {
            // Fetch fresh service data to avoid stale state
            const response = await servicesApi.getById(service._id);
            setSelectedService(response.data);
            setIsViewModalOpen(true);
        } catch (error: any) {
            message.error('Failed to load service details');
        }
    };

    const handleApproveConfirm = async () => {
        if (!selectedService) return;

        // Check if service is already verified
        if (selectedService.verificationStatus === 'verified') {
            message.warning('This service is already verified');
            setIsViewModalOpen(false);
            fetchServices();
            return;
        }

        try {
            setActionLoading(selectedService._id);
            await servicesApi.verify(selectedService._id);
            message.success('Service approved successfully');
            setIsViewModalOpen(false);
            setSelectedService(null);
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
            setIsViewModalOpen(false);
            setRejectionReason('');
            setSelectedService(null);
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

        // Match status filter - check both status and verificationStatus
        if (statusFilter === 'all') {
            return matchesSearch && (categoryFilter === 'all' || service.category === categoryFilter);
        }

        if (statusFilter === 'pending') {
            const matchesPending = service.verificationStatus === 'pending' || service.status === 'pending';
            return matchesSearch && matchesPending && (categoryFilter === 'all' || service.category === categoryFilter);
        }

        if (statusFilter === 'verified') {
            const matchesVerified = service.verificationStatus === 'verified';
            return matchesSearch && matchesVerified && (categoryFilter === 'all' || service.category === categoryFilter);
        }

        const matchesStatus = service.status === statusFilter;
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
            title: 'Verified',
            value: services.filter(s => s.verificationStatus === 'verified').length,
            icon: <CheckCircleOutlined />,
            color: '#43e97b',
            bgColor: '#43e97b15',
        },
        {
            title: 'Pending',
            value: services.filter(s => s.verificationStatus === 'pending').length,
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
                            <Select.Option value="pending">Pending Approval</Select.Option>
                            <Select.Option value="verified">Verified</Select.Option>
                            <Select.Option value="rejected">Rejected</Select.Option>
                            <Select.Option value="active">Active</Select.Option>
                            <Select.Option value="inactive">Inactive</Select.Option>
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
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onApprove={handleApproveClick}
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

            {/* View Service Details Modal */}
            {selectedService && (
                <Modal
                    title={
                        <div style={{ fontSize: '18px', fontWeight: 600 }}>
                            Service Details
                        </div>
                    }
                    open={isViewModalOpen}
                    onCancel={() => setIsViewModalOpen(false)}
                    footer={[
                        <Button
                            key="close"
                            size="large"
                            onClick={() => setIsViewModalOpen(false)}
                            style={{ borderRadius: '8px' }}
                        >
                            Close
                        </Button>,
                        selectedService?.verificationStatus === 'pending' && (
                            <Button
                                key="reject"
                                size="large"
                                danger
                                onClick={() => {
                                    setIsViewModalOpen(false);
                                    setRejectionReason('');
                                    setIsRejectModalOpen(true);
                                }}
                                style={{ borderRadius: '8px' }}
                            >
                                Reject
                            </Button>
                        ),
                        selectedService?.verificationStatus === 'pending' && (
                            <Button
                                key="approve"
                                size="large"
                                type="primary"
                                onClick={handleApproveConfirm}
                                loading={actionLoading === selectedService?._id}
                                style={{
                                    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                                    border: 'none',
                                    borderRadius: '8px'
                                }}
                            >
                                Approve
                            </Button>
                        ),
                    ]}
                    width={800}
                >
                    <Descriptions bordered column={2} style={{ marginTop: '20px' }}>
                        <Descriptions.Item label="Service Name" span={2}>
                            <Text strong>{selectedService.title}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Category">{selectedService.category}</Descriptions.Item>
                        <Descriptions.Item label="Status">
                            <Tag color={
                                selectedService.verificationStatus === 'verified' ? 'green' :
                                selectedService.verificationStatus === 'rejected' ? 'red' : 'orange'
                            }>
                                {selectedService.verificationStatus
                                    ? selectedService.verificationStatus.charAt(0).toUpperCase() + selectedService.verificationStatus.slice(1)
                                    : 'Pending'}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Location" span={2}>{selectedService.location}</Descriptions.Item>
                        <Descriptions.Item label="Price">
                            <Text strong style={{ fontSize: '16px', color: '#52c41a' }}>
                                ${selectedService.price?.toLocaleString()} / {selectedService.priceUnit || 'hour'}
                            </Text>
                        </Descriptions.Item>
                        {selectedService.duration && (
                            <Descriptions.Item label="Duration">{selectedService.duration}</Descriptions.Item>
                        )}
                        {selectedService.businessName && (
                            <Descriptions.Item label="Business Name" span={2}>{selectedService.businessName}</Descriptions.Item>
                        )}
                        {selectedService.experience !== undefined && (
                            <Descriptions.Item label="Experience">{selectedService.experience} years</Descriptions.Item>
                        )}
                        {selectedService.verificationNumber && (
                            <Descriptions.Item label="License Number">{selectedService.verificationNumber}</Descriptions.Item>
                        )}
                        {selectedService.phoneNumber && (
                            <Descriptions.Item label="Phone">{selectedService.phoneNumber}</Descriptions.Item>
                        )}
                        {selectedService.whatsappNumber && (
                            <Descriptions.Item label="WhatsApp">{selectedService.whatsappNumber}</Descriptions.Item>
                        )}
                        {selectedService.rating !== undefined && (
                            <Descriptions.Item label="Rating">
                                {selectedService.rating} ⭐ ({selectedService.reviewCount || 0} reviews)
                            </Descriptions.Item>
                        )}
                        {selectedService.bookings !== undefined && (
                            <Descriptions.Item label="Total Bookings">{selectedService.bookings}</Descriptions.Item>
                        )}
                        <Descriptions.Item label="Description" span={2}>
                            {selectedService.description}
                        </Descriptions.Item>

                        {/* Images */}
                        {selectedService.images && selectedService.images.length > 0 ? (
                            <Descriptions.Item label="Images" span={2}>
                                <Image.PreviewGroup>
                                    <Space wrap style={{ marginTop: '8px' }}>
                                        {selectedService.images.map((img, idx) => (
                                            <Image
                                                key={idx}
                                                src={img}
                                                alt={`Service ${idx + 1}`}
                                                width={100}
                                                height={100}
                                                style={{
                                                    objectFit: 'cover',
                                                    borderRadius: '8px',
                                                }}
                                                preview={{
                                                    src: img,
                                                }}
                                            />
                                        ))}
                                    </Space>
                                </Image.PreviewGroup>
                            </Descriptions.Item>
                        ) : (
                            <Descriptions.Item label="Images" span={2}>
                                <Text type="secondary">No images uploaded</Text>
                            </Descriptions.Item>
                        )}
                    </Descriptions>
                </Modal>
            )}

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
