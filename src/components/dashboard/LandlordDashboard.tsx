'use client';

import { useState, useEffect } from 'react';
import { Card, Typography, Table, Tag, Empty, Spin, Row, Col, Statistic, message } from 'antd';
import {
    HomeOutlined,
    DollarOutlined,
    EyeOutlined,
    MessageOutlined,
    RiseOutlined,
} from '@ant-design/icons';
import { propertiesApi } from '@/services/api/properties.api';

const { Title, Text } = Typography;

interface Property {
    _id: string;
    title: string;
    type: string;
    price: number;
    status: string;
    views: number;
    inquiries: number;
}

interface Stats {
    totalProperties: number;
    totalValue: number;
    totalViews: number;
    totalInquiries: number;
    activeListings: number;
    pendingApproval: number;
}

export default function LandlordDashboard() {
    const [properties, setProperties] = useState<Property[]>([]);
    const [stats, setStats] = useState<Stats>({
        totalProperties: 0,
        totalValue: 0,
        totalViews: 0,
        totalInquiries: 0,
        activeListings: 0,
        pendingApproval: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // Fetch properties and stats in parallel
            const [propertiesResponse, statsResponse] = await Promise.all([
                propertiesApi.getMyProperties(),
                propertiesApi.getMyStats()
            ]);

            setProperties(propertiesResponse.data || []);
            setStats(statsResponse.data || {
                totalProperties: 0,
                totalValue: 0,
                totalViews: 0,
                totalInquiries: 0,
                activeListings: 0,
                pendingApproval: 0,
            });
        } catch (error: any) {
            console.error('Failed to fetch dashboard data:', error);
            message.error(error.response?.data?.message || 'Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const getStatusTag = (status: string) => {
        const statusColors: Record<string, string> = {
            active: 'green',
            pending: 'orange',
            rejected: 'red',
            draft: 'default',
        };

        return (
            <Tag color={statusColors[status] || 'default'}>
                {status.toUpperCase()}
            </Tag>
        );
    };

    const propertyColumns = [
        {
            title: 'Property',
            dataIndex: 'title',
            key: 'title',
            render: (text: string, record: Property) => (
                <div>
                    <Text strong>{text}</Text>
                    <br />
                    <Text type="secondary" className="text-xs">
                        {record.type}
                    </Text>
                </div>
            ),
        },
        {
            title: 'Price',
            dataIndex: 'price',
            key: 'price',
            render: (price: number) => `$${price.toLocaleString()}`,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => getStatusTag(status),
        },
        {
            title: 'Views',
            dataIndex: 'views',
            key: 'views',
            render: (views: number) => (
                <div className="flex items-center gap-1">
                    <EyeOutlined />
                    <span>{views}</span>
                </div>
            ),
        },
        {
            title: 'Inquiries',
            dataIndex: 'inquiries',
            key: 'inquiries',
            render: (inquiries: number) => (
                <div className="flex items-center gap-1">
                    <MessageOutlined />
                    <span>{inquiries}</span>
                </div>
            ),
        },
    ];

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <Title level={2}>Property Management Dashboard</Title>
                <Text type="secondary">
                    Overview of your property listings and performance
                </Text>
            </div>

            {/* Stats Cards */}
            <Row gutter={16}>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false}>
                        <Statistic
                            title="Total Properties"
                            value={stats.totalProperties}
                            prefix={<HomeOutlined />}
                            valueStyle={{ color: '#3f8600' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false}>
                        <Statistic
                            title="Portfolio Value"
                            value={stats.totalValue}
                            prefix={<DollarOutlined />}
                            precision={0}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false}>
                        <Statistic
                            title="Total Views"
                            value={stats.totalViews}
                            prefix={<EyeOutlined />}
                            suffix={<RiseOutlined style={{ color: '#52c41a' }} />}
                            valueStyle={{ color: '#722ed1' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false}>
                        <Statistic
                            title="Inquiries"
                            value={stats.totalInquiries}
                            prefix={<MessageOutlined />}
                            valueStyle={{ color: '#cf1322' }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Quick Stats */}
            <Row gutter={16}>
                <Col xs={24} md={12}>
                    <Card bordered={false} className="bg-green-50">
                        <Statistic
                            title="Active Listings"
                            value={stats.activeListings}
                            valueStyle={{ color: '#3f8600' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} md={12}>
                    <Card bordered={false} className="bg-orange-50">
                        <Statistic
                            title="Pending Approval"
                            value={stats.pendingApproval}
                            valueStyle={{ color: '#fa8c16' }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Properties Table */}
            <Card
                title={
                    <div className="flex items-center gap-2">
                        <HomeOutlined />
                        <span>My Properties</span>
                    </div>
                }
                bordered={false}
            >
                {properties.length > 0 ? (
                    <Table
                        columns={propertyColumns}
                        dataSource={properties}
                        rowKey="_id"
                        pagination={{ pageSize: 10 }}
                    />
                ) : (
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="No properties yet. Start by adding your first property!"
                    />
                )}
            </Card>
        </div>
    );
}
