'use client';

import { useLocale, useTranslations } from "next-intl";
import Table from 'antd/es/table';
import Tag from 'antd/es/tag';
import Button from 'antd/es/button';
import Space from 'antd/es/space';
import Tooltip from 'antd/es/tooltip';
import Rate from 'antd/es/rate';
import { EyeOutlined, EditOutlined, DeleteOutlined, DownloadOutlined, CheckOutlined, CloseOutlined, HeartOutlined, HeartFilled, EyeInvisibleOutlined, FileSearchOutlined } from '@ant-design/icons';
import type { Service } from '@/types/dashboard';
import type { ColumnsType } from 'antd/es/table';
import { getServiceCategoryLabel, getServiceProviderLabel, serviceNeedsReview, serviceNeedsActivation } from '@/lib/services-utils';

interface ServicesTableProps {
    services: Service[];
    loading?: boolean;
    /** Admin: show verification state in the status column when pending/rejected */
    adminStatusColumn?: boolean;
    onView?: (service: Service) => void;
    onEdit?: (service: Service) => void;
    onDelete?: (service: Service) => void;
    onReview?: (service: Service) => void;
    onVerify?: (service: Service) => void;
    onReject?: (service: Service) => void;
    onUnpublish?: (service: Service) => void;
    onRepublish?: (service: Service) => void;
    onActivate?: (service: Service) => void;
    onSaveToggle?: (serviceId: string) => void;
    savedIds?: string[];
    approvingId?: string | null;
}

export function ServicesTable({
    services,
    loading,
    adminStatusColumn = false,
    onView,
    onEdit,
    onDelete,
    onReview,
    onVerify,
    onReject,
    onUnpublish,
    onRepublish,
    onActivate,
    onSaveToggle,
    savedIds = [],
    approvingId,
}: ServicesTableProps) {
    const t_misc = useTranslations("misc");
    const t_common = useTranslations("common");
    const t_listing = useTranslations("listing");
    const locale = useLocale();
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
                    <div className="text-sm text-gray-500">{getServiceCategoryLabel(record) || record.category || '—'}</div>
                </div>
            ),
        },
        {
            title: 'Provider',
            dataIndex: 'provider',
            key: 'provider',
            render: (_, record) => {
                const label = getServiceProviderLabel(record);
                return label || '—';
            },
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
            render: (status: Service['status'], record) => {
                if (adminStatusColumn && serviceNeedsReview(record)) {
                    return <Tag color="orange">Pending verification</Tag>;
                }
                if (adminStatusColumn && record.verificationStatus === 'rejected') {
                    return <Tag color="volcano">Rejected</Tag>;
                }
                if (adminStatusColumn && serviceNeedsActivation(record)) {
                    return <Tag color="orange">Pending publish</Tag>;
                }
                return <Tag color={getStatusColor(status)}>{getStatusLabel(status)}</Tag>;
            },
        },
        {
            title: 'Date Added',
            dataIndex: 'createdAt',
            key: 'createdAt',
            sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
            render: (date) => new Date(date).toLocaleDateString(locale, {
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

                    {/* Admin: Review new submissions awaiting verification */}
                    {serviceNeedsReview(record) && onReview ? (
                        <Tooltip title={t_listing("reviewBeforeVerifying")}>
                            <Button
                                type="primary"
                                size="small"
                                icon={<FileSearchOutlined />}
                                onClick={() => onReview(record)}
                            >
                                {t_common("review")}
                            </Button>
                        </Tooltip>
                    ) : serviceNeedsReview(record) && onVerify && onReject ? (
                        <>
                            <Tooltip title={t_common("verify")}>
                                <Button
                                    type="primary"
                                    size="small"
                                    icon={<CheckOutlined />}
                                    loading={approvingId === record._id}
                                    onClick={() => onVerify(record)}
                                    style={{
                                        background: '#52c41a',
                                        borderColor: '#52c41a',
                                    }}
                                >
                                    {t_common("verify")}
                                </Button>
                            </Tooltip>
                            <Tooltip title={t_common("reject")}>
                                <Button
                                    danger
                                    size="small"
                                    icon={<CloseOutlined />}
                                    onClick={() => onReject(record)}
                                >
                                    {t_common("reject")}
                                </Button>
                            </Tooltip>
                        </>
                    ) : (
                        <>
                            {serviceNeedsActivation(record) && onActivate && (
                                <Tooltip title={t_misc("activateService")}>
                                    <Button
                                        type="primary"
                                        size="small"
                                        icon={<CheckOutlined />}
                                        loading={approvingId === record._id}
                                        onClick={() => onActivate(record)}
                                        style={{
                                            background: '#52c41a',
                                            borderColor: '#52c41a',
                                        }}
                                    >
                                        {t_common("activate")}
                                    </Button>
                                </Tooltip>
                            )}
                            {onView && (
                                <Tooltip title={t_common("view")}>
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
                                <Tooltip title={t_common("unpublish")}>
                                    <Button
                                        type="text"
                                        icon={<EyeInvisibleOutlined />}
                                        onClick={() => onUnpublish(record)}
                                        loading={approvingId === record._id}
                                    />
                                </Tooltip>
                            )}
                            {record.status === 'suspended' && onRepublish && (
                                <Tooltip title={t_common("republish")}>
                                    <Button
                                        type="text"
                                        icon={<EyeOutlined />}
                                        onClick={() => onRepublish(record)}
                                        loading={approvingId === record._id}
                                    />
                                </Tooltip>
                            )}
                            {onDelete && (
                                <Tooltip title={t_common("delete")}>
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
