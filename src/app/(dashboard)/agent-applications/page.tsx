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
import { EyeOutlined, SolutionOutlined } from '@ant-design/icons';
import {
    agentApplicationsApi,
    type AgentApplication,
    type AgentApplicationStatus,
} from '@/services/api/agent-applications.api';
import { dashboardApi } from '@/services/api/dashboard.api';
import { APPLICATION_STATUS_LABELS, formatGender, labelFromMap } from '@/lib/agent-application-labels';
import { getRoleLabel } from '@/lib/role-utils';
import { useAuth } from '@/providers/AuthProvider';

const { Title, Text } = Typography;
const { TextArea } = Input;

const PAGE_SIZE = 20;

const STATUS_COLORS: Record<string, string> = {
    pending: 'orange',
    approved: 'green',
    rejected: 'red',
};

function getLinkedUserName(application: AgentApplication): string {
    const user = application.userId;
    if (typeof user === 'object' && user) {
        const name = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
        return name || user.email || 'Linked account';
    }
    return 'No linked account';
}

function getLinkedUserEmail(application: AgentApplication): string | undefined {
    const user = application.userId;
    if (typeof user === 'object' && user?.email) return user.email;
    return undefined;
}

function getReviewerName(application: AgentApplication): string | undefined {
    const reviewer = application.reviewedBy;
    if (typeof reviewer === 'object' && reviewer) {
        const name = `${reviewer.firstName ?? ''} ${reviewer.lastName ?? ''}`.trim();
        return name || reviewer.email;
    }
    return undefined;
}

