'use client';

import { useState, useEffect } from 'react';
import {
    Card,
    Button,
    Table,
    Space,
    Tag,
    Modal,
    message,
    Popconfirm,
    Select,
    Typography,
    Row,
    Col,
    Statistic,
    Result,
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    EyeOutlined,
    PlayCircleOutlined,
    PauseCircleOutlined,
    BarChartOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { advertisementsApi, type Advertisement } from '@/services/api/advertisements.api';
import AdvertisementForm from '@/components/dashboard/AdvertisementForm';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';

const { Title, Text } = Typography;

export default function AdvertisementsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAdvertisement, setSelectedAdvertisement] = useState<Advertisement | null>(null);
    const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);
    const [filterPlacement, setFilterPlacement] = useState<string | undefined>(undefined);

    // Check if user is admin
    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        if (isAdmin) {
            fetchAdvertisements();
        }
    }, [filterStatus, filterPlacement, isAdmin]);

    const fetchAdvertisements = async () => {
        try {
            setLoading(true);
            const response = await advertisementsApi.getAll({
                status: filterStatus,
                placement: filterPlacement,
                limit: 100,
            });
            const advertisementsData = (response as any)?.data || [];
            setAdvertisements(advertisementsData);
        } catch (error: any) {
            console.error('Failed to fetch advertisements:', error);
            message.error('Failed to load advertisements');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setSelectedAdvertisement(null);
        setIsModalOpen(true);
    };

    const handleEdit = (record: Advertisement) => {
        setSelectedAdvertisement(record);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        try {
            await advertisementsApi.delete(id);
            message.success('Advertisement deleted successfully');
            fetchAdvertisements();
        } catch (error) {
            message.error('Failed to delete advertisement');
        }
    };

    const handleToggleStatus = async (record: Advertisement) => {
        try {
            const newStatus = record.status === 'active' ? 'paused' : 'active';
            await advertisementsApi.update(record._id, { status: newStatus });
            message.success(`Advertisement ${newStatus === 'active' ? 'activated' : 'paused'} successfully`);
            fetchAdvertisements();
        } catch (error) {
            message.error('Failed to update advertisement status');
        }
    };

    const handleFormSuccess = () => {
        setIsModalOpen(false);
        setSelectedAdvertisement(null);
        fetchAdvertisements();
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            active: 'success',
            paused: 'warning',
            ended: 'default',
        };
        return colors[status] || 'default';
    };

    const getPlacementColor = (placement: string) => {
        const colors: Record<string, string> = {
            home: 'blue',
            properties: 'purple',
            services: 'cyan',
            sidebar: 'geekblue',
            banner: 'magenta',
        };
        return colors[placement] || 'default';
    };

    const columns: ColumnsType<Advertisement> = [
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            render: (text, record) => (
                <div>
                    <Text strong>{text}</Text>
                    <br />
                    <Text type="secondary" className="text-xs">{record.description?.substring(0, 50)}...</Text>
                </div>
            ),
        },
        {
            title: 'Placement',
            dataIndex: 'placement',
            key: 'placement',
            render: (placement) => (
                <Tag color={getPlacementColor(placement)}>
                    {placement.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <Tag color={getStatusColor(status)}>
                    {status.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: 'Duration',
            key: 'duration',
            render: (_, record) => (
                <div>
                    <Text className="text-xs">
                        {new Date(record.startDate).toLocaleDateString()} - {new Date(record.endDate).toLocaleDateString()}
                    </Text>
                </div>
            ),
        },
        {
            title: 'Performance',
            key: 'performance',
            render: (_, record) => (
                <div>
                    <Text className="text-xs block">
                        <EyeOutlined /> {record.impressions || 0} views
                    </Text>
                    <Text className="text-xs block">
                        <BarChartOutlined /> {record.clicks || 0} clicks
                    </Text>
                </div>
            ),
        },
        {
            title: 'Budget',
            dataIndex: 'budget',
            key: 'budget',
            render: (budget) => budget ? `$${budget.toLocaleString()}` : '-',
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space size="small">
                    <Button
                        type="text"
                        icon={record.status === 'active' ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                        onClick={() => handleToggleStatus(record)}
                        title={record.status === 'active' ? 'Pause' : 'Activate'}
                    />
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                    />
                    <Popconfirm
                        title="Are you sure you want to delete this advertisement?"
                        onConfirm={() => handleDelete(record._id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const totalImpressions = advertisements.reduce((sum, ad) => sum + (ad.impressions || 0), 0);
    const totalClicks = advertisements.reduce((sum, ad) => sum + (ad.clicks || 0), 0);
    const totalBudget = advertisements.reduce((sum, ad) => sum + (ad.budget || 0), 0);
    const activeAds = advertisements.filter(ad => ad.status === 'active').length;

    // Show access denied for non-admin users
    if (!isAdmin) {
        return (
            <Result
                status="403"
                title="Access Denied"
                subTitle="Only administrators can access the advertisements management page."
                extra={
                    <Button type="primary" onClick={() => router.push('/dashboard')}>
                        Go to Dashboard
                    </Button>
                }
            />
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <Title level={2} className="mb-0">
                        Advertisements
                    </Title>
                    <Text type="secondary">Manage your advertising campaigns</Text>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleCreate}
                    size="large"
                >
                    Create Advertisement
                </Button>
            </div>

            {/* Statistics */}
            <Row gutter={[16, 16]}>
                <Col xs={12} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Active Campaigns"
                            value={activeAds}
                            prefix={<PlayCircleOutlined />}
                            valueStyle={{ color: '#3f8600' }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Total Impressions"
                            value={totalImpressions}
                            prefix={<EyeOutlined />}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Total Clicks"
                            value={totalClicks}
                            prefix={<BarChartOutlined />}
                            valueStyle={{ color: '#722ed1' }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Total Budget"
                            value={totalBudget}
                            prefix="$"
                            precision={2}
                            valueStyle={{ color: '#cf1322' }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Filters and Table */}
            <Card>
                <div className="mb-4 flex gap-4">
                    <Select
                        placeholder="Filter by Status"
                        style={{ width: 200 }}
                        allowClear
                        onChange={setFilterStatus}
                        value={filterStatus}
                    >
                        <Select.Option value="active">Active</Select.Option>
                        <Select.Option value="paused">Paused</Select.Option>
                        <Select.Option value="ended">Ended</Select.Option>
                    </Select>
                    <Select
                        placeholder="Filter by Placement"
                        style={{ width: 200 }}
                        allowClear
                        onChange={setFilterPlacement}
                        value={filterPlacement}
                    >
                        <Select.Option value="home">Home</Select.Option>
                        <Select.Option value="properties">Properties</Select.Option>
                        <Select.Option value="services">Services</Select.Option>
                        <Select.Option value="sidebar">Sidebar</Select.Option>
                        <Select.Option value="banner">Banner</Select.Option>
                    </Select>
                </div>

                <Table
                    columns={columns}
                    dataSource={advertisements}
                    loading={loading}
                    rowKey="_id"
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total} advertisements`,
                    }}
                />
            </Card>

            {/* Form Modal */}
            <Modal
                title={selectedAdvertisement ? 'Edit Advertisement' : 'Create Advertisement'}
                open={isModalOpen}
                onCancel={() => {
                    setIsModalOpen(false);
                    setSelectedAdvertisement(null);
                }}
                footer={null}
                width={800}
            >
                <AdvertisementForm
                    advertisement={selectedAdvertisement}
                    onSuccess={handleFormSuccess}
                    onCancel={() => {
                        setIsModalOpen(false);
                        setSelectedAdvertisement(null);
                    }}
                />
            </Modal>
        </div>
    );
}
