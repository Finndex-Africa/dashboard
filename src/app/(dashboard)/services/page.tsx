'use client';

import { useState, useEffect } from 'react';
import Typography from 'antd/es/typography';
import Button from 'antd/es/button';
import message from 'antd/es/message';
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
import type { Service } from '@/types/dashboard';
import { servicesApi } from '@/services/api/services.api';

const { Title, Text } = Typography;
const { Search } = Input;

export default function ServicesPage() {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            setLoading(true);
            const response = await servicesApi.getAll({ page: 1, limit: 100 });
            if (response.data && 'data' in response.data) {
                setServices(response.data.data || []);
            } else {
                setServices(response.data as any || []);
            }
        } catch (error: any) {
            console.error('Failed to fetch services:', error);
            if (error.response?.status !== 404) {
                message.error('Failed to load services');
            }
            setServices([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (service: Service) => {
        try {
            await servicesApi.delete(service._id);
            message.success('Service deleted successfully');
            fetchServices();
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to delete service');
        }
    };

    // Filter services
    const filteredServices = services.filter(service => {
        const matchesSearch = service.name?.toLowerCase().includes(searchText.toLowerCase()) ||
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
            value: services.filter(s => s.status === 'Active').length,
            icon: <CheckCircleOutlined />,
            color: '#43e97b',
            bgColor: '#43e97b15',
        },
        {
            title: 'Pending',
            value: services.filter(s => s.status === 'Pending').length,
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
                            <Select.Option value="Active">Active</Select.Option>
                            <Select.Option value="Inactive">Inactive</Select.Option>
                            <Select.Option value="Pending">Pending</Select.Option>
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
                />
            </Card>
        </div>
    );
}
