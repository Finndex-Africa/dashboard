'use client';

import { useState, useEffect } from 'react';
import Card from 'antd/es/card';
import Row from 'antd/es/row';
import Col from 'antd/es/col';
import List from 'antd/es/list';
import Button from 'antd/es/button';
import Badge from 'antd/es/badge';
import Typography from 'antd/es/typography';
import message from 'antd/es/message';
import Modal from 'antd/es/modal';
import Empty from 'antd/es/empty';
import Select from 'antd/es/select';
import {
    BellOutlined,
    CheckCircleOutlined,
    InfoCircleOutlined,
    WarningOutlined,
    CloseCircleOutlined,
    DeleteOutlined,
    CheckOutlined,
} from '@ant-design/icons';
import { notificationsApi } from '@/services/api/notifications.api';
import type { Notification } from '@/types/dashboard';

const { Title, Text } = Typography;

export default function NotificationsPage() {
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await notificationsApi.getAll({ page: 1, limit: 100 });
            const notificationsData = response.data || [];
            setNotifications(Array.isArray(notificationsData) ? notificationsData : []);
        } catch (error: any) {
            console.error('Failed to fetch notifications:', error);
            if (error.response?.status !== 404) {
                message.error('Failed to load notifications');
            }
            setNotifications([]);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (notification: Notification) => {
        if (notification.read) return;

        try {
            await notificationsApi.markAsRead(notification._id);
            message.success('Notification marked as read');
            fetchNotifications();
        } catch (error: any) {
            console.error('Failed to mark notification as read:', error);
            message.error('Failed to mark notification as read');
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationsApi.markAllAsRead();
            message.success('All notifications marked as read');
            fetchNotifications();
        } catch (error: any) {
            console.error('Failed to mark all as read:', error);
            message.error('Failed to mark all notifications as read');
        }
    };

    const handleDelete = (notification: Notification) => {
        Modal.confirm({
            title: 'Delete Notification',
            content: 'Are you sure you want to delete this notification?',
            okText: 'Delete',
            okType: 'danger',
            onOk: async () => {
                try {
                    await notificationsApi.delete(notification._id);
                    message.success('Notification deleted successfully');
                    fetchNotifications();
                } catch (error: any) {
                    console.error('Failed to delete notification:', error);
                    message.error('Failed to delete notification');
                }
            },
        });
    };

    const handleView = (notification: Notification) => {
        setSelectedNotification(notification);
        setViewModalOpen(true);
        if (!notification.read) {
            handleMarkAsRead(notification);
        }
    };

    // Filter notifications
    const filteredNotifications = notifications.filter(notification => {
        const matchesType = typeFilter === 'all' || notification.type === typeFilter;
        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'read' && notification.read) ||
            (statusFilter === 'unread' && !notification.read);
        return matchesType && matchesStatus;
    });

    const totalNotifications = notifications.length;
    const unreadNotifications = notifications.filter(n => !n.read).length;
    const warningNotifications = notifications.filter(n => n.type === 'warning').length;
    const errorNotifications = notifications.filter(n => n.type === 'error').length;

    const stats = [
        {
            title: 'Total',
            value: totalNotifications,
            icon: <BellOutlined />,
            color: '#667eea',
            bgColor: '#667eea15',
        },
        {
            title: 'Unread',
            value: unreadNotifications,
            icon: <BellOutlined />,
            color: '#ffa94d',
            bgColor: '#ffa94d15',
        },
        {
            title: 'Warnings',
            value: warningNotifications,
            icon: <WarningOutlined />,
            color: '#faad14',
            bgColor: '#faad1415',
        },
        {
            title: 'Errors',
            value: errorNotifications,
            icon: <CloseCircleOutlined />,
            color: '#ff4d4f',
            bgColor: '#ff4d4f15',
        },
    ];

    const getNotificationIcon = (type: Notification['type']) => {
        switch (type) {
            case 'info':
                return <InfoCircleOutlined style={{ fontSize: 20, color: '#1890ff' }} />;
            case 'success':
                return <CheckCircleOutlined style={{ fontSize: 20, color: '#52c41a' }} />;
            case 'warning':
                return <WarningOutlined style={{ fontSize: 20, color: '#faad14' }} />;
            case 'error':
                return <CloseCircleOutlined style={{ fontSize: 20, color: '#ff4d4f' }} />;
            default:
                return <InfoCircleOutlined style={{ fontSize: 20, color: '#1890ff' }} />;
        }
    };

    const getNotificationColor = (type: Notification['type']) => {
        switch (type) {
            case 'info':
                return '#1890ff20';
            case 'success':
                return '#52c41a20';
            case 'warning':
                return '#faad1420';
            case 'error':
                return '#ff4d4f20';
            default:
                return '#1890ff20';
        }
    };

    return (
        <div className="space-y-6">
            {/* Modern Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <Title level={2} className="mb-1" style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        Notifications
                    </Title>
                    <Text type="secondary">View and manage your notifications</Text>
                </div>
                {unreadNotifications > 0 && (
                    <Button
                        type="primary"
                        icon={<CheckOutlined />}
                        size="large"
                        onClick={handleMarkAllAsRead}
                        style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            border: 'none',
                            borderRadius: '8px',
                            height: '44px',
                            padding: '0 24px',
                        }}
                    >
                        Mark All as Read
                    </Button>
                )}
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

            {/* Filters */}
            <Card
                style={{
                    borderRadius: '12px',
                    border: '1px solid #f0f0f0',
                }}
                styles={{ body: { padding: '20px' } }}
            >
                <Row gutter={[16, 16]}>
                    <Col xs={12} md={8} lg={6}>
                        <Select
                            size="large"
                            value={typeFilter}
                            onChange={setTypeFilter}
                            style={{ width: '100%', borderRadius: '8px' }}
                            placeholder="Type"
                        >
                            <Select.Option value="all">All Types</Select.Option>
                            <Select.Option value="info">Info</Select.Option>
                            <Select.Option value="success">Success</Select.Option>
                            <Select.Option value="warning">Warning</Select.Option>
                            <Select.Option value="error">Error</Select.Option>
                        </Select>
                    </Col>
                    <Col xs={12} md={8} lg={6}>
                        <Select
                            size="large"
                            value={statusFilter}
                            onChange={setStatusFilter}
                            style={{ width: '100%', borderRadius: '8px' }}
                            placeholder="Status"
                        >
                            <Select.Option value="all">All Status</Select.Option>
                            <Select.Option value="unread">Unread</Select.Option>
                            <Select.Option value="read">Read</Select.Option>
                        </Select>
                    </Col>
                    <Col xs={24} md={8} lg={12}>
                        <div className="flex items-center justify-end gap-2">
                            <Text type="secondary" style={{ fontSize: '14px' }}>
                                Showing {filteredNotifications.length} of {notifications.length}
                            </Text>
                        </div>
                    </Col>
                </Row>
            </Card>

            {/* Notifications List */}
            <Card
                style={{
                    borderRadius: '12px',
                    border: '1px solid #f0f0f0',
                }}
            >
                <List
                    loading={loading}
                    dataSource={filteredNotifications}
                    locale={{
                        emptyText: (
                            <Empty
                                description="No notifications yet"
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                            />
                        ),
                    }}
                    renderItem={(notification) => (
                        <List.Item
                            key={notification._id}
                            className={`cursor-pointer transition-colors`}
                            onClick={() => handleView(notification)}
                            actions={[
                                !notification.read && (
                                    <Button
                                        type="text"
                                        icon={<CheckOutlined />}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleMarkAsRead(notification);
                                        }}
                                    >
                                        Mark Read
                                    </Button>
                                ),
                                <Button
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(notification);
                                    }}
                                >
                                    Delete
                                </Button>,
                            ].filter(Boolean)}
                        >
                            <List.Item.Meta
                                avatar={
                                    <div
                                        className="w-10 h-10 rounded-full flex items-center justify-center"
                                        style={{ backgroundColor: getNotificationColor(notification.type) }}
                                    >
                                        {getNotificationIcon(notification.type)}
                                    </div>
                                }
                                title={
                                    <div className="flex items-center gap-2">
                                        <span className={!notification.read ? 'font-bold' : ''}>
                                            {notification.title}
                                        </span>
                                        {!notification.read && <Badge status="processing" />}
                                    </div>
                                }
                                description={
                                    <div className="space-y-1">
                                        <p className="text-sm text-gray-600 line-clamp-2">
                                            {notification.message}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {new Date(notification.createdAt).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>
                                    </div>
                                }
                            />
                        </List.Item>
                    )}
                    pagination={{
                        pageSize: 10,
                        showTotal: (total) => `Total ${total} notifications`,
                        showSizeChanger: true,
                    }}
                />
            </Card>

            {/* View Modal */}
            <Modal
                title={
                    <div className="flex items-center gap-2" style={{ fontSize: '18px', fontWeight: 600 }}>
                        {selectedNotification && getNotificationIcon(selectedNotification.type)}
                        <span>Notification Details</span>
                    </div>
                }
                open={viewModalOpen}
                onCancel={() => setViewModalOpen(false)}
                footer={[
                    <Button key="close" size="large" onClick={() => setViewModalOpen(false)} style={{ borderRadius: '8px' }}>
                        Close
                    </Button>,
                ]}
                width={600}
            >
                {selectedNotification && (
                    <div className="space-y-4" style={{ marginTop: '20px' }}>
                        <div>
                            <Text type="secondary">Title</Text>
                            <div className="font-medium text-lg">{selectedNotification.title}</div>
                        </div>
                        <div>
                            <Text type="secondary">Message</Text>
                            <div className="font-medium">{selectedNotification.message}</div>
                        </div>
                        <div>
                            <Text type="secondary">Type</Text>
                            <div className="flex items-center gap-2 mt-1">
                                {getNotificationIcon(selectedNotification.type)}
                                <span className="capitalize">{selectedNotification.type}</span>
                            </div>
                        </div>
                        <div>
                            <Text type="secondary">Status</Text>
                            <div className="mt-1">
                                {selectedNotification.read ? (
                                    <Badge status="default" text="Read" />
                                ) : (
                                    <Badge status="processing" text="Unread" />
                                )}
                            </div>
                        </div>
                        <div>
                            <Text type="secondary">Created</Text>
                            <div className="font-medium">
                                {new Date(selectedNotification.createdAt).toLocaleDateString('en-US', {
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </div>
                        </div>
                        {selectedNotification.link && (
                            <div>
                                <Text type="secondary">Link</Text>
                                <div className="font-medium">
                                    <a
                                        href={selectedNotification.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-500 hover:underline"
                                    >
                                        {selectedNotification.link}
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}
