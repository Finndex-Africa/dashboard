'use client';

import { useState, useEffect } from 'react';
import { Card, List, Badge, Empty, Spin } from 'antd';
import { notificationsApi } from '@/services/api/notifications.api';

export default function NotificationsList({ userId }: { userId: string }) {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                setLoading(true);
                const response = await notificationsApi.getAll({ userId, limit: 5 });
                const notificationsData = (response as any)?.data?.data || response.data || [];
                setNotifications(Array.isArray(notificationsData) ? notificationsData : []);
            } catch (error) {
                console.error('Error fetching notifications:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();
    }, [userId]);

    if (loading) {
        return (
            <Card bordered={false}>
                <Spin tip="Loading notifications..." />
            </Card>
        );
    }

    if (!notifications.length) {
        return (
            <Card bordered={false}>
                <Empty description="No notifications" />
            </Card>
        );
    }

    return (
        <Card bordered={false}>
            <List
                itemLayout="horizontal"
                dataSource={notifications}
                renderItem={(item: any) => (
                    <List.Item>
                        <List.Item.Meta
                            avatar={<Badge status={item.read ? 'default' : 'processing'} />}
                            title={item.title}
                            description={item.message}
                        />
                    </List.Item>
                )}
            />
        </Card>
    );
}
