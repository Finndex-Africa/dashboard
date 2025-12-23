'use client';

import Table from 'antd/es/table';
import Tag from 'antd/es/tag';
import Button from 'antd/es/button';
import Space from 'antd/es/space';
import Tooltip from 'antd/es/tooltip';
import Rate from 'antd/es/rate';
import { EyeOutlined, EditOutlined, DeleteOutlined, DownloadOutlined, CheckOutlined, CloseOutlined, HeartOutlined, HeartFilled } from '@ant-design/icons';
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
            sorter: (a, b) => a.price - b.price,
            render: (price) => `$${price.toLocaleString()}`,
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
