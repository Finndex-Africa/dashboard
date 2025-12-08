'use client';

import { useState, useEffect } from 'react';
import { Card, Table, Tag, Empty, Spin } from 'antd';
import { bookingsApi } from '@/services/api/bookings.api';
import type { ColumnsType } from 'antd/es/table';

interface Booking {
    _id: string;
    serviceId: any;
    scheduledDate: string;
    status: string;
    totalPrice: number;
    duration: number;
}

interface RecentBookingsProps {
    userId: string;
    userRole: string;
}

export default function RecentBookings({ userId, userRole }: RecentBookingsProps) {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                setLoading(true);
                const response = await bookingsApi.getAll({
                    userId,
                    limit: 5,
                    sort: '-createdAt'
                });
                setBookings(response.data || []);
            } catch (error) {
                console.error('Error fetching bookings:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();
    }, [userId]);

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            pending: 'orange',
            confirmed: 'green',
            completed: 'blue',
            cancelled: 'red',
        };
        return colors[status] || 'default';
    };

    const columns: ColumnsType<Booking> = [
        {
            title: 'Property/Service',
            dataIndex: 'serviceId',
            key: 'service',
            render: (service: any) =>
                service && typeof service === 'object' ? service.title : 'N/A',
        },
        {
            title: 'Date',
            dataIndex: 'scheduledDate',
            key: 'date',
            render: (date: string) => new Date(date).toLocaleDateString(),
        },
        {
            title: 'Duration',
            dataIndex: 'duration',
            key: 'duration',
            render: (duration: number) => `${duration} ${duration > 1 ? 'months' : 'month'}`,
        },
        {
            title: 'Amount',
            dataIndex: 'totalPrice',
            key: 'price',
            render: (price: number) => `$${price?.toLocaleString() || 0}`,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <Tag color={getStatusColor(status)}>
                    {status?.toUpperCase()}
                </Tag>
            ),
        },
    ];

    if (loading) {
        return (
            <Card bordered={false}>
                <Spin tip="Loading bookings..." />
            </Card>
        );
    }

    if (!bookings.length) {
        return (
            <Card bordered={false}>
                <Empty description="No bookings found" />
            </Card>
        );
    }

    return (
        <Card bordered={false}>
            <Table
                columns={columns}
                dataSource={bookings}
                rowKey="_id"
                pagination={false}
                size="small"
            />
        </Card>
    );
}
