'use client';

import Table from 'antd/es/table';
import Tag from 'antd/es/tag';
import Button from 'antd/es/button';
import Space from 'antd/es/space';
import Tooltip from 'antd/es/tooltip';
import { EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { Property } from '@/types/dashboard';
import type { ColumnsType } from 'antd/es/table';

interface PropertiesTableProps {
    properties: Property[];
    loading?: boolean;
    onView?: (property: Property) => void;
    onEdit?: (property: Property) => void;
    onDelete?: (property: Property) => void;
}

export function PropertiesTable({
    properties,
    loading,
    onView,
    onEdit,
    onDelete,
}: PropertiesTableProps) {
    const getStatusColor = (status: Property['status']) => {
        switch (status) {
            case 'Available':
                return 'green';
            case 'Rented':
                return 'blue';
            case 'Sold':
                return 'red';
            case 'Pending':
                return 'orange';
            default:
                return 'default';
        }
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
                        {record.location ? `${record.location.address}, ${record.location.city}` : ''}
                    </div>
                </div>
            ),
        },
        {
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
            filters: [
                { text: 'Apartment', value: 'Apartment' },
                { text: 'House', value: 'House' },
                { text: 'Commercial', value: 'Commercial' },
                { text: 'Land', value: 'Land' },
            ],
            onFilter: (value, record) => record.type === value,
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
                { text: 'Available', value: 'Available' },
                { text: 'Rented', value: 'Rented' },
                { text: 'Sold', value: 'Sold' },
                { text: 'Pending', value: 'Pending' },
            ],
            onFilter: (value, record) => record.status === value,
            render: (status: Property['status']) => (
                <Tag color={getStatusColor(status)}>{status}</Tag>
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
