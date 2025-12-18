'use client';

import { useState, useEffect } from 'react';
import { Card, Typography, Table, Tag, Empty, Spin, message } from 'antd';
import {
    CalendarOutlined,
    BellOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined,
} from '@ant-design/icons';
import { bookingsApi } from '@/services/api/bookings.api';
import { notificationsApi } from '@/services/api/notifications.api';

const { Title, Text } = Typography;

interface Booking {
    _id: string;
    serviceId?: {
        title: string;
        category: string;
    } | null;
    scheduledDate: string;
    status: string;
    totalPrice: number;
    serviceAddress?: string;
    serviceLocation?: string;
}

interface Notification {
    _id: string;
    title: string;
    message: string;
    type: string;
    read: boolean;
    createdAt: string;
}

export default function HomeSeekerDashboard() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // Fetch bookings and notifications in parallel
            const [bookingsResponse, notificationsResponse] = await Promise.all([
                bookingsApi.getMyBookings({ limit: 10 }),
                notificationsApi.getAll({ limit: 5 })
            ]);

            // Handle paginated response structure
            const bookingsData = (bookingsResponse as any)?.data?.data || bookingsResponse.data || [];
            const notificationsData = (notificationsResponse as any)?.data?.data || notificationsResponse.data || [];

            setBookings(Array.isArray(bookingsData) ? bookingsData : []);
            setNotifications(Array.isArray(notificationsData) ? notificationsData : []);
        } catch (error: any) {
            console.error('Failed to fetch dashboard data:', error);
            message.error(error.response?.data?.message || 'Failed to load dashboard data');
            // Set empty arrays on error so UI doesn't break
            setBookings([]);
            setNotifications([]);
        } finally {
            setLoading(false);
        }
    };

    const getStatusTag = (status: string) => {
        const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
            pending: { color: 'orange', icon: <ClockCircleOutlined /> },
            confirmed: { color: 'blue', icon: <CheckCircleOutlined /> },
            completed: { color: 'green', icon: <CheckCircleOutlined /> },
            cancelled: { color: 'red', icon: <CloseCircleOutlined /> },
        };

        const config = statusConfig[status] || statusConfig.pending;
        return (
            <Tag color={config.color} icon={config.icon}>
                {status.toUpperCase()}
            </Tag>
        );
    };

    const bookingColumns = [
        {
            title: 'Service',
            dataIndex: ['serviceId', 'title'],
            key: 'service',
            ellipsis: true,
            render: (text: string, record: Booking) => {
                // Check if it's a property booking or service booking
                const isPropertyBooking = !record.serviceId && record.serviceAddress;

                if (isPropertyBooking) {
                    return (
                        <div className="min-w-0">
                            <Text strong className="block truncate">Property Viewing</Text>
                            <Text type="secondary" className="text-xs block truncate">
                                {record.serviceAddress || 'Location not specified'}
                            </Text>
                        </div>
                    );
                }

                return (
                    <div className="min-w-0">
                        <Text strong className="block truncate">
                            {text || <Text type="secondary" italic>Service not specified</Text>}
                        </Text>
                        <Text type="secondary" className="text-xs block truncate">
                            {record.serviceId && typeof record.serviceId === 'object' && record.serviceId.category
                                ? record.serviceId.category.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
                                : <Text type="secondary" italic className="text-xs">Category unknown</Text>
                            }
                        </Text>
                    </div>
                );
            },
        },
        {
            title: 'Scheduled Date',
            dataIndex: 'scheduledDate',
            key: 'scheduledDate',
            responsive: ['sm'] as any,
            render: (date: string) => new Date(date).toLocaleDateString(),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => getStatusTag(status),
        },
        {
            title: 'Total Price',
            dataIndex: 'totalPrice',
            key: 'totalPrice',
            responsive: ['md'] as any,
            render: (price: number) => `$${price.toFixed(2)}`,
        },
    ];

    const notificationColumns = [
        {
            title: 'Notification',
            dataIndex: 'title',
            key: 'title',
            render: (text: string, record: Notification) => (
                <div>
                    <Text strong={!record.read}>{text}</Text>
                    <br />
                    <Text type="secondary" className="text-sm">
                        {record.message}
                    </Text>
                </div>
            ),
        },
        {
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
            render: (type: string) => (
                <Tag color="blue">{type.toUpperCase()}</Tag>
            ),
        },
        {
            title: 'Date',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => new Date(date).toLocaleDateString(),
        },
    ];

    const stats = [
        {
            title: 'Active Bookings',
            value: bookings.filter(b => ['pending', 'confirmed'].includes(b.status)).length,
            icon: <CalendarOutlined className="text-2xl text-blue-500" />,
            color: 'bg-blue-50',
        },
        {
            title: 'Completed Bookings',
            value: bookings.filter(b => b.status === 'completed').length,
            icon: <CheckCircleOutlined className="text-2xl text-green-500" />,
            color: 'bg-green-50',
        },
        {
            title: 'Unread Notifications',
            value: notifications.filter(n => !n.read).length,
            icon: <BellOutlined className="text-2xl text-orange-500" />,
            color: 'bg-orange-50',
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
                <Title level={2} style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', margin: 0, marginBottom: '8px' }}>Welcome Back!</Title>
                <Text type="secondary" style={{ fontSize: 'clamp(12px, 2vw, 14px)' }}>
                    Here's an overview of your bookings and notifications
                </Text>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                {stats.map((stat, index) => (
                    <Card key={index} className={stat.color} bordered={false}>
                        <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                                <Text type="secondary" style={{ fontSize: 'clamp(11px, 2vw, 13px)', display: 'block' }}>
                                    {stat.title}
                                </Text>
                                <div className="font-bold mt-2" style={{ fontSize: 'clamp(24px, 5vw, 32px)' }}>
                                    {stat.value}
                                </div>
                            </div>
                            <div className="flex-shrink-0 ml-2">{stat.icon}</div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* My Bookings */}
            <Card
                title={
                    <div className="flex items-center gap-2">
                        <CalendarOutlined style={{ fontSize: 'clamp(14px, 3vw, 16px)' }} />
                        <span style={{ fontSize: 'clamp(14px, 3vw, 16px)' }}>My Bookings</span>
                    </div>
                }
            >
                {bookings.length > 0 ? (
                    <div className="overflow-x-auto -mx-4 sm:mx-0">
                        <Table
                            columns={bookingColumns}
                            dataSource={bookings}
                            rowKey="_id"
                            pagination={{
                                pageSize: 5,
                                simple: true,
                                responsive: true,
                            }}
                            scroll={{ x: 400 }}
                            size="small"
                            className="mobile-table"
                        />
                    </div>
                ) : (
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="No bookings yet"
                    />
                )}
            </Card>

            {/* Recent Notifications */}
            <Card
                title={
                    <div className="flex items-center gap-2">
                        <BellOutlined style={{ fontSize: 'clamp(14px, 3vw, 16px)' }} />
                        <span style={{ fontSize: 'clamp(14px, 3vw, 16px)' }}>Recent Notifications</span>
                    </div>
                }
            >
                {notifications.length > 0 ? (
                    <div className="overflow-x-auto -mx-4 sm:mx-0">
                        <Table
                            columns={notificationColumns}
                            dataSource={notifications.slice(0, 5)}
                            rowKey="_id"
                            pagination={false}
                            scroll={{ x: 300 }}
                            size="small"
                            className="mobile-table"
                        />
                    </div>
                ) : (
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="No notifications"
                    />
                )}
            </Card>
        </div>
    );
}
