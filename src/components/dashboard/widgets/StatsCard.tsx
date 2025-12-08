'use client';

import { useState, useEffect } from 'react';
import { Card, Statistic, Spin } from 'antd';
import {
    HomeOutlined,
    CalendarOutlined,
    DollarOutlined,
    UserOutlined,
    ToolOutlined,
    HeartOutlined,
    MessageOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
} from '@ant-design/icons';
import { DASHBOARD_WIDGETS } from '@/config/dashboard-roles.config';
import { propertiesApi } from '@/services/api/properties.api';
import { bookingsApi } from '@/services/api/bookings.api';
import { servicesApi } from '@/services/api/services.api';
import { usersApi } from '@/services/api/users.api';

interface StatsCardProps {
    type: string;
    userRole: string;
    userId: string;
}

const STAT_CONFIG: Record<string, {
    title: string;
    icon: React.ReactNode;
    color: string;
    fetchData: (userId: string, userRole: string) => Promise<number>;
}> = {
    [DASHBOARD_WIDGETS.TOTAL_PROPERTIES]: {
        title: 'Total Properties',
        icon: <HomeOutlined />,
        color: '#1890ff',
        fetchData: async (userId, userRole) => {
            const response = await propertiesApi.getAll({ userId, limit: 1 });
            return response.pagination?.totalItems || 0;
        },
    },
    [DASHBOARD_WIDGETS.TOTAL_BOOKINGS]: {
        title: 'My Bookings',
        icon: <CalendarOutlined />,
        color: '#52c41a',
        fetchData: async (userId) => {
            const response = await bookingsApi.getAll({ userId, limit: 1 });
            return response.pagination?.totalItems || 0;
        },
    },
    [DASHBOARD_WIDGETS.TOTAL_REVENUE]: {
        title: 'Total Revenue',
        icon: <DollarOutlined />,
        color: '#faad14',
        fetchData: async (userId) => {
            const response = await bookingsApi.getAll({ userId, limit: 100 });
            const bookings = response.data || [];
            return bookings.reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0);
        },
    },
    [DASHBOARD_WIDGETS.TOTAL_INQUIRIES]: {
        title: 'Inquiries',
        icon: <MessageOutlined />,
        color: '#13c2c2',
        fetchData: async (userId) => {
            // This would fetch from messages/inquiries API
            return 0;
        },
    },
    [DASHBOARD_WIDGETS.TOTAL_SERVICES]: {
        title: 'My Services',
        icon: <ToolOutlined />,
        color: '#722ed1',
        fetchData: async (userId) => {
            const response = await servicesApi.getAll({ providerId: userId, limit: 1 });
            return response.pagination?.totalItems || 0;
        },
    },
    [DASHBOARD_WIDGETS.ACTIVE_LISTINGS]: {
        title: 'Active Listings',
        icon: <CheckCircleOutlined />,
        color: '#52c41a',
        fetchData: async (userId) => {
            const response = await propertiesApi.getAll({ userId, status: 'approved', limit: 1 });
            return response.pagination?.totalItems || 0;
        },
    },
    [DASHBOARD_WIDGETS.PENDING_APPROVALS]: {
        title: 'Pending Approvals',
        icon: <ClockCircleOutlined />,
        color: '#faad14',
        fetchData: async () => {
            const response = await propertiesApi.getAll({ status: 'pending', limit: 1 });
            return response.pagination?.totalItems || 0;
        },
    },
    [DASHBOARD_WIDGETS.TOTAL_USERS]: {
        title: 'Total Users',
        icon: <UserOutlined />,
        color: '#1890ff',
        fetchData: async () => {
            const response = await usersApi.getAll({ limit: 1 });
            return response.pagination?.totalItems || 0;
        },
    },
    [DASHBOARD_WIDGETS.SAVED_PROPERTIES]: {
        title: 'Saved Properties',
        icon: <HeartOutlined />,
        color: '#eb2f96',
        fetchData: async (userId) => {
            // This would fetch from bookmarks API
            return 0;
        },
    },
    [DASHBOARD_WIDGETS.UPCOMING_APPOINTMENTS]: {
        title: 'Upcoming',
        icon: <CalendarOutlined />,
        color: '#1890ff',
        fetchData: async (userId) => {
            const response = await bookingsApi.getAll({ userId, status: 'pending', limit: 1 });
            return response.pagination?.totalItems || 0;
        },
    },
};

export default function StatsCard({ type, userRole, userId }: StatsCardProps) {
    const [value, setValue] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    const config = STAT_CONFIG[type];

    useEffect(() => {
        if (!config) {
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                setLoading(true);
                const data = await config.fetchData(userId, userRole);
                setValue(data);
            } catch (error) {
                console.error(`Error fetching stat ${type}:`, error);
                setValue(0);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [type, userId, userRole, config]);

    if (!config) {
        return null;
    }

    return (
        <Card bordered={false} style={{ height: '100%' }}>
            <Spin spinning={loading}>
                <Statistic
                    title={config.title}
                    value={value}
                    prefix={config.icon}
                    valueStyle={{ color: config.color }}
                />
            </Spin>
        </Card>
    );
}
