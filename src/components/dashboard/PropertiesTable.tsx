'use client';

import Table from 'antd/es/table';
import Tag from 'antd/es/tag';
import Button from 'antd/es/button';
import Space from 'antd/es/space';
import Tooltip from 'antd/es/tooltip';
import { EyeOutlined, EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import type { Property } from '@/types/dashboard';
import type { ColumnsType } from 'antd/es/table';

interface PropertiesTableProps {
    properties: Property[];
    loading?: boolean;
    onView?: (property: Property) => void;
    onEdit?: (property: Property) => void;
    onDelete?: (property: Property) => void;
    onApprove?: (property: Property) => void;
    onReject?: (property: Property) => void;
    approvingId?: string | null;
}

export function PropertiesTable({
    properties,
    loading,
    onView,
    onEdit,
    onDelete,
    onApprove,
    onReject,
    approvingId,
}: PropertiesTableProps) {
    const getStatusColor = (status: Property['status']) => {
        switch (status) {
            case 'approved':
                return 'green';
            case 'rented':
                return 'blue';
            case 'rejected':
                return 'red';
            case 'pending':
                return 'orange';
            case 'archived':
                return 'gray';
            default:
                return 'default';
        }
    };

    const getStatusLabel = (status: Property['status']) => {
        return status.charAt(0).toUpperCase() + status.slice(1);
    };

    const columns: ColumnsType<Property> = [
        {
            title: 'Property',
            dataIndex: 'title',
            key: 'title',
            render: (title, record) => (
                <div>
                    <div className="font-medium text-gray-900">{title}</div>
                    <div className="text-sm text-gray-500">
                        {record.location || ''}
                    </div>
                </div>
            ),
        },
        {
            title: 'Type',
            dataIndex: 'propertyType',
            key: 'propertyType',
            render: (propertyType) => propertyType || 'N/A',
        },
        {
            title: 'Price',
            dataIndex: 'price',
            key: 'price',
            sorter: (a, b) => a.price - b.price,
            render: (price) => `$${price.toLocaleString()}`,
        },
        {
            title: 'Area',
            dataIndex: 'area',
            key: 'area',
            render: (area) => `${area} sq ft`,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            filters: [
                { text: 'Approved', value: 'approved' },
                { text: 'Pending', value: 'pending' },
                { text: 'Rented', value: 'rented' },
                { text: 'Rejected', value: 'rejected' },
                { text: 'Archived', value: 'archived' },
            ],
            onFilter: (value, record) => record.status === value,
            render: (status: Property['status']) => (
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
            dataSource={properties}
            loading={loading}
            rowKey="_id"
            pagination={{
                pageSize: 10,
                showTotal: (total) => `Total ${total} properties`,
                showSizeChanger: true,
            }}
            className="custom-table"
        />
    );
}
