'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';
import Card from 'antd/es/card';
import Row from 'antd/es/row';
import Col from 'antd/es/col';
import Input from 'antd/es/input';
import Select from 'antd/es/select';
import Table from 'antd/es/table';
import Tag from 'antd/es/tag';
import Button from 'antd/es/button';
import Space from 'antd/es/space';
import Tooltip from 'antd/es/tooltip';
import Typography from 'antd/es/typography';
import Modal from 'antd/es/modal';
import Form from 'antd/es/form';
import DatePicker from 'antd/es/date-picker';
import InputNumber from 'antd/es/input-number';
import TextArea from 'antd/es/input/TextArea';
import { SearchOutlined, EyeOutlined, EditOutlined, StopOutlined } from '@ant-design/icons';
import { bookingsApi } from '@/services/api/bookings.api';
import type { Booking } from '@/types/dashboard';
import type { ColumnsType } from 'antd/es/table';
import { showToast } from '@/lib/toast';
import { useAuth } from '@/providers/AuthProvider';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Search } = Input;

type BookingType = 'property' | 'service' | 'all';
type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'rejected' | 'all';

function BookingsPageContent() {
    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    // Query params
    const typeParam = (searchParams.get('type') as BookingType) || 'all';
    const statusParam = (searchParams.get('status') as BookingStatus) || 'all';

    // State
    const [loading, setLoading] = useState(true);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editLoading, setEditLoading] = useState(false);
    const [cancelLoading, setCancelLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [form] = Form.useForm();

    useEffect(() => {
        if (user) {
            fetchBookings();
        }
    }, [user, typeParam, statusParam]);

    const fetchBookings = async () => {
        if (!user?.role) return;

        try {
            setLoading(true);
            let response;

            // Role-based data fetching (REDUCED from 1000 to 50 for all roles)
            if (user.role === 'home_seeker') {
                // Home seekers: own bookings only
                response = await bookingsApi.getMyBookings({ page: 1, limit: 50 });
            } else if (user.role === 'service_provider') {
                // Service providers: bookings for own services
                response = await bookingsApi.getProviderBookings({ page: 1, limit: 50 });
            } else if (user.role === 'agent' || user.role === 'landlord') {
                // Agents: property bookings only
                response = await bookingsApi.getAll({ page: 1, limit: 50 });
            } else {
                // Admin: all bookings
                response = await bookingsApi.getAll({ page: 1, limit: 50 });
            }

            const bookingsData = (response as any)?.data?.data || response.data || [];
            const bookings = Array.isArray(bookingsData) ? bookingsData : [];
            setBookings(bookings);
        } catch (error: any) {
            console.error('Failed to fetch bookings:', error);
            console.error('Error details:', error.response?.data || error.message);
            if (error.response?.status !== 404) {
                const errorMsg = error.response?.data?.message || error.message || 'Failed to load bookings';
                showToast.error(errorMsg);
            }
            setBookings([]);
        } finally {
            setLoading(false);
        }
    };

    // Filter bookings
    const filteredBookings = bookings.filter(booking => {
        // Search filter
        if (searchText) {
            const search = searchText.toLowerCase();
            const serviceTitle = typeof booking.serviceId === 'object' && booking.serviceId?.title
                ? booking.serviceId.title.toLowerCase()
                : '';
            if (!serviceTitle.includes(search)) return false;
        }

        // Type filter (property vs service)
        if (typeParam !== 'all') {
            // Future: Check booking type when property bookings are added
            // For now, all bookings are service bookings
        }

        // Status filter
        if (statusParam !== 'all' && booking.status !== statusParam) return false;

        return true;
    });

    const handleView = (booking: Booking) => {
        setSelectedBooking(booking);
        setViewModalOpen(true);
    };

    const handleEdit = (booking: Booking) => {
        setSelectedBooking(booking);
        form.setFieldsValue({
            duration: booking.duration,
            serviceLocation: booking.serviceLocation,
            serviceAddress: booking.serviceAddress,
            notes: booking.notes,
        });
        setEditModalOpen(true);
    };

    const handleUpdateBooking = async (values: any) => {
        if (!selectedBooking) return;

        try {
            setEditLoading(true);
            await bookingsApi.update(selectedBooking._id, {
                ...values,
                scheduledDate: values.scheduledDate?.toISOString(),
            });

            showToast.success('Booking updated successfully');
            setEditModalOpen(false);
            form.resetFields();
            setSelectedBooking(null);
            fetchBookings();
        } catch (error: any) {
            showToast.error(error.response?.data?.message || 'Failed to update booking');
        } finally {
            setEditLoading(false);
        }
    };

    const handleCancelBooking = async (booking: Booking) => {
        Modal.confirm({
            title: 'Cancel Booking',
            content: 'Are you sure you want to cancel this booking?',
            okText: 'Yes, Cancel Booking',
            okType: 'danger',
            onOk: async () => {
                try {
                    setCancelLoading(true);
                    await bookingsApi.cancel(booking._id, 'Cancelled by user');
                    showToast.success('Booking cancelled successfully');
                    fetchBookings();
                } catch (error: any) {
                    showToast.error(error.response?.data?.message || 'Failed to cancel booking');
                } finally {
                    setCancelLoading(false);
                }
            },
        });
    };

    const getStatusColor = (status: Booking['status']) => {
        switch (status) {
            case 'confirmed': return 'green';
            case 'pending': return 'orange';
            case 'in_progress': return 'blue';
            case 'completed': return 'cyan';
            case 'cancelled': return 'red';
            case 'rejected': return 'volcano';
            default: return 'default';
        }
    };

    const getPaymentStatusColor = (status: Booking['paymentStatus']) => {
        switch (status) {
            case 'completed': return 'green';
            case 'pending': return 'orange';
            case 'failed': return 'red';
            case 'refunded': return 'purple';
            default: return 'default';
        }
    };

    const columns: ColumnsType<Booking> = [
        {
            title: 'Service',
            dataIndex: 'serviceId',
            key: 'service',
            render: (service: any) => (
                <div>
                    <div className="font-medium">
                        {typeof service === 'object' ? service?.title : 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">
                        {typeof service === 'object' ? service?.category : ''}
                    </div>
                </div>
            ),
        },
        {
            title: 'Scheduled Date',
            dataIndex: 'scheduledDate',
            key: 'scheduledDate',
            render: (date) => new Date(date).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            }),
        },
        {
            title: 'Duration',
            dataIndex: 'duration',
            key: 'duration',
            render: (duration) => `${duration} hours`,
        },
        {
            title: 'Total Price',
            dataIndex: 'totalPrice',
            key: 'totalPrice',
            render: (price) => `$${price?.toLocaleString() || 0}`,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: Booking['status']) => (
                <Tag color={getStatusColor(status)}>
                    {status.toUpperCase().replace('_', ' ')}
                </Tag>
            ),
        },
        {
            title: 'Payment',
            dataIndex: 'paymentStatus',
            key: 'paymentStatus',
            render: (status: Booking['paymentStatus']) => (
                <Tag color={getPaymentStatusColor(status)}>
                    {status?.toUpperCase() || 'N/A'}
                </Tag>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="View">
                        <Button type="text" icon={<EyeOutlined />} onClick={() => handleView(record)} />
                    </Tooltip>
                    {record.status === 'pending' && (
                        <>
                            <Tooltip title="Edit">
                                <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
                            </Tooltip>
                            <Tooltip title="Cancel">
                                <Button
                                    type="text"
                                    danger
                                    icon={<StopOutlined />}
                                    onClick={() => handleCancelBooking(record)}
                                    loading={cancelLoading}
                                />
                            </Tooltip>
                        </>
                    )}
                </Space>
            ),
        },
    ];

    const handleFilterChange = (key: 'type' | 'status', value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value === 'all') {
            params.delete(key);
        } else {
            params.set(key, value);
        }
        router.push(`/bookings?${params.toString()}`);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <Title level={2} className="mb-1">Bookings</Title>
                <Text type="secondary">Manage your booking requests</Text>
            </div>

            {/* Filters */}
            <Card>
                <Row gutter={[16, 16]}>
                    <Col xs={24} md={8}>
                        <Search
                            placeholder="Search by service..."
                            allowClear
                            size="large"
                            prefix={<SearchOutlined />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                    </Col>
                    <Col xs={12} md={4}>
                        <Select
                            size="large"
                            value={typeParam}
                            onChange={(value) => handleFilterChange('type', value)}
                            style={{ width: '100%' }}
                        >
                            <Select.Option value="all">All Types</Select.Option>
                            <Select.Option value="service">Service</Select.Option>
                            <Select.Option value="property">Property</Select.Option>
                        </Select>
                    </Col>
                    <Col xs={12} md={4}>
                        <Select
                            size="large"
                            value={statusParam}
                            onChange={(value) => handleFilterChange('status', value)}
                            style={{ width: '100%' }}
                        >
                            <Select.Option value="all">All Status</Select.Option>
                            <Select.Option value="pending">Pending</Select.Option>
                            <Select.Option value="confirmed">Confirmed</Select.Option>
                            <Select.Option value="in_progress">In Progress</Select.Option>
                            <Select.Option value="completed">Completed</Select.Option>
                            <Select.Option value="cancelled">Cancelled</Select.Option>
                        </Select>
                    </Col>
                </Row>
            </Card>

            {/* Bookings Table */}
            <Card>
                <Table
                    columns={columns}
                    dataSource={filteredBookings}
                    loading={loading}
                    rowKey="_id"
                    pagination={{
                        pageSize: 10,
                        showTotal: (total) => `${total} bookings`,
                        showSizeChanger: true,
                    }}
                />
            </Card>

            {/* View Modal */}
            <Modal
                title="Booking Details"
                open={viewModalOpen}
                onCancel={() => {
                    setViewModalOpen(false);
                    setSelectedBooking(null);
                }}
                footer={null}
                width={600}
            >
                {selectedBooking && (
                    <div className="space-y-4">
                        <div>
                            <Text type="secondary">Service</Text>
                            <div className="font-medium">
                                {typeof selectedBooking.serviceId === 'object'
                                    ? selectedBooking.serviceId?.title
                                    : 'N/A'}
                            </div>
                        </div>
                        <div>
                            <Text type="secondary">Scheduled Date</Text>
                            <div>{new Date(selectedBooking.scheduledDate).toLocaleString()}</div>
                        </div>
                        <div>
                            <Text type="secondary">Duration</Text>
                            <div>{selectedBooking.duration} hours</div>
                        </div>
                        <div>
                            <Text type="secondary">Total Price</Text>
                            <div>${selectedBooking.totalPrice?.toLocaleString()}</div>
                        </div>
                        <div>
                            <Text type="secondary">Status</Text>
                            <div>
                                <Tag color={getStatusColor(selectedBooking.status)}>
                                    {selectedBooking.status.toUpperCase()}
                                </Tag>
                            </div>
                        </div>
                        <div>
                            <Text type="secondary">Payment Status</Text>
                            <div>
                                <Tag color={getPaymentStatusColor(selectedBooking.paymentStatus)}>
                                    {selectedBooking.paymentStatus?.toUpperCase() || 'N/A'}
                                </Tag>
                            </div>
                        </div>
                        {selectedBooking.notes && (
                            <div>
                                <Text type="secondary">Notes</Text>
                                <div>{selectedBooking.notes}</div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* Edit Modal */}
            <Modal
                title="Edit Booking"
                open={editModalOpen}
                onOk={() => form.submit()}
                onCancel={() => {
                    setEditModalOpen(false);
                    form.resetFields();
                    setSelectedBooking(null);
                }}
                confirmLoading={editLoading}
            >
                <Form form={form} layout="vertical" onFinish={handleUpdateBooking}>
                    <Form.Item name="scheduledDate" label="Scheduled Date">
                        <DatePicker showTime style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="duration" label="Duration (hours)">
                        <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="serviceLocation" label="Service Location">
                        <Input />
                    </Form.Item>
                    <Form.Item name="serviceAddress" label="Service Address">
                        <TextArea rows={2} />
                    </Form.Item>
                    <Form.Item name="notes" label="Notes">
                        <TextArea rows={3} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}

export default function BookingsPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        }>
            <BookingsPageContent />
        </Suspense>
    );
}
