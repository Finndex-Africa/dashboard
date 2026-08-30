'use client';

import { useLocale, useTranslations } from "next-intl";
import Table from 'antd/es/table';
import Tag from 'antd/es/tag';
import Button from 'antd/es/button';
import Space from 'antd/es/space';
import Tooltip from 'antd/es/tooltip';
import {
    EditOutlined,
    DeleteOutlined,
    CheckOutlined,
    CloseOutlined,
    EyeInvisibleOutlined,
    EyeOutlined,
    FileSearchOutlined,
    StarOutlined,
    StarFilled,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { BuySellListing } from '@/types/buy-sell';
import {
    getBuySellSellerEmail,
    getBuySellCategoryLabel,
    getStatusColor,
    getStatusLabel,
    formatBuySellPrice,
} from '@/lib/buy-sell-utils';
import { getSubcategoryLabel } from '@/lib/buy-sell-categories';

interface BuySellTableProps {
    listings: BuySellListing[];
    loading?: boolean;
    actionLoadingId?: string | null;
    pagination?: {
        current: number;
        total: number;
        pageSize: number;
        onChange: (page: number, pageSize: number) => void;
    };
    onReview?: (listing: BuySellListing) => void;
    onApprove?: (listing: BuySellListing) => void;
    onReject?: (listing: BuySellListing) => void;
    onEdit?: (listing: BuySellListing) => void;
    onDelete?: (listing: BuySellListing) => void;
    onUnpublish?: (listing: BuySellListing) => void;
    onRepublish?: (listing: BuySellListing) => void;
    onToggleFeatured?: (listing: BuySellListing) => void;
}

export function BuySellTable({
    listings,
    loading,
    actionLoadingId,
    pagination,
    onReview,
    onApprove,
    onReject,
    onEdit,
    onDelete,
    onUnpublish,
    onRepublish,
    onToggleFeatured,
}: BuySellTableProps) {
    const t_common = useTranslations("common");
    const t_listing = useTranslations("listing");
    const locale = useLocale();
    const columns: ColumnsType<BuySellListing> = [
        {
            title: 'Listing',
            key: 'listing',
            render: (_, record) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Thumbnail */}
                    {record.images?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={record.images[0]}
                            alt={record.title}
                            style={{
                                width: 52,
                                height: 52,
                                objectFit: 'cover',
                                borderRadius: 6,
                                flexShrink: 0,
                                background: '#f0f0f0',
                            }}
                            loading="lazy"
                        />
                    ) : (
                        <div
                            style={{
                                width: 52,
                                height: 52,
                                borderRadius: 6,
                                background: '#f0f0f0',
                                flexShrink: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#bbb',
                                fontSize: 12,
                            }}
                        >
                            {t_common("noImg")}
                        </div>
                    )}
                    <div>
                        <div className="font-medium text-gray-900" style={{ maxWidth: 200 }}>
                            {record.title}
                            {record.isPremium && (
                                <Tag color="gold" style={{ marginLeft: 6, fontSize: 10 }}>
                                    {t_common("featured")}
                                </Tag>
                            )}
                        </div>
                        <div className="text-sm text-gray-500">{record.location}</div>
                    </div>
                </div>
            ),
        },
        {
            title: 'Category',
            key: 'category',
            render: (_, record) => (
                <div>
                    <Tag color="blue">{getBuySellCategoryLabel(record.category)}</Tag>
                    <div className="text-xs text-gray-400 mt-1">{getSubcategoryLabel(record)}</div>
                </div>
            ),
            filters: [
                { text: 'Land', value: 'land' },
                { text: 'House', value: 'house' },
                { text: 'Household Item', value: 'household_item' },
            ],
            onFilter: (value, record) => record.category === value,
        },
        {
            title: 'Price',
            dataIndex: 'price',
            key: 'price',
            sorter: (a, b) => a.price - b.price,
            render: (price: number) => formatBuySellPrice(price),
        },
        {
            title: 'Agent Fee',
            key: 'agentFee',
            render: (_, record) =>
                record.agentFee != null ? (
                    <span className="text-gray-700 text-sm">{formatBuySellPrice(record.agentFee)}</span>
                ) : (
                    <span className="text-gray-400 text-xs">—</span>
                ),
        },
        {
            title: 'Seller (Email)',
            key: 'seller',
            render: (_, record) => (
                <span className="text-gray-900 text-sm">{getBuySellSellerEmail(record)}</span>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            filters: [
                { text: 'Pending', value: 'pending' },
                { text: 'Approved', value: 'approved' },
                { text: 'Rejected', value: 'rejected' },
                { text: 'Suspended', value: 'suspended' },
            ],
            onFilter: (value, record) => record.status === value,
            render: (status: BuySellListing['status']) => (
                <Tag color={getStatusColor(status)}>{getStatusLabel(status)}</Tag>
            ),
        },
        {
            title: 'Views / Saves',
            key: 'engagement',
            render: (_, record) => (
                <span className="text-gray-500 text-sm">
                    {record.views ?? 0} / {record.saves ?? 0}
                </span>
            ),
        },
        {
            title: 'Date',
            dataIndex: 'createdAt',
            key: 'createdAt',
            sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
            render: (date: string) =>
                new Date(date).toLocaleDateString(locale, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                }),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space size="small" wrap>
                    {/* Pending: show Review button first */}
                    {record.status === 'pending' && onReview && (
                        <Tooltip title={t_listing("reviewBeforeApproving")}>
                            <Button
                                type="primary"
                                size="small"
                                icon={<FileSearchOutlined />}
                                onClick={() => onReview(record)}
                            >
                                {t_common("review")}
                            </Button>
                        </Tooltip>
                    )}

                    {/* Quick inline approve/reject when no review handler */}
                    {record.status === 'pending' && !onReview && onApprove && (
                        <Tooltip title={t_common("approve")}>
                            <Button
                                type="primary"
                                size="small"
                                icon={<CheckOutlined />}
                                loading={actionLoadingId === record._id}
                                onClick={() => onApprove(record)}
                                style={{ background: '#43e97b', borderColor: '#43e97b' }}
                            />
                        </Tooltip>
                    )}
                    {record.status === 'pending' && !onReview && onReject && (
                        <Tooltip title={t_common("reject")}>
                            <Button
                                danger
                                size="small"
                                icon={<CloseOutlined />}
                                onClick={() => onReject(record)}
                            />
                        </Tooltip>
                    )}

                    {/* Edit */}
                    {onEdit && (
                        <Tooltip title={t_common("edit")}>
                            <Button
                                type="text"
                                icon={<EditOutlined />}
                                onClick={() => onEdit(record)}
                            />
                        </Tooltip>
                    )}

                    {/* Feature toggle */}
                    {onToggleFeatured && (
                        <Tooltip title={record.isPremium ? 'Remove Featured' : 'Mark as Featured'}>
                            <Button
                                type="text"
                                icon={record.isPremium ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
                                loading={actionLoadingId === record._id}
                                onClick={() => onToggleFeatured(record)}
                            />
                        </Tooltip>
                    )}

                    {/* Suspend */}
                    {record.status === 'approved' && onUnpublish && (
                        <Tooltip title={t_common("suspend")}>
                            <Button
                                type="text"
                                icon={<EyeInvisibleOutlined />}
                                loading={actionLoadingId === record._id}
                                onClick={() => onUnpublish(record)}
                            />
                        </Tooltip>
                    )}

                    {/* Reactivate */}
                    {record.status === 'suspended' && onRepublish && (
                        <Tooltip title={t_common("reactivate")}>
                            <Button
                                type="text"
                                icon={<EyeOutlined />}
                                loading={actionLoadingId === record._id}
                                onClick={() => onRepublish(record)}
                            />
                        </Tooltip>
                    )}

                    {/* Delete */}
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
                </Space>
            ),
        },
    ];

    return (
        <Table
            columns={columns}
            dataSource={listings}
            loading={loading}
            rowKey="_id"
            pagination={
                pagination
                    ? {
                          current: pagination.current,
                          total: pagination.total,
                          pageSize: pagination.pageSize,
                          onChange: pagination.onChange,
                          showTotal: (total) => `Total ${total} listing${total !== 1 ? 's' : ''}`,
                          showSizeChanger: true,
                      }
                    : {
                          pageSize: 20,
                          showTotal: (total) => `Total ${total} listing${total !== 1 ? 's' : ''}`,
                          showSizeChanger: true,
                      }
            }
            className="custom-table"
            scroll={{ x: 'max-content' }}
        />
    );
}
