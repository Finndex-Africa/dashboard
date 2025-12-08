'use client';

import { useState, useEffect } from 'react';
import { Card, Typography, Table, Tag, Empty, Spin, Row, Col, Statistic, message } from 'antd';
import {
    HomeOutlined,
    DollarOutlined,
    EyeOutlined,
    MessageOutlined,
    RiseOutlined,
    TeamOutlined,
    CheckCircleOutlined,
} from '@ant-design/icons';
import { propertiesApi } from '@/services/api/properties.api';
import { bookingsApi } from '@/services/api/bookings.api';

const { Title, Text } = Typography;

interface Property {
    _id: string;
    title: string;
    type: string;
    price: number;
    status: string;
    views?: number;
    inquiries?: number;
    ownerId?: { firstName: string; lastName: string };
}

interface Booking {
    _id: string;
    userId: {
        firstName: string;
        lastName: string;
    };
    propertyId: {
        title: string;
    };
    scheduledDate: string;
    status: string;
    totalPrice: number;
}

interface Stats {
    totalProperties: number;
    totalValue: number;
    totalViews: number;
    totalInquiries: number;
    activeListings: number;
    pendingApproval: number;
    totalSales: number;
    totalCommission: number;
    closedDeals: number;
}

export default function AgentDashboard() {
    const [properties, setProperties] = useState<Property[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [stats, setStats] = useState<Stats>({
        totalProperties: 0,
        totalValue: 0,
        totalViews: 0,
        totalInquiries: 0,
        activeListings: 0,
        pendingApproval: 0,
        totalSales: 0,
        totalCommission: 0,
        closedDeals: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // Fetch properties and bookings in parallel
            const [propertiesResponse, bookingsResponse] = await Promise.all([
                propertiesApi.getMyProperties(),
                bookingsApi.getAll({ limit: 10 })
            ]);

            const propertiesData = Array.isArray(propertiesResponse.data) ? propertiesResponse.data : [];
            const bookingsData = (bookingsResponse as any)?.data?.data || [];

            setProperties(propertiesData);
            setBookings(Array.isArray(bookingsData) ? bookingsData : []);

            // Calculate stats from properties
            const activeListings = propertiesData.filter((p: any) => p.status === 'active').length;
            const pendingApproval = propertiesData.filter((p: any) => p.status === 'pending').length;
            const totalValue = propertiesData.reduce((sum: number, p: any) => sum + (p.price || 0), 0);
            const totalViews = propertiesData.reduce((sum: number, p: any) => sum + (p.views || 0), 0);
            const totalInquiries = propertiesData.reduce((sum: number, p: any) => sum + (p.inquiries || 0), 0);

            // Calculate sales stats from bookings
            const closedDeals = bookingsData.filter((b: any) => b.status === 'completed').length;
            const totalSales = bookingsData.reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0);
            const totalCommission = totalSales * 0.05; // 5% commission

            setStats({
                totalProperties: propertiesData.length,
                totalValue,
                totalViews,
                totalInquiries,
                activeListings,
                pendingApproval,
                totalSales,
                totalCommission,
                closedDeals,
            });
        } catch (error: any) {
            console.error('Failed to fetch dashboard data:', error);
            message.error(error.response?.data?.message || 'Failed to load dashboard data');
            setProperties([]);
            setBookings([]);
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
            completed: 'blue',
            cancelled: 'red',
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
            render: (views?: number) => (
                <div className="flex items-center gap-1">
                    <EyeOutlined />
                    <span>{views || 0}</span>
                </div>
            ),
        },
        {
            title: 'Inquiries',
            dataIndex: 'inquiries',
            key: 'inquiries',
            render: (inquiries?: number) => (
                <div className="flex items-center gap-1">
                    <MessageOutlined />
                    <span>{inquiries || 0}</span>
                </div>
            ),
        },
    ];

    const bookingColumns = [
        {
            title: 'Buyer',
            dataIndex: ['userId', 'firstName'],
            key: 'buyer',
            render: (firstName: string, record: Booking) => (
                <div>
                    <Text strong>
                        {firstName} {record.userId?.lastName}
                    </Text>
                </div>
            ),
        },
        {
            title: 'Property',
            dataIndex: ['propertyId', 'title'],
            key: 'property',
            render: (text: string) => <Text>{text || 'N/A'}</Text>,
        },
        {
            title: 'Scheduled Date',
            dataIndex: 'scheduledDate',
            key: 'scheduledDate',
            render: (date: string) => new Date(date).toLocaleDateString(),
        },
        {
            title: 'Sale Price',
            dataIndex: 'totalPrice',
            key: 'totalPrice',
            render: (price: number) => `$${price.toLocaleString()}`,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => getStatusTag(status),
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
                <Title level={2}>Agent Dashboard</Title>
                <Text type="secondary">
                    Overview of your properties, sales, and performance
                </Text>
            </div>

            {/* Main Stats Cards */}
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
                            title="Total Value"
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
                            title="Total Sales"
                            value={stats.totalSales}
                            prefix={<DollarOutlined />}
                            precision={0}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false}>
                        <Statistic
                            title="Commission Earned"
                            value={stats.totalCommission}
                            prefix={<DollarOutlined />}
                            precision={2}
                            valueStyle={{ color: '#faad14' }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Secondary Stats */}
            <Row gutter={16}>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} className="bg-green-50">
                        <Statistic
                            title="Active Listings"
                            value={stats.activeListings}
                            valueStyle={{ color: '#3f8600' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} className="bg-orange-50">
                        <Statistic
                            title="Pending Approval"
                            value={stats.pendingApproval}
                            valueStyle={{ color: '#fa8c16' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} className="bg-blue-50">
                        <Statistic
                            title="Closed Deals"
                            value={stats.closedDeals}
                            prefix={<CheckCircleOutlined />}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} className="bg-purple-50">
                        <Statistic
                            title="Total Inquiries"
                            value={stats.totalInquiries}
                            prefix={<MessageOutlined />}
                            valueStyle={{ color: '#722ed1' }}
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

            {/* Sales & Inquiries Table */}
            <Card
                title={
                    <div className="flex items-center gap-2">
                        <TeamOutlined />
                        <span>Recent Sales & Inquiries</span>
                    </div>
                }
                bordered={false}
            >
                {bookings.length > 0 ? (
                    <Table
                        columns={bookingColumns}
                        dataSource={bookings}
                        rowKey="_id"
                        pagination={{ pageSize: 10 }}
                    />
                ) : (
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="No sales yet"
                    />
                )}
            </Card>
        </div>
    );
}
