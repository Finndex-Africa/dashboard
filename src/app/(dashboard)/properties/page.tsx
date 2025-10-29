'use client';

import { useState, useEffect } from 'react';
import Typography from 'antd/es/typography';
import Button from 'antd/es/button';
import message from 'antd/es/message';
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

const { Title, Text } = Typography;
const { Search } = Input;

export default function PropertiesPage() {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
    const [loading, setLoading] = useState(true);
    const [properties, setProperties] = useState<Property[]>([]);
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');

    useEffect(() => {
        fetchProperties();
    }, []);

    const fetchProperties = async () => {
        try {
            setLoading(true);
            const response = await propertiesApi.getAll({ page: 1, limit: 100 });
            if (response.data && 'data' in response.data) {
                setProperties(response.data.data || []);
            } else {
                setProperties(response.data as any || []);
            }
        } catch (error: any) {
            console.error('Failed to fetch properties:', error);
            if (error.response?.status !== 404) {
                message.error('Failed to load properties');
            }
            setProperties([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddProperty = async (values: any) => {
        try {
            await propertiesApi.create(values);
            message.success('Property added successfully');
            setIsAddModalOpen(false);
            fetchProperties();
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to add property');
        }
    };

    const handleView = (property: Property) => {
        setSelectedProperty(property);
        setIsViewModalOpen(true);
    };

    const handleDelete = async (property: Property) => {
        try {
            await propertiesApi.delete(property._id);
            message.success('Property deleted successfully');
            fetchProperties();
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to delete property');
        }
    };

    // Filter properties based on search and filters
    const filteredProperties = properties.filter(property => {
        const matchesSearch = property.title?.toLowerCase().includes(searchText.toLowerCase()) ||
                            property.location?.toLowerCase().includes(searchText.toLowerCase());
        const matchesStatus = statusFilter === 'all' || property.status === statusFilter;
        const matchesType = typeFilter === 'all' || property.type === typeFilter;
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
            title: 'Available',
            value: properties.filter(p => p.status === 'Available').length,
            icon: <CheckCircleOutlined />,
            color: '#43e97b',
            bgColor: '#43e97b15',
        },
        {
            title: 'Rented',
            value: properties.filter(p => p.status === 'Rented').length,
            icon: <ClockCircleOutlined />,
            color: '#ffa94d',
            bgColor: '#ffa94d15',
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
                            <Select.Option value="Available">Available</Select.Option>
                            <Select.Option value="Rented">Rented</Select.Option>
                            <Select.Option value="Sold">Sold</Select.Option>
                            <Select.Option value="Pending">Pending</Select.Option>
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
                    onDelete={handleDelete}
                />
            </Card>

            {/* Add Property Modal */}
            <Modal
                title={
                    <div style={{ fontSize: '18px', fontWeight: 600 }}>
                        Add New Property
                    </div>
                }
                open={isAddModalOpen}
                onCancel={() => setIsAddModalOpen(false)}
                footer={null}
                width={900}
                style={{ top: 20 }}
            >
                <PropertyForm
                    onSubmit={handleAddProperty}
                    onCancel={() => setIsAddModalOpen(false)}
                    loading={loading}
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
                        </Button>
                    ]}
                    width={800}
                >
                    <Descriptions bordered column={2} style={{ marginTop: '20px' }}>
                        <Descriptions.Item label="Title" span={2}>
                            <Text strong>{selectedProperty.title}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Type">{selectedProperty.type}</Descriptions.Item>
                        <Descriptions.Item label="Status">
                            <Tag color={
                                selectedProperty.status === 'Available' ? 'green' :
                                selectedProperty.status === 'Rented' ? 'blue' :
                                selectedProperty.status === 'Sold' ? 'red' : 'orange'
                            }>
                                {selectedProperty.status}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Location" span={2}>{selectedProperty.location}</Descriptions.Item>
                        <Descriptions.Item label="Price">
                            <Text strong style={{ fontSize: '16px', color: '#52c41a' }}>
                                ${selectedProperty.price?.toLocaleString()}
                            </Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Area">
                            {selectedProperty.area} sq ft
                        </Descriptions.Item>
                        {selectedProperty.bedrooms && (
                            <Descriptions.Item label="Bedrooms">{selectedProperty.bedrooms}</Descriptions.Item>
                        )}
                        {selectedProperty.bathrooms && (
                            <Descriptions.Item label="Bathrooms">{selectedProperty.bathrooms}</Descriptions.Item>
                        )}
                        <Descriptions.Item label="Description" span={2}>
                            {selectedProperty.description}
                        </Descriptions.Item>
                    </Descriptions>
                </Modal>
            )}
        </div>
    );
}
