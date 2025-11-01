'use client';

import Table from 'antd/es/table';
import Tag from 'antd/es/tag';
import Button from 'antd/es/button';
import Space from 'antd/es/space';
import Tooltip from 'antd/es/tooltip';
import Rate from 'antd/es/rate';
import { EyeOutlined, EditOutlined, DeleteOutlined, DownloadOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import type { Service } from '@/types/dashboard';
import type { ColumnsType } from 'antd/es/table';

interface ServicesTableProps {
    services: Service[];
    loading?: boolean;
    onView?: (service: Service) => void;
    onEdit?: (service: Service) => void;
    onDelete?: (service: Service) => void;
    onApprove?: (service: Service) => void;
    onReject?: (service: Service) => void;
    approvingId?: string | null;
}

export function ServicesTable({
    services,
    loading,
    onView,
    onEdit,
    onDelete,
    onApprove,
    onReject,
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
            dataIndex: 'name',
            key: 'name',
            render: (name, record) => (
                <div>
                    <div className="font-medium text-gray-900">{name}</div>
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
                    {record.status === 'pending' && onApprove && onReject ? (
                        <>
                            <Tooltip title="Approve">
                                <Button
                                    type="primary"
                                    size="small"
                                    icon={<CheckOutlined />}
                                    loading={approvingId === record._id}
                                    onClick={() => onApprove(record)}
                                    style={{
                                        background: '#43e97b',
                                        borderColor: '#43e97b',
                                    }}
                                >
                                    Approve
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
                            <Tooltip title="View">
                                <Button
                                    type="text"
                                    icon={<EyeOutlined />}
                                    onClick={() => onView?.(record)}
                                />
                            </Tooltip>
                            <Tooltip title="Edit">
                                <Button
                                    type="text"
                                    icon={<EditOutlined />}
                                    onClick={() => onEdit?.(record)}
                                />
                            </Tooltip>
                            <Tooltip title="Delete">
                                <Button
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => onDelete?.(record)}
                                />
                            </Tooltip>
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
