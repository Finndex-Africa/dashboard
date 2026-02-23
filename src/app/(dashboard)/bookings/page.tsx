'use client';

import { useState, useEffect } from 'react';
import Typography from 'antd/es/typography';
import Button from 'antd/es/button';
import message from 'antd/es/message';
import Card from 'antd/es/card';
import Row from 'antd/es/row';
import Col from 'antd/es/col';
import Statistic from 'antd/es/statistic';
import Table from 'antd/es/table';
import Tag from 'antd/es/tag';
import Tooltip from 'antd/es/tooltip';
import Modal from 'antd/es/modal';
import Select from 'antd/es/select';
import {
    CalendarOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    EyeOutlined,
    DollarOutlined,
    ClockCircleOutlined,
} from '@ant-design/icons';
import { bookingsApi } from '@/services/api/bookings.api';
import type { Booking } from '@/types/dashboard';
import { useAuth } from '@/providers/AuthProvider';

const { Title, Text } = Typography;

export default function BookingsPage() {
    const { user: currentUser } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchBookings();
    }, [statusFilter]);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const filters: any = { limit: 100 };
            if (statusFilter !== 'all') filters.status = statusFilter;
            const response = await bookingsApi.getAll(filters);

            let list: Booking[] = [];
            const d = response.data as any;
            if (Array.isArray(d)) {
                list = d;
            } else if (d?.data && Array.isArray(d.data)) {
                list = d.data;
            }
            setBookings(list);
        } catch {
            message.error('Failed to load bookings');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id: string, action: 'confirm' | 'cancel' | 'complete') => {
        setActionLoading(true);
        try {
            if (action === 'confirm') await bookingsApi.confirm(id);
            else if (action === 'cancel') await bookingsApi.cancel(id);
            else if (action === 'complete') await bookingsApi.complete(id);
            message.success(`Booking ${action}ed successfully`);
            setViewModalOpen(false);
            fetchBookings();
        } catch (err: any) {
            message.error(err?.response?.data?.message || `Failed to ${action} booking`);
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            pending: 'orange',
            confirmed: 'blue',
            in_progress: 'processing',
            completed: 'green',
            cancelled: 'default',
            rejected: 'red',
        };
        return colors[status] || 'default';
    };

    const getUserName = (user: Booking['userId']) => {
        if (typeof user === 'object' && user) {
            return user.name || user.email || 'User';
        }
        return String(user || 'Unknown');
    };

    const getServiceTitle = (service: Booking['serviceId']) => {
        if (typeof service === 'object' && service) {
            return (service as any).title || (service as any).name || 'Service';
        }
        return String(service || 'Unknown');
    };

    // Stats
    const totalBookings = bookings.length;
    const pendingCount = bookings.filter((b) => b.status === 'pending').length;
    const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length;
    const completedCount = bookings.filter((b) => b.status === 'completed').length;
    const totalRevenue = bookings
        .filter((b) => b.paymentStatus === 'completed')
        .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    const columns = [
        {
            title: 'Customer',
            key: 'customer',
            render: (_: unknown, record: Booking) => (
                <div className="font-medium">{getUserName(record.userId)}</div>
            ),
        },
        {
            title: 'Service',
            key: 'service',
            render: (_: unknown, record: Booking) => (
                <div>{getServiceTitle(record.serviceId)}</div>
            ),
        },
        {
            title: 'Date',
            dataIndex: 'scheduledDate',
            key: 'scheduledDate',
            render: (d: string) => new Date(d).toLocaleDateString(),
            sorter: (a: Booking, b: Booking) =>
                new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime(),
        },
        {
            title: 'Amount',
            dataIndex: 'totalPrice',
            key: 'totalPrice',
            render: (v: number) => `$${(v || 0).toLocaleString()}`,
            sorter: (a: Booking, b: Booking) => (a.totalPrice || 0) - (b.totalPrice || 0),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (s: string) => (
                <Tag color={getStatusColor(s)}>{s?.replace('_', ' ').toUpperCase()}</Tag>
            ),
        },
        {
            title: 'Payment',
            dataIndex: 'paymentStatus',
            key: 'paymentStatus',
            render: (s: string) => (
                <Tag color={s === 'completed' ? 'green' : s === 'failed' ? 'red' : 'orange'}>
                    {s?.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: unknown, record: Booking) => (
                <div className="flex gap-1">
                    <Tooltip title="View Details">
                        <Button
                            type="text"
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={() => {
                                setSelectedBooking(record);
                                setViewModalOpen(true);
                            }}
                        />
                    </Tooltip>
                    {record.status === 'pending' && (
                        <>
                            <Tooltip title="Confirm">
                                <Button
                                    type="text"
                                    size="small"
                                    icon={<CheckCircleOutlined />}
                                    style={{ color: '#52c41a' }}
                                    onClick={() => handleAction(record._id, 'confirm')}
                                />
                            </Tooltip>
                            <Tooltip title="Cancel">
                                <Button
                                    type="text"
                                    size="small"
                                    icon={<CloseCircleOutlined />}
                                    danger
                                    onClick={() => handleAction(record._id, 'cancel')}
                                />
                            </Tooltip>
                        </>
                    )}
                    {record.status === 'confirmed' && (
                        <Tooltip title="Mark Complete">
                            <Button
                                type="text"
                                size="small"
                                icon={<CheckCircleOutlined />}
                                style={{ color: '#52c41a' }}
                                onClick={() => handleAction(record._id, 'complete')}
                            />
                        </Tooltip>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <Title level={2}>Bookings</Title>
                <Text type="secondary">Manage and track all service bookings</Text>
            </div>

            <Row gutter={[16, 16]}>
                {[
                    { title: 'Total Bookings', value: totalBookings, icon: <CalendarOutlined />, color: '#0000FF' },
                    { title: 'Pending', value: pendingCount, icon: <ClockCircleOutlined />, color: '#faad14' },
                    { title: 'Confirmed', value: confirmedCount, icon: <CheckCircleOutlined />, color: '#1890ff' },
                    { title: 'Completed', value: completedCount, icon: <CheckCircleOutlined />, color: '#52c41a' },
                    { title: 'Revenue', value: totalRevenue, icon: <DollarOutlined />, color: '#722ed1', prefix: '$' },
                ].map((s) => (
                    <Col xs={12} lg={4} key={s.title}>
                        <Card style={{ borderRadius: 12 }} styles={{ body: { padding: 16 } }}>
                            <Statistic
                                title={s.title}
                                value={s.value}
                                prefix={s.prefix}
                                valueStyle={{ color: s.color, fontWeight: 700, fontSize: 22 }}
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
                            { label: 'All Statuses', value: 'all' },
                            { label: 'Pending', value: 'pending' },
                            { label: 'Confirmed', value: 'confirmed' },
                            { label: 'In Progress', value: 'in_progress' },
                            { label: 'Completed', value: 'completed' },
                            { label: 'Cancelled', value: 'cancelled' },
                        ]}
                    />
                </div>
                <Table
                    loading={loading}
                    dataSource={bookings}
                    columns={columns}
                    rowKey="_id"
                    pagination={{ pageSize: 10, showSizeChanger: true }}
                    scroll={{ x: 800 }}
                />
            </Card>

            {/* Booking Detail Modal */}
            <Modal
                title="Booking Details"
                open={viewModalOpen}
                onCancel={() => setViewModalOpen(false)}
                width={600}
                footer={
                    selectedBooking?.status === 'pending'
                        ? [
                              <Button key="cancel" danger loading={actionLoading} onClick={() => handleAction(selectedBooking._id, 'cancel')}>
                                  Cancel Booking
                              </Button>,
                              <Button
                                  key="confirm"
                                  type="primary"
                                  loading={actionLoading}
                                  onClick={() => handleAction(selectedBooking._id, 'confirm')}
                              >
                                  Confirm Booking
                              </Button>,
                          ]
                        : selectedBooking?.status === 'confirmed'
                          ? [
                                <Button
                                    key="complete"
                                    type="primary"
                                    loading={actionLoading}
                                    onClick={() => handleAction(selectedBooking._id, 'complete')}
                                    style={{ background: '#52c41a', borderColor: '#52c41a' }}
                                >
                                    Mark Complete
                                </Button>,
                            ]
                          : [<Button key="close" onClick={() => setViewModalOpen(false)}>Close</Button>]
                }
            >
                {selectedBooking && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Text type="secondary">Customer</Text>
                                <div className="font-medium">{getUserName(selectedBooking.userId)}</div>
                            </div>
                            <div>
                                <Text type="secondary">Service</Text>
                                <div className="font-medium">{getServiceTitle(selectedBooking.serviceId)}</div>
                            </div>
                            <div>
                                <Text type="secondary">Scheduled Date</Text>
                                <div className="font-medium">{new Date(selectedBooking.scheduledDate).toLocaleString()}</div>
                            </div>
                            <div>
                                <Text type="secondary">Duration</Text>
                                <div className="font-medium">{selectedBooking.duration} hour(s)</div>
                            </div>
                            <div>
                                <Text type="secondary">Amount</Text>
                                <div className="font-medium text-lg">${(selectedBooking.totalPrice || 0).toLocaleString()}</div>
                            </div>
                            <div>
                                <Text type="secondary">Status</Text>
                                <div>
                                    <Tag color={getStatusColor(selectedBooking.status)}>
                                        {selectedBooking.status?.replace('_', ' ').toUpperCase()}
                                    </Tag>
                                </div>
                            </div>
                            <div>
                                <Text type="secondary">Contact Phone</Text>
                                <div className="font-medium">{selectedBooking.contactPhone || '-'}</div>
                            </div>
                            <div>
                                <Text type="secondary">Payment</Text>
                                <div>
                                    <Tag color={selectedBooking.paymentStatus === 'completed' ? 'green' : 'orange'}>
                                        {selectedBooking.paymentStatus?.toUpperCase()}
                                    </Tag>
                                </div>
                            </div>
                        </div>
                        {selectedBooking.serviceAddress && (
                            <div>
                                <Text type="secondary">Location</Text>
                                <div className="font-medium">{selectedBooking.serviceAddress}</div>
                            </div>
                        )}
                        {selectedBooking.notes && (
                            <div>
                                <Text type="secondary">Notes</Text>
                                <div className="text-gray-700">{selectedBooking.notes}</div>
                            </div>
                        )}
                        {selectedBooking.cancellationReason && (
                            <div>
                                <Text type="secondary">Cancellation Reason</Text>
                                <div className="text-red-600">{selectedBooking.cancellationReason}</div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}
