'use client';

import { useState, useEffect } from 'react';
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
import Image from 'antd/es/image';
import message from 'antd/es/message';
import Select from 'antd/es/select';
import {
    EyeOutlined,
    ExportOutlined,
    FilePdfOutlined,
    SafetyCertificateOutlined,
} from '@ant-design/icons';
import { apiClient } from '@/lib/api-client';

function certificateUrlLooksPdf(url: string): boolean {
    const path = url.split(/[?#]/)[0]?.toLowerCase() ?? '';
    return path.endsWith('.pdf');
}

const { Title, Text } = Typography;
const { TextArea } = Input;

interface Verification {
    _id: string;
    userId: any;
    idType: string;
    idNumber: string;
    idFrontImage: string;
    idBackImage?: string;
    selfieImage?: string;
    businessRegistrationCertificate?: string;
    status: 'pending' | 'approved' | 'rejected' | 'expired';
    rejectionReason?: string;
    notes?: string;
    verificationScore: number;
    metadata?: { fullName?: string; dateOfBirth?: string; address?: string };
    createdAt: string;
}

export default function VerificationsPage() {
    const [loading, setLoading] = useState(true);
    const [verifications, setVerifications] = useState<Verification[]>([]);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selected, setSelected] = useState<Verification | null>(null);
    const [viewOpen, setViewOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });

    useEffect(() => {
        fetchData();
    }, [statusFilter]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
            const [listRes, statsRes] = await Promise.all([
                apiClient.get(`/verification/id/all${params}`),
                apiClient.get('/verification/id/stats'),
            ]);
            const list = (listRes.data as any)?.data?.data ?? (listRes.data as any)?.data ?? [];
            setVerifications(Array.isArray(list) ? list : []);
            const s = (statsRes.data as any)?.data ?? statsRes.data;
            setStats(s);
        } catch {
            message.error('Failed to load verifications');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id: string, status: 'approved' | 'rejected') => {
        setActionLoading(true);
        try {
            await apiClient.patch(`/verification/id/${id}/verify`, {
                status,
                rejectionReason: status === 'rejected' ? rejectionReason : undefined,
            });
            message.success(`Verification ${status}`);
            setViewOpen(false);
            setRejectionReason('');
            fetchData();
        } catch (err: any) {
            message.error(err?.response?.data?.message || 'Action failed');
        } finally {
            setActionLoading(false);
        }
    };

    const getUserName = (v: Verification) => {
        if (v.metadata?.fullName) return v.metadata.fullName;
        if (typeof v.userId === 'object' && v.userId) {
            return `${v.userId.firstName || ''} ${v.userId.lastName || ''}`.trim() || v.userId.email || 'User';
        }
        return 'User';
    };

    const columns = [
        {
            title: 'User',
            key: 'user',
            render: (_: unknown, record: Verification) => (
                <div>
                    <div className="font-medium">{getUserName(record)}</div>
                    {typeof record.userId === 'object' && record.userId?.email && (
                        <div className="text-xs text-gray-500">{record.userId.email}</div>
                    )}
                </div>
            ),
        },
        {
            title: 'ID Type',
            dataIndex: 'idType',
            key: 'idType',
            render: (t: string) => <span className="capitalize">{t?.replace('_', ' ')}</span>,
        },
        {
            title: 'ID Number',
            dataIndex: 'idNumber',
            key: 'idNumber',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (s: string) => {
                const colors: Record<string, string> = {
                    pending: 'orange',
                    approved: 'green',
                    rejected: 'red',
                    expired: 'default',
                };
                return <Tag color={colors[s] || 'default'}>{s?.toUpperCase()}</Tag>;
            },
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
            render: (_: unknown, record: Verification) => (
                <Button
                    type="link"
                    icon={<EyeOutlined />}
                    onClick={() => {
                        setSelected(record);
                        setViewOpen(true);
                        setRejectionReason('');
                    }}
                >
                    Review
                </Button>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <Title level={2} style={{
                    background: 'linear-gradient(135deg, #0000FF 0%, #0000CC 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                }}>
                    ID Verifications
                </Title>
                <Text type="secondary">Review and approve user identity documents</Text>
            </div>

            <Row gutter={[16, 16]}>
                {[
                    { title: 'Total', value: stats.total, color: '#0000FF' },
                    { title: 'Pending', value: stats.pending, color: '#faad14' },
                    { title: 'Approved', value: stats.approved, color: '#52c41a' },
                    { title: 'Rejected', value: stats.rejected, color: '#ff4d4f' },
                ].map((s) => (
                    <Col xs={12} lg={6} key={s.title}>
                        <Card style={{ borderRadius: 12 }} styles={{ body: { padding: 20 } }}>
                            <Statistic title={s.title} value={s.value} valueStyle={{ color: s.color, fontWeight: 700 }} />
                        </Card>
                    </Col>
                ))}
            </Row>

            <Card style={{ borderRadius: 12 }}>
                <div className="flex items-center gap-4 mb-4">
                    <Select
                        value={statusFilter}
                        onChange={setStatusFilter}
                        style={{ width: 160 }}
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
                    dataSource={verifications}
                    columns={columns}
                    rowKey="_id"
                    pagination={{ pageSize: 10 }}
                />
            </Card>

            {/* Review Modal */}
            <Modal
                title={<span className="flex items-center gap-2"><SafetyCertificateOutlined /> Review Verification</span>}
                open={viewOpen}
                onCancel={() => setViewOpen(false)}
                width={700}
                footer={
                    selected?.status === 'pending'
                        ? [
                              <Button key="reject" danger loading={actionLoading} onClick={() => handleAction(selected._id, 'rejected')}>
                                  Reject
                              </Button>,
                              <Button
                                  key="approve"
                                  type="primary"
                                  loading={actionLoading}
                                  onClick={() => handleAction(selected._id, 'approved')}
                                  style={{ background: '#52c41a', borderColor: '#52c41a' }}
                              >
                                  Approve
                              </Button>,
                          ]
                        : [<Button key="close" onClick={() => setViewOpen(false)}>Close</Button>]
                }
            >
                {selected && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Text type="secondary">Name</Text>
                                <div className="font-medium">{getUserName(selected)}</div>
                            </div>
                            <div>
                                <Text type="secondary">ID Type</Text>
                                <div className="font-medium capitalize">{selected.idType?.replace('_', ' ')}</div>
                            </div>
                            <div>
                                <Text type="secondary">ID Number</Text>
                                <div className="font-medium">{selected.idNumber}</div>
                            </div>
                            <div>
                                <Text type="secondary">Status</Text>
                                <div>
                                    <Tag color={selected.status === 'approved' ? 'green' : selected.status === 'rejected' ? 'red' : 'orange'}>
                                        {selected.status?.toUpperCase()}
                                    </Tag>
                                </div>
                            </div>
                        </div>

                        <div>
                            <Text type="secondary">Front of ID</Text>
                            <div className="mt-1">
                                <Image src={selected.idFrontImage} alt="Front" style={{ maxHeight: 250, borderRadius: 8 }} />
                            </div>
                        </div>

                        {selected.idBackImage && (
                            <div>
                                <Text type="secondary">Back of ID</Text>
                                <div className="mt-1">
                                    <Image src={selected.idBackImage} alt="Back" style={{ maxHeight: 250, borderRadius: 8 }} />
                                </div>
                            </div>
                        )}

                        {selected.businessRegistrationCertificate?.trim() && (
                            <div>
                                <Text type="secondary" className="block">
                                    Business registration certificate
                                </Text>
                                {certificateUrlLooksPdf(selected.businessRegistrationCertificate) ? (
                                    <div className="mt-3 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm ring-1 ring-slate-100 sm:p-5">
                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch sm:justify-between sm:gap-6">
                                            <div className="flex min-w-0 items-center gap-4">
                                                <div
                                                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-red-500/[0.12] text-2xl text-red-600"
                                                    aria-hidden
                                                >
                                                    <FilePdfOutlined />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-slate-900">PDF document</p>
                                                    <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                                                        Opens in a new tab so you can review the full certificate.
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                type="primary"
                                                size="large"
                                                className="h-11 shrink-0 rounded-lg px-6 shadow-md transition-all hover:shadow-lg sm:self-center"
                                                icon={<ExportOutlined />}
                                                href={selected.businessRegistrationCertificate}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                View certificate
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-1">
                                        <Image
                                            src={selected.businessRegistrationCertificate}
                                            alt="Business registration certificate"
                                            style={{ maxHeight: 250, borderRadius: 8 }}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {selected.selfieImage && (
                            <div>
                                <Text type="secondary">Selfie with ID</Text>
                                <div className="mt-1">
                                    <Image src={selected.selfieImage} alt="Selfie" style={{ maxHeight: 250, borderRadius: 8 }} />
                                </div>
                            </div>
                        )}

                        {selected.status === 'pending' && (
                            <div>
                                <Text type="secondary">Rejection reason (if rejecting)</Text>
                                <TextArea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Reason for rejection..."
                                    rows={3}
                                    className="mt-1"
                                />
                            </div>
                        )}

                        {selected.rejectionReason && (
                            <div>
                                <Text type="secondary">Rejection Reason</Text>
                                <div className="text-red-600">{selected.rejectionReason}</div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}
