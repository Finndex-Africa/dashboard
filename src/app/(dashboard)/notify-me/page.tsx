'use client';

import { useState, useEffect, useCallback } from 'react';
import Card from 'antd/es/card';
import Table from 'antd/es/table';
import Tag from 'antd/es/tag';
import Typography from 'antd/es/typography';
import Row from 'antd/es/row';
import Col from 'antd/es/col';
import Statistic from 'antd/es/statistic';
import message from 'antd/es/message';
import Select from 'antd/es/select';
import Tooltip from 'antd/es/tooltip';
import { UserOutlined, TeamOutlined, BellOutlined } from '@ant-design/icons';
import {
    notifyMeApi,
    type NotifyMeEntry,
    type NotifyMePagination,
} from '@/services/api/notify-me.api';
import { useAuth } from '@/providers/AuthProvider';

const { Title, Text } = Typography;

const PAGE_SIZE = 20;

export default function NotifyMePage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [entries, setEntries] = useState<NotifyMeEntry[]>([]);
    const [isUserFilter, setIsUserFilter] = useState<string>('all');
    const [pagination, setPagination] = useState<{
        current: number;
        pageSize: number;
        total: number;
    }>({ current: 1, pageSize: PAGE_SIZE, total: 0 });
    const [stats, setStats] = useState({ total: 0, registered: 0, guests: 0 });

    const isAdmin = user?.role === 'admin';

    const fetchData = useCallback(
        async (page = 1) => {
            setLoading(true);
            try {
                const filters: { isUser?: boolean; page: number; limit: number } = {
                    page,
                    limit: PAGE_SIZE,
                };
                if (isUserFilter === 'true') filters.isUser = true;
                if (isUserFilter === 'false') filters.isUser = false;

                const result = await notifyMeApi.getAll(filters);
                setEntries(result.data);

                const pag = result.pagination as NotifyMePagination | undefined;
                setPagination({
                    current: pag?.page ?? page,
                    pageSize: pag?.limit ?? PAGE_SIZE,
                    total: pag?.total ?? result.data.length,
                });
            } catch {
                message.error('Failed to load notify-me registrations');
            } finally {
                setLoading(false);
            }
        },
        [isUserFilter],
    );

    const fetchStats = useCallback(async () => {
        try {
            const [all, registered, guests] = await Promise.all([
                notifyMeApi.getAll({ page: 1, limit: 1 }),
                notifyMeApi.getAll({ isUser: true, page: 1, limit: 1 }),
                notifyMeApi.getAll({ isUser: false, page: 1, limit: 1 }),
            ]);
            setStats({
                total: all.pagination?.total ?? 0,
                registered: registered.pagination?.total ?? 0,
                guests: guests.pagination?.total ?? 0,
            });
        } catch {
            // Non-blocking
        }
    }, []);

    useEffect(() => {
        if (isAdmin) {
            fetchData(1);
            fetchStats();
        }
    }, [isAdmin, fetchData, fetchStats]);

    const columns = [
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            render: (email: string) => (
                <span className="font-medium">{email}</span>
            ),
        },
        {
            title: 'Username',
            dataIndex: 'username',
            key: 'username',
            render: (val: string | undefined) => val || <Text type="secondary">—</Text>,
        },
        {
            title: 'Phone Number',
            dataIndex: 'phoneNumber',
            key: 'phoneNumber',
            render: (val: string | undefined) => val || <Text type="secondary">—</Text>,
        },
        {
            title: 'User Type',
            dataIndex: 'isUser',
            key: 'isUser',
            render: (isUser: boolean) =>
                isUser ? (
                    <Tag color="blue" icon={<UserOutlined />}>
                        Registered
                    </Tag>
                ) : (
                    <Tag color="default" icon={<TeamOutlined />}>
                        Guest
                    </Tag>
                ),
        },
        {
            title: 'Registered At',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (d: string) => (
                <Tooltip title={new Date(d).toLocaleString()}>
                    {new Date(d).toLocaleDateString()}
                </Tooltip>
            ),
        },
    ];

    if (!isAdmin) {
        return (
            <Card>
                <Title level={4}>Access Denied</Title>
                <Text type="secondary">You do not have permission to view this page.</Text>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <Title
                    level={2}
                    style={{
                        background: 'linear-gradient(135deg, #0000FF 0%, #0000CC 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}
                >
                    Notify Me
                </Title>
                <Text type="secondary">
                    Users and guests who want to be notified about the upcoming buy &amp; sell feature
                </Text>
            </div>

            <Row gutter={[16, 16]}>
                {[
                    {
                        title: 'Total Registrations',
                        value: stats.total,
                        color: '#0000FF',
                        icon: <BellOutlined />,
                    },
                    {
                        title: 'Registered Users',
                        value: stats.registered,
                        color: '#1890ff',
                        icon: <UserOutlined />,
                    },
                    {
                        title: 'Guests',
                        value: stats.guests,
                        color: '#52c41a',
                        icon: <TeamOutlined />,
                    },
                ].map((s) => (
                    <Col xs={12} lg={8} key={s.title}>
                        <Card style={{ borderRadius: 12 }} styles={{ body: { padding: 20 } }}>
                            <Statistic
                                title={s.title}
                                value={s.value}
                                valueStyle={{ color: s.color, fontWeight: 700 }}
                                prefix={s.icon}
                            />
                        </Card>
                    </Col>
                ))}
            </Row>

            <Card style={{ borderRadius: 12 }}>
                <div className="flex flex-wrap items-center gap-4 mb-4">
                    <Select
                        value={isUserFilter}
                        onChange={(val) => setIsUserFilter(val)}
                        style={{ width: 180 }}
                        options={[
                            { label: 'All Users', value: 'all' },
                            { label: 'Registered Users', value: 'true' },
                            { label: 'Guests', value: 'false' },
                        ]}
                    />
                </div>
                <Table
                    loading={loading}
                    dataSource={entries}
                    columns={columns}
                    rowKey="_id"
                    pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        total: pagination.total,
                        showSizeChanger: false,
                        showTotal: (total) => `${total} total registrations`,
                        onChange: (page) => fetchData(page),
                    }}
                    locale={{ emptyText: 'No registrations yet' }}
                />
            </Card>
        </div>
    );
}
