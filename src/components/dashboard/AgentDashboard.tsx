"use client";

import { useState, useEffect } from 'react';
import { Card, Typography, Table, Tag, Empty, Spin, Row, Col, Statistic, message, Button } from 'antd';
import {
    HomeOutlined,
    DollarOutlined,
    EyeOutlined,
    MessageOutlined,
    RiseOutlined,
    CalendarOutlined,
} from '@ant-design/icons';
import { propertiesApi } from '@/services/api/properties.api';
import { bookingsApi } from '@/services/api/bookings.api';
import type { Booking } from '@/types/dashboard';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';

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

export default function AgentDashboard() {
    const { user } = useAuth();
    const router = useRouter();

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

    const [bookings, setBookings] = useState<Booking[]>([]);
    const [bookingsLoading, setBookingsLoading] = useState(false);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    // Fetch bookings whenever properties or user change (best-effort mapping)
    useEffect(() => {
        if (user) {
            fetchRecentBookings();
        }
    }, [properties, user]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // Fetch properties for this landlord
            const propertiesResponse = await propertiesApi.getMyProperties();
            const propertiesData = Array.isArray(propertiesResponse.data) ? propertiesResponse.data : [];

            setProperties(propertiesData);

            // Calculate stats from properties
            const activeListings = propertiesData.filter((p: any) => p.status === 'active').length;
            const pendingApproval = propertiesData.filter((p: any) => p.status === 'pending').length;
            const totalValue = propertiesData.reduce((sum: number, p: any) => sum + (p.price || 0), 0);
            const totalViews = propertiesData.reduce((sum: number, p: any) => sum + (p.views || 0), 0);
            const totalInquiries = propertiesData.reduce((sum: number, p: any) => sum + (p.inquiries || 0), 0);

            setStats({
                totalProperties: propertiesData.length,
                totalValue,
                totalViews,
                totalInquiries,
                activeListings,
                pendingApproval,
            });
        } catch (error: any) {
            console.error('Failed to fetch dashboard data:', error);
            if (error.response?.status !== 404) {
                message.error(error.response?.data?.message || 'Failed to load dashboard data');
            }
            setProperties([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchRecentBookings = async () => {
        try {
            setBookingsLoading(true);

            // Fetch recent bookings (first page)
            const response = await bookingsApi.getAll({ page: 1, limit: 100 });
            const bookingsData = (response as any)?.data?.data || response.data || [];

            // Filter bookings related to this landlord where possible
            const propertyIds = (properties || []).map(p => p._id);

            const myBookings = (Array.isArray(bookingsData) ? bookingsData : []).filter((b: any) => {
                // If booking references a service with a provider
                const service = b.serviceId;
                if (service && typeof service === 'object') {
                    if (service.provider && (service.provider === user?._id || service.provider._id === user?._id)) return true;
                }

                // If booking has a providerId
                if (b.providerId && (b.providerId === user?._id || b.providerId?._id === user?._id)) return true;

                // If booking references a property id (some booking shapes may include propertyId)
                if (b.propertyId && propertyIds.includes(b.propertyId)) return true;

                return false;
            });

            setBookings(Array.isArray(myBookings) ? myBookings.slice(0, 10) : []);
        } catch (error: any) {
            console.error('Failed to fetch recent bookings:', error);
            setBookings([]);
        } finally {
            setBookingsLoading(false);
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
                <Text type="secondary">Overview of your property listings and performance</Text>
            </div>

            {/* Stats Cards */}
            <Row gutter={16}>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false}>
                        <Statistic title="Total Properties" value={stats.totalProperties} prefix={<HomeOutlined />} valueStyle={{ color: '#3f8600' }} />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false}>
                        <Statistic title="Portfolio Value" value={stats.totalValue} prefix={<DollarOutlined />} precision={0} valueStyle={{ color: '#1890ff' }} />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false}>
                        <Statistic title="Total Views" value={stats.totalViews} prefix={<EyeOutlined />} suffix={<RiseOutlined style={{ color: '#52c41a' }} />} valueStyle={{ color: '#722ed1' }} />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false}>
                        <Statistic title="Inquiries" value={stats.totalInquiries} prefix={<MessageOutlined />} valueStyle={{ color: '#cf1322' }} />
                    </Card>
                </Col>
            </Row>

            {/* Quick Stats */}
            <Row gutter={16}>
                <Col xs={24} md={12}>
                    <Card bordered={false} className="bg-green-50">
                        <Statistic title="Active Listings" value={stats.activeListings} valueStyle={{ color: '#3f8600' }} />
                    </Card>
                </Col>
                <Col xs={24} md={12}>
                    <Card bordered={false} className="bg-orange-50">
                        <Statistic title="Pending Approval" value={stats.pendingApproval} valueStyle={{ color: '#fa8c16' }} />
                    </Card>
                </Col>
            </Row>

            {/* Properties Table */}
            <Card title={<div className="flex items-center gap-2"><HomeOutlined /><span>My Properties</span></div>} extra={<Button type="primary" onClick={() => router.push('/properties')}>Add Property</Button>} bordered={false}>
                {properties.length > 0 ? (
                    <Table columns={propertyColumns} dataSource={properties} rowKey="_id" pagination={{ pageSize: 10 }} />
                ) : (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No properties yet. Start by adding your first property!" />
                )}
            </Card>

            {/* Recent Bookings */}
            <Card title={<div className="flex items-center gap-2"><CalendarOutlined /><span>Recent Bookings</span></div>} bordered={false}>
                {bookingsLoading ? (
                    <div className="flex justify-center items-center h-40"><Spin /></div>
                ) : bookings.length > 0 ? (
                    <Table
                        dataSource={bookings}
                        rowKey={(r: any) => r._id}
                        pagination={{ pageSize: 5 }}
                        columns={[
                            {
                                title: 'Customer',
                                dataIndex: 'userId',
                                key: 'user',
                                render: (u: any) => (typeof u === 'object' ? u.name || u.email : (u || 'Guest')),
                            },
                            {
                                title: 'Service',
                                dataIndex: 'serviceId',
                                key: 'service',
                                render: (s: any) => (typeof s === 'object' ? s.title || s.name : (s || 'Service')),
                            },
                            {
                                title: 'Date',
                                dataIndex: 'scheduledDate',
                                key: 'date',
                                render: (d: string) => new Date(d).toLocaleString(),
                            },
                            {
                                title: 'Status',
                                dataIndex: 'status',
                                key: 'status',
                            },
                            {
                                title: 'Total',
                                dataIndex: 'totalPrice',
                                key: 'total',
                                render: (p: number) => `$${(p || 0).toLocaleString()}`,
                            },
                        ]}
                    />
                ) : (
                    <Empty description="No recent bookings for your properties" />
                )}
            </Card>
        </div>
    );
}
