'use client';

import { useState, useEffect } from 'react';
import { Card, Typography, Table, Tag, Empty, Spin, Row, Col, Statistic, message, Button } from 'antd';
import {
    ShopOutlined,
    CalendarOutlined,
    DollarOutlined,
    StarOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    EyeOutlined,
    RiseOutlined,
} from '@ant-design/icons';
import { servicesApi } from '@/services/api/services.api';
import { bookingsApi } from '@/services/api/bookings.api';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import type { Service } from '@/types/dashboard';

const { Title, Text } = Typography;

interface Booking {
    _id: string;
    serviceId: {
        title: string;
    };
    clientId: {
        firstName: string;
        lastName: string;
    };
    scheduledDate: string;
    status: string;
    totalPrice: number;
}

interface Stats {
    totalServices: number;
    activeServices: number;
    totalBookings: number;
    pendingBookings: number;
    completedBookings: number;
    totalRevenue: number;
    averageRating: number;
}

export default function ServiceProviderDashboard() {
    const { user } = useAuth();
    const router = useRouter();
    const [services, setServices] = useState<Service[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [stats, setStats] = useState<Stats>({
        totalServices: 0,
        activeServices: 0,
        totalBookings: 0,
        pendingBookings: 0,
        completedBookings: 0,
        totalRevenue: 0,
        averageRating: 0,
    });
    const [loading, setLoading] = useState(true);
    const [bookingsLoading, setBookingsLoading] = useState(false);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // Fetch services and bookings in parallel
            const [servicesResponse, bookingsResponse] = await Promise.all([
                servicesApi.getMyServices(),
                bookingsApi.getProviderBookings({ limit: 10 })
            ]);

            const servicesData = Array.isArray(servicesResponse.data) ? servicesResponse.data : [];
            const bookingsData = (bookingsResponse as any)?.data?.data || [];

            setServices(servicesData);
            setBookings(Array.isArray(bookingsData) ? bookingsData : []);

            // Calculate stats from fetched data
            const activeServices = servicesData.filter((s: any) => s.status === 'active').length;
            const completedBookings = bookingsData.filter((b: any) => b.status === 'completed').length;
            const pendingBookings = bookingsData.filter((b: any) => b.status === 'pending').length;
            const totalRevenue = bookingsData.reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0);

            setStats({
                totalServices: servicesData.length,
                activeServices,
                totalBookings: bookingsData.length,
                pendingBookings,
                completedBookings,
                totalRevenue,
                averageRating: 4.5,
            });
        } catch (error: any) {
            console.error('Failed to fetch dashboard data:', error);
            if (error.response?.status !== 404) {
                message.error(error.response?.data?.message || 'Failed to load dashboard data');
            }
            setServices([]);
            setBookings([]);
        } finally {
            setLoading(false);
        }
    };

    const getStatusTag = (status: string) => {
        const statusColors: Record<string, string> = {
            active: 'green',
            pending: 'orange',
            confirmed: 'blue',
            completed: 'green',
            cancelled: 'red',
            inactive: 'default',
        };

        return (
            <Tag color={statusColors[status] || 'default'}>
                {status.toUpperCase()}
            </Tag>
        );
    };

    const serviceColumns = [
        {
            title: 'Service',
            dataIndex: 'title',
            key: 'title',
            render: (text: string, record: Service) => (
                <div>
                    <Text strong>{text}</Text>
                    <br />
                    <Text type="secondary" className="text-xs">
                        {record.category}
                    </Text>
                </div>
            ),
        },
        {
            title: 'Price',
            dataIndex: 'price',
            key: 'price',
            render: (price: number) => `$${price.toFixed(2)}`,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => getStatusTag(status),
        },
        {
            title: 'Bookings',
            dataIndex: 'bookings',
            key: 'bookings',
        },
        {
            title: 'Rating',
            dataIndex: 'rating',
            key: 'rating',
            render: (rating: number) => (
                <div className="flex items-center gap-1">
                    <StarOutlined className="text-yellow-500" />
                    <span>{rating.toFixed(1)}</span>
                </div>
            ),
        },
    ];

    const bookingColumns = [
        {
            title: 'Service',
            dataIndex: ['serviceId', 'title'],
            key: 'service',
        },
        {
            title: 'Client',
            dataIndex: 'clientId',
            key: 'client',
            render: (client: { firstName: string; lastName: string }) =>
                `${client.firstName} ${client.lastName}`,
        },
        {
            title: 'Scheduled Date',
            dataIndex: 'scheduledDate',
            key: 'scheduledDate',
            render: (date: string) => new Date(date).toLocaleDateString(),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => getStatusTag(status),
        },
        {
            title: 'Amount',
            dataIndex: 'totalPrice',
            key: 'totalPrice',
            render: (price: number) => `$${price.toFixed(2)}`,
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
        <div className="space-y-6 p-2 sm:p-4">
            <div>
                <Title level={2} style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', margin: 0, marginBottom: '8px' }}>Service Provider Dashboard</Title>
                <Text type="secondary" style={{ fontSize: 'clamp(12px, 2vw, 14px)' }}>Overview of your services and bookings performance</Text>
            </div>

            {/* Stats Cards */}
            <Row gutter={[12, 12]}>
                <Col xs={24} sm={12} md={12} lg={6}>
                    <Card>
                        <Statistic title="Total Services" value={stats.totalServices} prefix={<ShopOutlined />} valueStyle={{ color: '#3f8600', fontSize: 'clamp(20px, 4vw, 24px)' }} />
                        <Text type="secondary" style={{ fontSize: 'clamp(10px, 2vw, 12px)' }}>{stats.activeServices} active</Text>
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={12} lg={6}>
                    <Card>
                        <Statistic title="Total Revenue" value={stats.totalRevenue} prefix={<DollarOutlined />} precision={2} valueStyle={{ color: '#1890ff', fontSize: 'clamp(20px, 4vw, 24px)' }} />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={12} lg={6}>
                    <Card>
                        <Statistic title="Total Bookings" value={stats.totalBookings} prefix={<CalendarOutlined />} suffix={<RiseOutlined style={{ color: '#52c41a' }} />} valueStyle={{ color: '#722ed1', fontSize: 'clamp(20px, 4vw, 24px)' }} />
                        <Text type="secondary" style={{ fontSize: 'clamp(10px, 2vw, 12px)' }}>{stats.pendingBookings} pending</Text>
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={12} lg={6}>
                    <Card>
                        <Statistic title="Average Rating" value={stats.averageRating} prefix={<StarOutlined />} precision={1} valueStyle={{ color: '#faad14', fontSize: 'clamp(20px, 4vw, 24px)' }} />
                    </Card>
                </Col>
            </Row>

            {/* Quick Stats */}
            <Row gutter={[12, 12]}>
                <Col xs={24} md={12}>
                    <Card className="bg-blue-50">
                        <Statistic title="Pending Bookings" value={stats.pendingBookings} valueStyle={{ color: '#1890ff', fontSize: 'clamp(20px, 4vw, 24px)' }} />
                    </Card>
                </Col>
                <Col xs={24} md={12}>
                    <Card className="bg-green-50">
                        <Statistic title="Completed Bookings" value={stats.completedBookings} valueStyle={{ color: '#52c41a', fontSize: 'clamp(20px, 4vw, 24px)' }} />
                    </Card>
                </Col>
            </Row>

            {/* Services Table */}
            <Card title={<div className="flex items-center gap-2"><ShopOutlined style={{ fontSize: 'clamp(14px, 3vw, 16px)' }} /><span style={{ fontSize: 'clamp(14px, 3vw, 16px)' }}>My Services</span></div>} extra={<Button type="primary" onClick={() => router.push('/services')} size="small">Add Service</Button>}>
                {services.length > 0 ? (
                    <div className="overflow-x-auto">
                        <Table columns={serviceColumns} dataSource={services} rowKey="_id" pagination={{ pageSize: 10 }} scroll={{ x: 'max-content' }} />
                    </div>
                ) : (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No services yet. Start by adding your first service!" />
                )}
            </Card>

            {/* Recent Bookings */}
            <Card title={<div className="flex items-center gap-2"><CalendarOutlined style={{ fontSize: 'clamp(14px, 3vw, 16px)' }} /><span style={{ fontSize: 'clamp(14px, 3vw, 16px)' }}>Recent Bookings</span></div>}>
                {bookingsLoading ? (
                    <div className="flex justify-center items-center h-40"><Spin /></div>
                ) : bookings.length > 0 ? (
                    <div className="overflow-x-auto">
                        <Table
                            dataSource={bookings}
                            rowKey="_id"
                            pagination={{ pageSize: 5 }}
                            scroll={{ x: 'max-content' }}
                            columns={[
                                {
                                    title: 'Service',
                                    dataIndex: ['serviceId', 'title'],
                                    key: 'service',
                                    render: (title: string) => title || <Text type="secondary" italic>Service not specified</Text>,
                                },
                                {
                                    title: 'Client',
                                    dataIndex: 'clientId',
                                    key: 'client',
                                    render: (client: any) => {
                                        if (typeof client === 'object' && client !== null) {
                                            return `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.email || 'Unknown';
                                        }
                                        return 'Unknown';
                                    },
                                },
                                {
                                    title: 'Date',
                                    dataIndex: 'scheduledDate',
                                    key: 'scheduledDate',
                                    render: (date: string) => new Date(date).toLocaleString(),
                                },
                                {
                                    title: 'Status',
                                    dataIndex: 'status',
                                    key: 'status',
                                    render: (status: string) => getStatusTag(status),
                                },
                                {
                                    title: 'Total',
                                    dataIndex: 'totalPrice',
                                    key: 'total',
                                    render: (p: number) => `$${(p || 0).toLocaleString()}`,
                                },
                            ]}
                        />
                    </div>
                ) : (
                    <Empty description="No recent bookings" />
                )}
            </Card>
        </div>
    );
}
