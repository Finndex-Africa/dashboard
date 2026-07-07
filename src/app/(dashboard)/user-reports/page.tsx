'use client';

import { useState, useEffect, useCallback } from 'react';
import Card from 'antd/es/card';
import Table from 'antd/es/table';
import Tag from 'antd/es/tag';
import Button from 'antd/es/button';
import Modal from 'antd/es/modal';
import Input from 'antd/es/input';
import Typography from 'antd/es/typography';
import Row from 'antd/es/row';
import Col from 'antd/es/col';
import Statistic from 'antd/es/statistic';
import message from 'antd/es/message';
import Select from 'antd/es/select';
import Descriptions from 'antd/es/descriptions';
import Spin from 'antd/es/spin';
import { EyeOutlined, FlagOutlined } from '@ant-design/icons';
import {
    userReportsApi,
    type UserReport,
} from '@/services/api/user-reports.api';
import { dashboardApi } from '@/services/api/dashboard.api';
import {
    formatReportCategory,
    formatReportStatus,
    REPORT_CATEGORY_OPTIONS,
    type UserReportCategory,
    type UserReportStatus,
} from '@/lib/user-report-labels';
import { getRoleLabel } from '@/lib/role-utils';
import { useAuth } from '@/providers/AuthProvider';

const { Title, Text } = Typography;
const { TextArea } = Input;

const PAGE_SIZE = 20;

const STATUS_COLORS: Record<string, string> = {
    pending: 'orange',
    reviewed: 'blue',
    resolved: 'green',
};

function getPersonName(ref: UserReport['userId'] | UserReport['reviewedBy']): string {
    if (typeof ref === 'object' && ref) {
        const name = `${ref.firstName ?? ''} ${ref.lastName ?? ''}`.trim();
        return name || ref.email || '—';
    }
    return '—';
}

function canReviewReports(role: string | undefined): boolean {
    return role === 'admin' || role === 'admin_property' || role === 'admin_services';
}

