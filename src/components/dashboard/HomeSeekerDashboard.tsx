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
    serviceId: {
        title: string;
        category: string;
    };
    scheduledDate: string;
    status: string;
    totalPrice: number;
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
            render: (text: string, record: Booking) => (
                <div>
                    <Text strong>
                        {text || <Text type="secondary" italic>Service not specified</Text>}
                    </Text>
                    <br />
                    <Text type="secondary" className="text-xs">
                        {record.serviceId && typeof record.serviceId === 'object' && record.serviceId.category
                            ? record.serviceId.category.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
                            : <Text type="secondary" italic className="text-xs">Category unknown</Text>
                        }
                    </Text>
                </div>
            ),
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
            title: 'Total Price',
            dataIndex: 'totalPrice',
            key: 'totalPrice',
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
        <div className="space-y-6">
            <div>
                <Title level={2}>Welcome Back!</Title>
                <Text type="secondary">
                    Here's an overview of your bookings and notifications
                </Text>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, index) => (
                    <Card key={index} className={stat.color} bordered={false}>
                        <div className="flex items-center justify-between">
                            <div>
                                <Text type="secondary" className="text-sm">
                                    {stat.title}
                                </Text>
                                <div className="text-3xl font-bold mt-2">
                                    {stat.value}
                                </div>
                            </div>
                            <div>{stat.icon}</div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* My Bookings */}
            <Card
                title={
                    <div className="flex items-center gap-2">
                        <CalendarOutlined />
                        <span>My Bookings</span>
                    </div>
                }
                bordered={false}
            >
                {bookings.length > 0 ? (
                    <Table
                        columns={bookingColumns}
                        dataSource={bookings}
                        rowKey="_id"
                        pagination={{ pageSize: 5 }}
                    />
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
                        <BellOutlined />
                        <span>Recent Notifications</span>
                    </div>
                }
                bordered={false}
            >
                {notifications.length > 0 ? (
                    <Table
                        columns={notificationColumns}
                        dataSource={notifications.slice(0, 5)}
                        rowKey="_id"
                        pagination={false}
                    />
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
