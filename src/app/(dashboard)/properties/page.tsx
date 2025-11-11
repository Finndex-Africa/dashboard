'use client';

import { useState, useEffect } from 'react';
import Typography from 'antd/es/typography';
import Button from 'antd/es/button';
import Card from 'antd/es/card';
import Row from 'antd/es/row';
import Col from 'antd/es/col';
import Statistic from 'antd/es/statistic';
import Input from 'antd/es/input';
import Select from 'antd/es/select';
import Space from 'antd/es/space';
import Modal from 'antd/es/modal';
import Tag from 'antd/es/tag';
import Descriptions from 'antd/es/descriptions';
import Image from 'antd/es/image';
import {
    PlusOutlined,
    HomeOutlined,
    DollarOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    SearchOutlined,
    FilterOutlined,
} from '@ant-design/icons';
import { PropertiesTable } from '@/components/dashboard/PropertiesTable';
import { PropertyForm } from '@/components/dashboard/PropertyForm';
import type { Property } from '@/types/dashboard';
import { propertiesApi } from '@/services/api/properties.api';
import { mediaApi } from '@/services/api/media.api';
import { showToast } from '@/lib/toast';

const { Title, Text } = Typography;
const { Search } = Input;
const { TextArea } = Input;

export default function PropertiesPage() {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
    const [editingProperty, setEditingProperty] = useState<Property | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [properties, setProperties] = useState<Property[]>([]);
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    useEffect(() => {
        fetchProperties();
    }, []);

    const fetchProperties = async () => {
        try {
            setLoading(true);

            // Fetch ALL pages of properties
            let allProperties: Property[] = [];
            let currentPage = 1;
            let hasMore = true;

            while (hasMore) {
                const response = await propertiesApi.getAll({ page: currentPage, limit: 100 });

                // Handle both response formats
                let pageData: Property[] = [];
                let pagination: any = null;

                if (Array.isArray(response?.data)) {
                    pageData = response.data as Property[];
                } else if (response?.data?.data) {
                    pageData = response.data.data || [];
                    pagination = response.data.pagination;
                }

                allProperties = [...allProperties, ...pageData];

                // Check if there are more pages
                if (!pagination) {
                    hasMore = false;
                    continue;
                }

                if (currentPage >= pagination.totalPages) {
                    hasMore = false;
                    continue;
                }

                currentPage++;
            }

            setProperties(allProperties);
            console.log(`Fetched ${allProperties.length} total properties`);
        } catch (error: any) {
            console.error('Failed to fetch properties:', error);
            if (error.response?.status !== 404) {
                showToast.error('Failed to load properties');
            }
            setProperties([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddProperty = async (values: any, files: File[]) => {
        try {
            setSubmitting(true);

            // Handle update
            if (editingProperty) {
                await propertiesApi.update(editingProperty._id, values);
                showToast.success('Property updated successfully');
                setIsAddModalOpen(false);
                setEditingProperty(null);
                fetchProperties();
                return;
            }

            // Step 1: Create property without images
            const response = await propertiesApi.create(values);
            const createdProperty = response.data;

            // Step 2: Upload images via backend API to Digital Ocean Spaces
            let imageUrls: string[] = [];
            if (files.length > 0) {
                try {
                    // uploadResponse is MediaResponse[] directly
                    const uploadedMedia = await mediaApi.uploadMultiple(
                        files,
                        'properties',
                        createdProperty._id
                    );
                    imageUrls = uploadedMedia.map(media => media.url);
                    console.log('✅ Images uploaded successfully:', imageUrls);
                } catch (uploadError) {
                    console.error('Failed to upload images:', uploadError);
                    showToast.warning('Property created but image upload failed. You can add images later.');
                }
            }

            // Step 3: Update property with image URLs if any were uploaded
            if (imageUrls.length > 0) {
                await propertiesApi.update(createdProperty._id, { images: imageUrls });
            }

            showToast.success('Property added successfully');
            setIsAddModalOpen(false);
            setEditingProperty(null);
            fetchProperties();
        } catch (error: any) {
            showToast.error(error.response?.data?.message || `Failed to ${editingProperty ? 'update' : 'add'} property`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleView = async (property: Property) => {
        try {
            // Fetch fresh property data to ensure we have the latest images
            const response = await propertiesApi.getById(property._id);
            setSelectedProperty(response.data);
            setIsViewModalOpen(true);
        } catch (error: any) {
            console.error('Failed to fetch property details:', error);
            // Fallback to cached data if fetch fails
            setSelectedProperty(property);
            setIsViewModalOpen(true);
        }
    };

    const handleDelete = async (property: Property) => {
        try {
            await propertiesApi.delete(property._id);
            showToast.success('Property deleted successfully');
            fetchProperties();
        } catch (error: any) {
            showToast.error(error.response?.data?.message || 'Failed to delete property');
        }
    };

    const handleEdit = (property: Property) => {
        setEditingProperty(property);
        setIsAddModalOpen(true);
    };

    const handleApproveClick = (property: Property) => {
        setSelectedProperty(property);
        setIsViewModalOpen(true);
    };

    const handleApproveConfirm = async () => {
        if (!selectedProperty) return;

        try {
            setActionLoading(selectedProperty._id);
            await propertiesApi.approve(selectedProperty._id);
            showToast.success('Property approved successfully');
            setIsViewModalOpen(false);
            fetchProperties();
        } catch (error: any) {
            showToast.error(error.response?.data?.message || 'Failed to approve property');
        } finally {
            setActionLoading(null);
        }
    };

    const handleRejectClick = (property: Property) => {
        setSelectedProperty(property);
        setRejectionReason('');
        setIsRejectModalOpen(true);
    };

    const handleRejectSubmit = async () => {
        if (!selectedProperty) return;

        if (!rejectionReason.trim()) {
            showToast.error('Please provide a rejection reason');
            return;
        }

        try {
            setActionLoading(selectedProperty._id);
            await propertiesApi.reject(selectedProperty._id, rejectionReason);
            showToast.success('Property rejected successfully. An email has been sent to the creator.');
            setIsRejectModalOpen(false);
            setRejectionReason('');
            fetchProperties();
        } catch (error: any) {
            showToast.error(error.response?.data?.message || 'Failed to reject property');
        } finally {
            setActionLoading(null);
        }
    };

    // Filter properties based on search and filters
    const filteredProperties = properties.filter(property => {
        const matchesSearch = property.title?.toLowerCase().includes(searchText.toLowerCase()) ||
                            property.location?.toLowerCase().includes(searchText.toLowerCase());
        const matchesStatus = statusFilter === 'all' || property.status === statusFilter;
        const matchesType = typeFilter === 'all' || property.propertyType === typeFilter;
        return matchesSearch && matchesStatus && matchesType;
    });

    const stats = [
        {
            title: 'Total Properties',
            value: properties.length,
            icon: <HomeOutlined />,
            color: '#667eea',
            bgColor: '#667eea15',
        },
        {
            title: 'Total Value',
            value: properties.reduce((sum, p) => sum + (p.price || 0), 0),
            prefix: '$',
            icon: <DollarOutlined />,
            color: '#f093fb',
            bgColor: '#f093fb15',
        },
        {
            title: 'Approved',
            value: properties.filter(p => p.status === 'approved').length,
            icon: <CheckCircleOutlined />,
            color: '#43e97b',
            bgColor: '#43e97b15',
        },
        {
            title: 'Pending',
            value: properties.filter(p => p.status === 'pending').length,
            icon: <ClockCircleOutlined />,
            color: '#ffa94d',
            bgColor: '#ffa94d15',
        },
        {
            title: 'Rented',
            value: properties.filter(p => p.status === 'rented').length,
            icon: <CheckCircleOutlined />,
            color: '#4facfe',
            bgColor: '#4facfe15',
        },
        {
            title: 'Rejected',
            value: properties.filter(p => p.status === 'rejected').length,
            icon: <ClockCircleOutlined />,
            color: '#f5576c',
            bgColor: '#f5576c15',
        },
        {
            title: 'Archived',
            value: properties.filter(p => p.status === 'archived').length,
            icon: <ClockCircleOutlined />,
            color: '#95a5a6',
            bgColor: '#95a5a615',
        },
    ];

    return (
        <div className="space-y-6">
            {/* Modern Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <Title level={2} className="mb-1" style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        Properties
                    </Title>
                    <Text type="secondary">Manage and track all your properties</Text>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setIsAddModalOpen(true)}
                    size="large"
                    style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        border: 'none',
                        borderRadius: '8px',
                        height: '44px',
                        padding: '0 24px',
                    }}
                >
                    Add Property
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
                                        {stat.prefix}{stat.value.toLocaleString()}
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
                            placeholder="Search properties by title or location..."
                            allowClear
                            size="large"
                            prefix={<SearchOutlined style={{ color: '#667eea' }} />}
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
                            <Select.Option value="approved">Approved</Select.Option>
                            <Select.Option value="pending">Pending</Select.Option>
                            <Select.Option value="rented">Rented</Select.Option>
                            <Select.Option value="rejected">Rejected</Select.Option>
                            <Select.Option value="archived">Archived</Select.Option>
                        </Select>
                    </Col>
                    <Col xs={12} md={6} lg={4}>
                        <Select
                            size="large"
                            value={typeFilter}
                            onChange={setTypeFilter}
                            style={{ width: '100%', borderRadius: '8px' }}
                            placeholder="Type"
                        >
                            <Select.Option value="all">All Types</Select.Option>
                            <Select.Option value="Apartment">Apartment</Select.Option>
                            <Select.Option value="House">House</Select.Option>
                            <Select.Option value="Commercial">Commercial</Select.Option>
                            <Select.Option value="Land">Land</Select.Option>
                            <Select.Option value="Other">Other</Select.Option>
                        </Select>
                    </Col>
                    <Col xs={24} md={24} lg={6}>
                        <div className="flex items-center justify-end gap-2">
                            <Text type="secondary" style={{ fontSize: '14px' }}>
                                Showing {filteredProperties.length} of {properties.length} properties
                            </Text>
                        </div>
                    </Col>
                </Row>
            </Card>

            {/* Properties Table */}
            <Card
                style={{
                    borderRadius: '12px',
                    border: '1px solid #f0f0f0',
                }}
            >
                <PropertiesTable
                    properties={filteredProperties}
                    loading={loading}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onApprove={handleApproveClick}
                    onReject={handleRejectClick}
                    approvingId={actionLoading}
                />
            </Card>

            {/* Add/Edit Property Modal */}
            <Modal
                title={
                    <div style={{ fontSize: '18px', fontWeight: 600 }}>
                        {editingProperty ? 'Edit Property' : 'Add New Property'}
                    </div>
                }
                open={isAddModalOpen}
                onCancel={() => {
                    setIsAddModalOpen(false);
                    setEditingProperty(null);
                }}
                footer={null}
                width={900}
                style={{ top: 20 }}
            >
                <PropertyForm
                    initialValues={editingProperty || undefined}
                    onSubmit={handleAddProperty}
                    onCancel={() => {
                        setIsAddModalOpen(false);
                        setEditingProperty(null);
                    }}
                    loading={submitting}
                />
            </Modal>

            {/* View Property Modal */}
            {selectedProperty && (
                <Modal
                    title={
                        <div style={{ fontSize: '18px', fontWeight: 600 }}>
                            Property Details
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
                        selectedProperty?.status === 'pending' && (
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
                        selectedProperty?.status === 'pending' && (
                            <Button
                                key="approve"
                                size="large"
                                type="primary"
                                onClick={handleApproveConfirm}
                                loading={actionLoading === selectedProperty?._id}
                                style={{
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
                        <Descriptions.Item label="Title" span={2}>
                            <Text strong>{selectedProperty.title}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Type">{selectedProperty.propertyType}</Descriptions.Item>
                        <Descriptions.Item label="Status">
                            <Tag color={
                                selectedProperty.status === 'approved' ? 'green' :
                                selectedProperty.status === 'rented' ? 'blue' :
                                selectedProperty.status === 'rejected' ? 'red' :
                                selectedProperty.status === 'archived' ? 'gray' : 'orange'
                            }>
                                {selectedProperty.status.charAt(0).toUpperCase() + selectedProperty.status.slice(1)}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Location" span={2}>{selectedProperty.location}</Descriptions.Item>
                        <Descriptions.Item label="Price">
                            <Text strong style={{ fontSize: '16px', color: '#52c41a' }}>
                                ${selectedProperty.price?.toLocaleString()}
                            </Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Furnished">
                            {selectedProperty.furnished ? 'Yes' : 'No'}
                        </Descriptions.Item>
                        {selectedProperty.area && (
                            <Descriptions.Item label="Area">{selectedProperty.area} sq ft</Descriptions.Item>
                        )}
                        {selectedProperty.maxGuests && (
                            <Descriptions.Item label="Max Guests">{selectedProperty.maxGuests}</Descriptions.Item>
                        )}
                        {selectedProperty.bedrooms !== undefined && (
                            <Descriptions.Item label="Bedrooms">{selectedProperty.bedrooms}</Descriptions.Item>
                        )}
                        {selectedProperty.bathrooms !== undefined && (
                            <Descriptions.Item label="Bathrooms">{selectedProperty.bathrooms}</Descriptions.Item>
                        )}
                        {selectedProperty.parkingSpaces !== undefined && selectedProperty.parkingSpaces > 0 && (
                            <Descriptions.Item label="Parking Spaces">{selectedProperty.parkingSpaces}</Descriptions.Item>
                        )}
                        <Descriptions.Item label="Description" span={2}>
                            {selectedProperty.description}
                        </Descriptions.Item>

                        {/* Amenities Section */}
                        <Descriptions.Item label="Amenities & Features" span={2}>
                            <Space wrap style={{ marginTop: '8px' }}>
                                {selectedProperty.wifi && <Tag color="blue">WiFi</Tag>}
                                {selectedProperty.airConditioning && <Tag color="cyan">Air Conditioning</Tag>}
                                {selectedProperty.heating && <Tag color="orange">Heating</Tag>}
                                {selectedProperty.kitchen && <Tag color="green">Kitchen</Tag>}
                                {selectedProperty.washer && <Tag color="purple">Washer</Tag>}
                                {selectedProperty.dryer && <Tag color="purple">Dryer</Tag>}
                                {selectedProperty.tv && <Tag color="blue">TV</Tag>}
                                {selectedProperty.workspace && <Tag color="geekblue">Workspace</Tag>}
                                {selectedProperty.parking && <Tag color="gold">Parking</Tag>}
                                {selectedProperty.pool && <Tag color="cyan">Swimming Pool</Tag>}
                                {selectedProperty.gym && <Tag color="red">Gym</Tag>}
                                {selectedProperty.elevator && <Tag color="blue">Elevator</Tag>}
                                {selectedProperty.balcony && <Tag color="green">Balcony</Tag>}
                                {selectedProperty.garden && <Tag color="green">Garden</Tag>}
                                {selectedProperty.securitySystem && <Tag color="red">Security System</Tag>}
                                {selectedProperty.petFriendly && <Tag color="magenta">Pet Friendly</Tag>}
                                {selectedProperty.smoking && <Tag color="orange">Smoking Allowed</Tag>}
                                {!selectedProperty.wifi && !selectedProperty.airConditioning && !selectedProperty.heating &&
                                 !selectedProperty.kitchen && !selectedProperty.washer && !selectedProperty.dryer &&
                                 !selectedProperty.tv && !selectedProperty.workspace && !selectedProperty.parking &&
                                 !selectedProperty.pool && !selectedProperty.gym && !selectedProperty.elevator &&
                                 !selectedProperty.balcony && !selectedProperty.garden && !selectedProperty.securitySystem &&
                                 !selectedProperty.petFriendly && !selectedProperty.smoking && (
                                    <Text type="secondary">No amenities specified</Text>
                                )}
                            </Space>
                        </Descriptions.Item>

                        {/* Images */}
                        {selectedProperty.images && selectedProperty.images.length > 0 ? (
                            <Descriptions.Item label="Images" span={2}>
                                <Image.PreviewGroup>
                                    <Space wrap style={{ marginTop: '8px' }}>
                                        {selectedProperty.images.map((img, idx) => (
                                            <Image
                                                key={idx}
                                                src={img}
                                                alt={`Property ${idx + 1}`}
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

            {/* Reject Property Modal */}
            <Modal
                title="Reject Property"
                open={isRejectModalOpen}
                onCancel={() => {
                    setIsRejectModalOpen(false);
                    setRejectionReason('');
                }}
                onOk={handleRejectSubmit}
                okText="Reject"
                okButtonProps={{ danger: true, loading: actionLoading === selectedProperty?._id }}
            >
                <div style={{ marginTop: '16px' }}>
                    <Text strong>Rejection Reason:</Text>
                    <Text type="secondary" style={{ display: 'block', marginTop: '4px', marginBottom: '8px' }}>
                        This reason will be sent to the property creator via email.
                    </Text>
                    <TextArea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Please provide a clear reason for rejecting this property..."
                        rows={4}
                        style={{ marginTop: '8px' }}
                    />
                </div>
            </Modal>
        </div>
    );
}
