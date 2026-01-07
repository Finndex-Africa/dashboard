'use client';

import Table from 'antd/es/table';
import Tag from 'antd/es/tag';
import Button from 'antd/es/button';
import Space from 'antd/es/space';
import Tooltip from 'antd/es/tooltip';
import Rate from 'antd/es/rate';
import { EyeOutlined, EditOutlined, DeleteOutlined, DownloadOutlined, CheckOutlined, CloseOutlined, HeartOutlined, HeartFilled, EyeInvisibleOutlined } from '@ant-design/icons';
import type { Service } from '@/types/dashboard';
import type { ColumnsType } from 'antd/es/table';

interface ServicesTableProps {
    services: Service[];
    loading?: boolean;
    onView?: (service: Service) => void;
    onEdit?: (service: Service) => void;
    onDelete?: (service: Service) => void;
    onVerify?: (service: Service) => void;
    onReject?: (service: Service) => void;
    onUnpublish?: (service: Service) => void;
    onRepublish?: (service: Service) => void;
    onSaveToggle?: (serviceId: string) => void;
    savedIds?: string[];
    approvingId?: string | null;
}

export function ServicesTable({
    services,
    loading,
    onView,
    onEdit,
    onDelete,
    onVerify,
    onReject,
    onUnpublish,
    onRepublish,
    onSaveToggle,
    savedIds = [],
    approvingId,
}: ServicesTableProps) {
    const getStatusColor = (status: Service['status']) => {
        switch (status) {
            case 'active':
                return 'green';
            case 'inactive':
                return 'red';
            case 'pending':
                return 'orange';
            case 'rejected':
                return 'volcano';
            case 'suspended':
                return 'orange';
            default:
                return 'default';
        }
    };

    const getStatusLabel = (status: Service['status']) => {
        return status.charAt(0).toUpperCase() + status.slice(1);
    };

    const columns: ColumnsType<Service> = [
        {
            title: 'Service',
            dataIndex: 'title',
            key: 'title',
            render: (title, record) => (
                <div>
                    <div className="font-medium text-gray-900">{title}</div>
                    <div className="text-sm text-gray-500">{record.category}</div>
                </div>
            ),
        },
        {
            title: 'Provider',
            dataIndex: 'provider',
            key: 'provider',
        },
        {
            title: 'Price',
            dataIndex: 'price',
            key: 'price',
            sorter: (a, b) => (a.price ?? 0) - (b.price ?? 0),
            render: (price) => price ? `$${price.toLocaleString()}` : '-',
        },
        {
            title: 'Rating',
            dataIndex: 'rating',
            key: 'rating',
            render: (rating) => rating ? <Rate disabled value={rating} style={{ fontSize: 14 }} /> : 'N/A',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            filters: [
                { text: 'Active', value: 'active' },
                { text: 'Inactive', value: 'inactive' },
                { text: 'Pending', value: 'pending' },
                { text: 'Rejected', value: 'rejected' },
                { text: 'Suspended', value: 'suspended' },
            ],
            onFilter: (value, record) => record.status === value,
            render: (status: Service['status']) => (
                <Tag color={getStatusColor(status)}>{getStatusLabel(status)}</Tag>
            ),
        },
        {
            title: 'Date Added',
            dataIndex: 'createdAt',
            key: 'createdAt',
            sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
            render: (date) => new Date(date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            }),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space size="small">
                    {/* Home Seeker: Save/Unsave */}
                    {onSaveToggle && (
                        <Tooltip title={savedIds.includes(record._id) ? 'Unsave' : 'Save'}>
                            <Button
                                type="text"
                                icon={savedIds.includes(record._id) ? <HeartFilled /> : <HeartOutlined />}
                                onClick={() => onSaveToggle(record._id)}
                                style={{ color: savedIds.includes(record._id) ? '#ff4d4f' : undefined }}
                            />
                        </Tooltip>
                    )}

                    {/* Admin: Verify/Reject pending services */}
                    {record.verificationStatus === 'pending' && onVerify && onReject ? (
                        <>
                            <Tooltip title="Verify">
                                <Button
                                    type="primary"
                                    size="small"
                                    icon={<CheckOutlined />}
                                    loading={approvingId === record._id}
                                    onClick={() => onVerify(record)}
                                    style={{
                                        background: '#43e97b',
                                        borderColor: '#43e97b',
                                    }}
                                >
                                    Verify
                                </Button>
                            </Tooltip>
                            <Tooltip title="Reject">
                                <Button
                                    danger
                                    size="small"
                                    icon={<CloseOutlined />}
                                    onClick={() => onReject(record)}
                                >
                                    Reject
                                </Button>
                            </Tooltip>
                        </>
                    ) : (
                        <>
                            {onView && (
                                <Tooltip title="View">
                                    <Button
                                        type="text"
                                        icon={<EyeOutlined />}
                                        onClick={() => onView(record)}
                                    />
                                </Tooltip>
                            )}
                            {onEdit && (
                                <Tooltip title={record.verificationStatus === 'rejected' ? 'Edit & Resubmit' : 'Edit'}>
                                    <Button
                                        type="text"
                                        icon={<EditOutlined />}
                                        onClick={() => onEdit(record)}
                                    />
                                </Tooltip>
                            )}
                            {record.status === 'active' && onUnpublish && (
                                <Tooltip title="Unpublish">
                                    <Button
                                        type="text"
                                        icon={<EyeInvisibleOutlined />}
                                        onClick={() => onUnpublish(record)}
                                        loading={approvingId === record._id}
                                    />
                                </Tooltip>
                            )}
                            {record.status === 'suspended' && onRepublish && (
                                <Tooltip title="Republish">
                                    <Button
                                        type="text"
                                        icon={<EyeOutlined />}
                                        onClick={() => onRepublish(record)}
                                        loading={approvingId === record._id}
                                    />
                                </Tooltip>
                            )}
                            {onDelete && (
                                <Tooltip title="Delete">
                                    <Button
                                        type="text"
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={() => onDelete(record)}
                                    />
                                </Tooltip>
                            )}
                        </>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <Table
            columns={columns}
            dataSource={services}
            loading={loading}
            rowKey="_id"
            pagination={{
                pageSize: 10,
                showTotal: (total) => `Total ${total} services`,
                showSizeChanger: true,
            }}
            className="custom-table"
        />
    );
}