export default function UserReportsPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [detailLoading, setDetailLoading] = useState(false);
    const [reports, setReports] = useState<UserReport[]>([]);
    const [statusFilter, setStatusFilter] = useState<string>('pending');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [selected, setSelected] = useState<UserReport | null>(null);
    const [viewOpen, setViewOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [adminNotes, setAdminNotes] = useState('');
    const [pagination, setPagination] = useState({ current: 1, pageSize: PAGE_SIZE, total: 0 });
    const [pendingTotal, setPendingTotal] = useState(0);

    const canReview = canReviewReports(user?.role);

    const fetchDashboardStats = useCallback(async () => {
        try {
            const response = await dashboardApi.getAdminStats();
            const payload = (response as unknown as { data?: { userReports?: { pending?: number } } }).data
                ?? (response as unknown as { userReports?: { pending?: number } });
            setPendingTotal(payload?.userReports?.pending ?? 0);
        } catch {
            // Non-blocking
        }
    }, []);

    const fetchData = useCallback(
        async (page = 1) => {
            setLoading(true);
            try {
                const result = await userReportsApi.getAll({
                    status: statusFilter === 'all' ? undefined : (statusFilter as UserReportStatus),
                    reportCategory:
                        categoryFilter === 'all'
                            ? undefined
                            : (categoryFilter as UserReportCategory),
                    page,
                    limit: PAGE_SIZE,
                });

                setReports(result.data);

                if (result.pagination) {
                    setPagination({
                        current: result.pagination.currentPage ?? page,
                        pageSize: result.pagination.itemsPerPage ?? PAGE_SIZE,
                        total: result.pagination.totalItems ?? result.data.length,
                    });
                } else {
                    setPagination((prev) => ({
                        ...prev,
                        current: page,
                        total: result.data.length,
                    }));
                }
            } catch {
                message.error('Failed to load user reports');
            } finally {
                setLoading(false);
            }
        },
        [statusFilter, categoryFilter],
    );

    useEffect(() => {
        if (canReview) {
            fetchDashboardStats();
            fetchData(1);
        }
    }, [canReview, fetchData, fetchDashboardStats]);

    const openReview = async (record: UserReport) => {
        setSelected(record);
        setAdminNotes(record.adminNotes ?? '');
        setViewOpen(true);
        setDetailLoading(true);
        try {
            const detail = await userReportsApi.getById(record._id);
            setSelected(detail);
            setAdminNotes(detail.adminNotes ?? '');
        } catch {
            message.error('Failed to load report details');
        } finally {
            setDetailLoading(false);
        }
    };

    const refreshAfterAction = async () => {
        await Promise.all([fetchData(pagination.current), fetchDashboardStats()]);
    };

    const handleReview = async (status: 'reviewed' | 'resolved') => {
        if (!selected) return;
        setActionLoading(true);
        try {
            await userReportsApi.review(selected._id, {
                status,
                adminNotes: adminNotes.trim() || undefined,
            });
            message.success(`Report marked as ${formatReportStatus(status).toLowerCase()}`);
            setViewOpen(false);
            setAdminNotes('');
            await refreshAfterAction();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            message.error(error?.response?.data?.message || 'Update failed');
        } finally {
            setActionLoading(false);
        }
    };

    const columns = [
        {
            title: 'Reporter',
            key: 'reporter',
            render: (_: unknown, record: UserReport) => (
                <div>
                    <div className="font-medium">{record.fullName}</div>
                    <div className="text-xs text-gray-500">{record.email}</div>
                </div>
            ),
        },
        {
            title: 'Category',
            dataIndex: 'reportCategory',
            key: 'reportCategory',
            render: (value: string) => formatReportCategory(value),
        },
        {
            title: 'Reported Target',
            dataIndex: 'reportedTarget',
            key: 'reportedTarget',
            ellipsis: true,
        },
        {
            title: 'Phone',
            dataIndex: 'phone',
            key: 'phone',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (s: string) => (
                <Tag color={STATUS_COLORS[s] || 'default'}>
                    {formatReportStatus(s)?.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: 'Submitted',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (d: string) => new Date(d).toLocaleDateString(),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: unknown, record: UserReport) => (
                <Button type="link" icon={<EyeOutlined />} onClick={() => openReview(record)}>
                    Review
                </Button>
            ),
        },
    ];

    if (!canReview) {
        return (
            <Card>
                <Title level={4}>Access Denied</Title>
                <Text type="secondary">You do not have permission to view user reports.</Text>
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
                    User Reports
                </Title>
                <Text type="secondary">
                    Review client feedback and reports submitted by platform users
                </Text>
            </div>

            <Row gutter={[16, 16]}>
                {[
                    { title: 'Pending (Platform)', value: pendingTotal, color: '#faad14' },
                    { title: 'On This Page', value: reports.length, color: '#0000FF' },
                    {
                        title: 'Reviewed (Page)',
                        value: reports.filter((r) => r.status === 'reviewed').length,
                        color: '#1890ff',
                    },
                    {
                        title: 'Resolved (Page)',
                        value: reports.filter((r) => r.status === 'resolved').length,
                        color: '#52c41a',
                    },
                ].map((s) => (
                    <Col xs={12} lg={6} key={s.title}>
                        <Card style={{ borderRadius: 12 }} styles={{ body: { padding: 20 } }}>
                            <Statistic
                                title={s.title}
                                value={s.value}
                                valueStyle={{ color: s.color, fontWeight: 700 }}
                            />
                        </Card>
                    </Col>
                ))}
            </Row>

            <Card style={{ borderRadius: 12 }}>
                <div className="flex flex-wrap items-center gap-4 mb-4">
                    <Select
                        value={statusFilter}
                        onChange={setStatusFilter}
                        style={{ width: 160 }}
                        options={[
                            { label: 'All Status', value: 'all' },
                            { label: 'Pending', value: 'pending' },
                            { label: 'Reviewed', value: 'reviewed' },
                            { label: 'Resolved', value: 'resolved' },
                        ]}
                    />
                    <Select
                        value={categoryFilter}
                        onChange={setCategoryFilter}
                        style={{ width: 220 }}
                        options={[
                            { label: 'All Categories', value: 'all' },
                            ...REPORT_CATEGORY_OPTIONS,
                        ]}
                    />
                </div>
                <Table
                    loading={loading}
                    dataSource={reports}
                    columns={columns}
                    rowKey="_id"
                    pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        total: pagination.total,
                        showSizeChanger: false,
                        onChange: (page) => fetchData(page),
                    }}
                />
            </Card>

            <Modal
                title={
                    <span className="flex items-center gap-2">
                        <FlagOutlined /> User Report
                    </span>
                }
                open={viewOpen}
                onCancel={() => {
                    setViewOpen(false);
                    setSelected(null);
                }}
                width={640}
                footer={
                    selected?.status === 'resolved'
                        ? [<Button key="close" onClick={() => setViewOpen(false)}>Close</Button>]
                        : selected?.status === 'pending'
                          ? [
                                <Button key="cancel" onClick={() => setViewOpen(false)}>
                                    Cancel
                                </Button>,
                                <Button
                                    key="reviewed"
                                    loading={actionLoading}
                                    onClick={() => handleReview('reviewed')}
                                >
                                    Mark Reviewed
                                </Button>,
                                <Button
                                    key="resolved"
                                    type="primary"
                                    loading={actionLoading}
                                    onClick={() => handleReview('resolved')}
                                    style={{ background: '#52c41a', borderColor: '#52c41a' }}
                                >
                                    Mark Resolved
                                </Button>,
                            ]
                          : [
                                <Button key="cancel" onClick={() => setViewOpen(false)}>
                                    Cancel
                                </Button>,
                                <Button
                                    key="resolved"
                                    type="primary"
                                    loading={actionLoading}
                                    onClick={() => handleReview('resolved')}
                                    style={{ background: '#52c41a', borderColor: '#52c41a' }}
                                >
                                    Mark Resolved
                                </Button>,
                            ]
                }
            >
                {detailLoading ? (
                    <div className="flex justify-center py-12">
                        <Spin size="large" />
                    </div>
                ) : selected ? (
                    <div className="space-y-4">
                        <Descriptions bordered column={1} size="small">
                            <Descriptions.Item label="Full Name">{selected.fullName}</Descriptions.Item>
                            <Descriptions.Item label="Email Address">{selected.email}</Descriptions.Item>
                            <Descriptions.Item label="Phone Number">{selected.phone}</Descriptions.Item>
                            <Descriptions.Item label="Report Category">
                                {formatReportCategory(selected.reportCategory)}
                            </Descriptions.Item>
                            <Descriptions.Item label="Who Are You Reporting?">
                                {selected.reportedTarget}
                            </Descriptions.Item>
                            <Descriptions.Item label="Status">
                                <Tag color={STATUS_COLORS[selected.status]}>
                                    {formatReportStatus(selected.status)?.toUpperCase()}
                                </Tag>
                            </Descriptions.Item>
                            {typeof selected.userId === 'object' && selected.userId && (
                                <Descriptions.Item label="Submitted By (Account)">
                                    <div>{getPersonName(selected.userId)}</div>
                                    {selected.userId.email && (
                                        <div className="text-xs text-gray-500">{selected.userId.email}</div>
                                    )}
                                    {selected.userId.userType && (
                                        <div className="text-xs text-gray-500 mt-1">
                                            Role: {getRoleLabel(selected.userId.userType)}
                                        </div>
                                    )}
                                </Descriptions.Item>
                            )}
                            <Descriptions.Item label="Submitted">
                                {new Date(selected.createdAt).toLocaleString()}
                            </Descriptions.Item>
                            {selected.reviewedAt && (
                                <Descriptions.Item label="Reviewed">
                                    {new Date(selected.reviewedAt).toLocaleString()}
                                </Descriptions.Item>
                            )}
                            {typeof selected.reviewedBy === 'object' && selected.reviewedBy && (
                                <Descriptions.Item label="Reviewed By">
                                    {getPersonName(selected.reviewedBy)}
                                </Descriptions.Item>
                            )}
                            {selected.adminNotes && selected.status === 'resolved' && (
                                <Descriptions.Item label="Admin Notes">{selected.adminNotes}</Descriptions.Item>
                            )}
                        </Descriptions>

                        {selected.status !== 'resolved' && (
                            <div>
                                <Text type="secondary">Admin notes (optional)</Text>
                                <TextArea
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    placeholder="Notes about your investigation or resolution..."
                                    rows={3}
                                    className="mt-1"
                                />
                            </div>
                        )}
                    </div>
                ) : null}
            </Modal>
        </div>
    );
}