export default function AgentApplicationsPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [detailLoading, setDetailLoading] = useState(false);
    const [applications, setApplications] = useState<AgentApplication[]>([]);
    const [statusFilter, setStatusFilter] = useState<string>('pending');
    const [selected, setSelected] = useState<AgentApplication | null>(null);
    const [viewOpen, setViewOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [reviewNotes, setReviewNotes] = useState('');
    const [pagination, setPagination] = useState({ current: 1, pageSize: PAGE_SIZE, total: 0 });
    const [pendingTotal, setPendingTotal] = useState(0);

    const canReview =
        user?.role === 'admin' ||
        user?.role === 'admin_property' ||
        user?.role === 'admin_services';

    const fetchDashboardStats = useCallback(async () => {
        try {
            const response = await dashboardApi.getAdminStats();
            const payload = (response as unknown as { data?: { agentApplications?: { pending?: number } } }).data
                ?? (response as unknown as { agentApplications?: { pending?: number } });
            setPendingTotal(payload?.agentApplications?.pending ?? 0);
        } catch {
            // Non-blocking
        }
    }, []);

    const fetchData = useCallback(
        async (page = 1) => {
            setLoading(true);
            try {
                const result = await agentApplicationsApi.getAll({
                    status: statusFilter as AgentApplicationStatus | 'all',
                    page,
                    limit: PAGE_SIZE,
                });

                setApplications(result.data);

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
                message.error('Failed to load agent applications');
            } finally {
                setLoading(false);
            }
        },
        [statusFilter],
    );

    useEffect(() => {
        if (canReview) {
            fetchDashboardStats();
            fetchData(1);
        }
    }, [canReview, fetchData, fetchDashboardStats]);

    const openReview = async (record: AgentApplication) => {
        setSelected(record);
        setRejectionReason('');
        setReviewNotes('');
        setViewOpen(true);
        setDetailLoading(true);
        try {
            const detail = await agentApplicationsApi.getById(record._id);
            setSelected(detail);
        } catch {
            message.error('Failed to load application details');
        } finally {
            setDetailLoading(false);
        }
    };

    const refreshAfterAction = async () => {
        await Promise.all([fetchData(pagination.current), fetchDashboardStats()]);
    };

    const handleApprove = async () => {
        if (!selected) return;
        setActionLoading(true);
        try {
            await agentApplicationsApi.approve(selected._id, reviewNotes.trim() || undefined);
            message.success('Application approved');
            setViewOpen(false);
            setReviewNotes('');
            await refreshAfterAction();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            message.error(error?.response?.data?.message || 'Approval failed');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!selected) return;
        if (!rejectionReason.trim() || rejectionReason.trim().length < 3) {
            message.error('Please provide a rejection reason (min 3 characters)');
            return;
        }
        setActionLoading(true);
        try {
            await agentApplicationsApi.reject(
                selected._id,
                rejectionReason.trim(),
                reviewNotes.trim() || undefined,
            );
            message.success('Application rejected');
            setViewOpen(false);
            setRejectionReason('');
            setReviewNotes('');
            await refreshAfterAction();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            message.error(error?.response?.data?.message || 'Rejection failed');
        } finally {
            setActionLoading(false);
        }
    };

    const columns = [
        {
            title: 'Applicant',
            key: 'applicant',
            render: (_: unknown, record: AgentApplication) => (
                <div>
                    <div className="font-medium">{record.fullName}</div>
                    <div className="text-xs text-gray-500">{record.email}</div>
                </div>
            ),
        },
        {
            title: 'Location',
            dataIndex: 'location',
            key: 'location',
        },
        {
            title: 'Phone (WhatsApp)',
            dataIndex: 'phone',
            key: 'phone',
        },
        {
            title: 'Gender',
            dataIndex: 'gender',
            key: 'gender',
            render: (g: string) => formatGender(g),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (s: string) => (
                <Tag color={STATUS_COLORS[s] || 'default'}>
                    {labelFromMap(APPLICATION_STATUS_LABELS, s)?.toUpperCase()}
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
            render: (_: unknown, record: AgentApplication) => (
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
                <Text type="secondary">You do not have permission to review agent applications.</Text>
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
                    Agent Applications
                </Title>
                <Text type="secondary">
                    Review and approve applications to become an agent on FindAfriq
                </Text>
            </div>

            <Row gutter={[16, 16]}>
                {[
                    { title: 'Pending (Platform)', value: pendingTotal, color: '#faad14' },
                    { title: 'On This Page', value: applications.length, color: '#0000FF' },
                    {
                        title: 'Approved (Page)',
                        value: applications.filter((a) => a.status === 'approved').length,
                        color: '#52c41a',
                    },
                    {
                        title: 'Rejected (Page)',
                        value: applications.filter((a) => a.status === 'rejected').length,
                        color: '#ff4d4f',
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
                <div className="flex items-center gap-4 mb-4">
                    <Select
                        value={statusFilter}
                        onChange={setStatusFilter}
                        style={{ width: 180 }}
                        options={[
                            { label: 'All', value: 'all' },
                            { label: 'Pending', value: 'pending' },
                            { label: 'Approved', value: 'approved' },
                            { label: 'Rejected', value: 'rejected' },
                        ]}
                    />
                </div>
                <Table
                    loading={loading}
                    dataSource={applications}
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
                        <SolutionOutlined /> Review Agent Application
                    </span>
                }
                open={viewOpen}
                onCancel={() => {
                    setViewOpen(false);
                    setSelected(null);
                }}
                width={640}
                footer={
                    selected?.status === 'pending'
                        ? [
                              <Button key="cancel" onClick={() => setViewOpen(false)}>
                                  Cancel
                              </Button>,
                              <Button key="reject" danger loading={actionLoading} onClick={handleReject}>
                                  Reject
                              </Button>,
                              <Button
                                  key="approve"
                                  type="primary"
                                  loading={actionLoading}
                                  onClick={handleApprove}
                                  style={{ background: '#52c41a', borderColor: '#52c41a' }}
                              >
                                  Approve
                              </Button>,
                          ]
                        : [<Button key="close" onClick={() => setViewOpen(false)}>Close</Button>]
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
                            <Descriptions.Item label="Location">{selected.location}</Descriptions.Item>
                            <Descriptions.Item label="Phone (WhatsApp Preferred)">
                                {selected.phone}
                            </Descriptions.Item>
                            <Descriptions.Item label="Gender">
                                {formatGender(selected.gender)}
                            </Descriptions.Item>
                            <Descriptions.Item label="Status">
                                <Tag color={STATUS_COLORS[selected.status]}>
                                    {labelFromMap(APPLICATION_STATUS_LABELS, selected.status)?.toUpperCase()}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Linked Account">
                                {getLinkedUserName(selected)}
                                {getLinkedUserEmail(selected) && (
                                    <div className="text-xs text-gray-500">{getLinkedUserEmail(selected)}</div>
                                )}
                                {typeof selected.userId === 'object' && selected.userId?.userType && (
                                    <div className="text-xs text-gray-500 mt-1">
                                        Role: {getRoleLabel(selected.userId.userType)}
                                    </div>
                                )}
                            </Descriptions.Item>
                            <Descriptions.Item label="Submitted">
                                {new Date(selected.createdAt).toLocaleString()}
                            </Descriptions.Item>
                            {selected.reviewedAt && (
                                <Descriptions.Item label="Reviewed">
                                    {new Date(selected.reviewedAt).toLocaleString()}
                                </Descriptions.Item>
                            )}
                            {getReviewerName(selected) && (
                                <Descriptions.Item label="Reviewed By">
                                    {getReviewerName(selected)}
                                </Descriptions.Item>
                            )}
                            {selected.rejectionReason && (
                                <Descriptions.Item label="Rejection Reason">
                                    <span className="text-red-600">{selected.rejectionReason}</span>
                                </Descriptions.Item>
                            )}
                            {selected.reviewNotes && (
                                <Descriptions.Item label="Review Notes">{selected.reviewNotes}</Descriptions.Item>
                            )}
                        </Descriptions>

                        {selected.status === 'pending' && (
                            <>
                                <div>
                                    <Text type="secondary">Review notes (optional)</Text>
                                    <TextArea
                                        value={reviewNotes}
                                        onChange={(e) => setReviewNotes(e.target.value)}
                                        placeholder="Internal notes about this application..."
                                        rows={2}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Text type="secondary">Rejection reason (required if rejecting)</Text>
                                    <TextArea
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        placeholder="Reason shown to the applicant..."
                                        rows={3}
                                        className="mt-1"
                                    />
                                </div>
                            </>
                        )}
                    </div>
                ) : null}
            </Modal>
        </div>
    );
}
