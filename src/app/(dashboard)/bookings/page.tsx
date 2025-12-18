'use client';

import { useState, useEffect } from 'react';
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
import Spin from 'antd/es/spin';
import {
    CalendarOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    EyeOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined,
    StopOutlined,
} from '@ant-design/icons';
import { bookingsApi } from '@/services/api/bookings.api';
import type { Booking } from '@/types/dashboard';
import type { ColumnsType } from 'antd/es/table';
import { showToast } from '@/lib/toast';
import { useAuth } from '@/providers/AuthProvider';

const { Title, Text } = Typography;
const { Search } = Input;

export default function BookingsPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editLoading, setEditLoading] = useState(false);
    const [cancelLoading, setCancelLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [form] = Form.useForm();

    useEffect(() => {
        if (user) {
            fetchBookings();
        }
    }, [user]);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            let response;

            // Use role-based API endpoints
            if (user?.role === 'home_seeker') {
                // Home seekers see only their own bookings
                response = await bookingsApi.getMyBookings({ page: 1, limit: 100 });
            } else if (user?.role === 'service_provider') {
                // Service providers see bookings for their services
                response = await bookingsApi.getProviderBookings({ page: 1, limit: 100 });
            } else {
                // Admins, landlords, and agents see all bookings
                response = await bookingsApi.getAll({ page: 1, limit: 100 });
            }

            // Extract data from paginated response
            const bookingsData = (response as any)?.data?.data || response.data || [];
            setBookings(Array.isArray(bookingsData) ? bookingsData : []);
        } catch (error: any) {
            console.error('Failed to fetch bookings:', error);
            if (error.response?.status !== 404) {
                showToast.error('Failed to load bookings');
            }
            setBookings([]);
        } finally {
            setLoading(false);
        }
    };

    const handleView = (booking: Booking) => {
        setSelectedBooking(booking);
        setViewModalOpen(true);
    };

    const handleEdit = (booking: Booking) => {
        setSelectedBooking(booking);
        // Don't set the scheduledDate field - let user clear and re-pick it
        // This avoids DatePicker validation issues
        form.setFieldsValue({
            duration: booking.duration,
            contactPhone: booking.contactPhone,
            serviceLocation: booking.serviceLocation,
            serviceAddress: booking.serviceAddress,
            notes: booking.notes,
        });
        setEditModalOpen(true);
    };

    const handleEditSubmit = async (values: any) => {
        if (!selectedBooking) return;

        try {
            setEditLoading(true);
            const updateData: any = {
                duration: values.duration,
                contactPhone: values.contactPhone,
                serviceLocation: values.serviceLocation,
                serviceAddress: values.serviceAddress,
                notes: values.notes,
            };

            // Only include scheduledDate if it was modified
            if (values.scheduledDate) {
                updateData.scheduledDate = values.scheduledDate.toISOString ? values.scheduledDate.toISOString() : new Date(values.scheduledDate).toISOString();
            }

            await bookingsApi.update(selectedBooking._id, updateData);
            showToast.success('Booking updated successfully');
            setEditModalOpen(false);
            fetchBookings();
        } catch (error: any) {
            console.error('Failed to update booking:', error);
            showToast.error(error.response?.data?.message || 'Failed to update booking');
        } finally {
            setEditLoading(false);
        }
    };

    const handleCancel = (booking: Booking) => {
        Modal.confirm({
            title: 'Cancel Booking',
            content: 'Are you sure you want to cancel this booking? This action cannot be undone.',
            okText: 'Cancel Booking',
            okType: 'danger',
            onOk: async () => {
                try {
                    setCancelLoading(true);
                    await bookingsApi.cancel(booking._id, 'Cancelled by customer');
                    showToast.success('Booking cancelled successfully');
                    fetchBookings();
                } catch (error: any) {
                    console.error('Failed to cancel booking:', error);
                    showToast.error(error.response?.data?.message || 'Failed to cancel booking');
                } finally {
                    setCancelLoading(false);
                }
            },
        });
    };

    const handleDelete = (booking: Booking) => {
        Modal.confirm({
            title: 'Delete Booking',
            content: 'Are you sure you want to delete this booking?',
            okText: 'Delete',
            okType: 'danger',
            onOk: async () => {
                try {
                    await bookingsApi.delete(booking._id);
                    showToast.success('Booking deleted successfully');
                    fetchBookings();
                } catch (error: any) {
                    console.error('Failed to delete booking:', error);
                    showToast.error('Failed to delete booking');
                }
            },
        });
    };

    // Filter bookings
    const filteredBookings = bookings.filter(booking => {
        const matchesSearch = searchText === '' ||
            (typeof booking.serviceId === 'object' && booking.serviceId?.title?.toLowerCase().includes(searchText.toLowerCase()));
        const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const totalBookings = bookings.length;
    const pendingBookings = bookings.filter(b => b.status === 'pending').length;
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
    const totalRevenue = bookings
        .filter(b => b.status === 'completed' || b.status === 'confirmed')
        .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    const stats = [
        {
            title: 'Total Bookings',
            value: totalBookings,
            icon: <CalendarOutlined />,
            color: '#667eea',
            bgColor: '#667eea15',
        },
        {
            title: 'Confirmed',
            value: confirmedBookings,
            icon: <CheckCircleOutlined />,
            color: '#43e97b',
            bgColor: '#43e97b15',
        },
        {
            title: 'Pending',
            value: pendingBookings,
            icon: <ClockCircleOutlined />,
            color: '#ffa94d',
            bgColor: '#ffa94d15',
        },
        {
            title: 'Total Revenue',
            value: `$${totalRevenue.toLocaleString()}`,
            icon: <CheckCircleOutlined />,
            color: '#f093fb',
            bgColor: '#f093fb15',
        },
    ];

    const getStatusColor = (status: Booking['status']) => {
        switch (status) {
            case 'pending':
                return 'orange';
            case 'confirmed':
                return 'blue';
            case 'in_progress':
                return 'cyan';
            case 'completed':
                return 'green';
            case 'cancelled':
                return 'red';
            case 'rejected':
                return 'volcano';
            default:
                return 'default';
        }
    };

    const getStatusLabel = (status: Booking['status']) => {
        return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
    };

    const getPaymentStatusColor = (status: Booking['paymentStatus']) => {
        switch (status) {
            case 'completed':
                return 'green';
            case 'pending':
                return 'orange';
            case 'failed':
                return 'red';
            case 'refunded':
                return 'blue';
            default:
                return 'default';
        }
    };

    const formatLabel = (text: string) => {
        return text.charAt(0).toUpperCase() + text.slice(1).replace('_', ' ');
    };

    const columns: ColumnsType<Booking> = [
        {
            title: 'Service/Property',
            dataIndex: 'serviceId',
            key: 'serviceId',
            render: (service: any, record: Booking) => {
                // Check if it's a property booking (no serviceId but has serviceAddress)
                const isPropertyBooking = !service && record.serviceAddress;

                if (isPropertyBooking) {
                    return (
                        <div>
                            <div className="font-medium text-gray-900">Property Viewing</div>
                            <div className="text-sm text-gray-500">{record.serviceAddress}</div>
                        </div>
                    );
                }

                return (
                    <div>
                        <div className="font-medium text-gray-900">
                            {service && typeof service === 'object' ? service.title : 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                            {service && typeof service === 'object' && service.category ? service.category : ''}
                        </div>
                    </div>
                );
            },
        },
        {
            title: 'Scheduled Date',
            dataIndex: 'scheduledDate',
            key: 'scheduledDate',
            sorter: (a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime(),
            render: (date) => new Date(date).toLocaleDateString('en-US', {
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
            render: (duration) => `${duration} ${duration === 1 ? 'hour' : 'hours'}`,
        },
        {
            title: 'Customer',
            dataIndex: 'userId',
            key: 'userId',
            render: (user: any) => (
                <div>
                    <div className="font-medium text-gray-900">
                        {typeof user === 'object' ? user.name : 'N/A'}
                    </div>
                </div>
            ),
        },
        {
            title: 'Total Price',
            dataIndex: 'totalPrice',
            key: 'totalPrice',
            sorter: (a, b) => a.totalPrice - b.totalPrice,
            render: (price) => `$${price.toLocaleString()}`,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: Booking['status']) => (
                <Tag color={getStatusColor(status)}>{getStatusLabel(status)}</Tag>
            ),
        },
        {
            title: 'Created',
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
            width: 120,
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="View">
                        <Button
                            type="text"
                            icon={<EyeOutlined />}
                            onClick={() => handleView(record)}
                        />
                    </Tooltip>
                    {record.status === 'pending' && (
                        <Tooltip title="Edit">
                            <Button
                                type="text"
                                icon={<EditOutlined />}
                                onClick={() => handleEdit(record)}
                            />
                        </Tooltip>
                    )}
                    {['pending', 'confirmed'].includes(record.status) && (
                        <Tooltip title="Cancel">
                            <Button
                                type="text"
                                danger
                                icon={<StopOutlined />}
                                loading={cancelLoading}
                                onClick={() => handleCancel(record)}
                            />
                        </Tooltip>
                    )}
                    <Tooltip title="Delete">
                        <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleDelete(record)}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            {/* Modern Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <Title level={2} className="mb-1" style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        Bookings
                    </Title>
                    <Text type="secondary">Manage service bookings and appointments</Text>
                </div>
            </div>

            {/* Compact Statistics */}
            <Row gutter={[16, 16]}>
                {stats.map((stat, index) => (
                    <Col xs={12} sm={12} lg={6} key={index}>
                        <Card
                            className="hover:shadow-lg transition-all duration-300"
                            style={{
                                borderRadius: '12px',
                                border: '1px solid #f0f0f0',
                            }}
                            styles={{ body: { padding: '20px' } }}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                                        {stat.title}
                                    </Text>
                                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: stat.color }}>
                                        {stat.value}
                                    </div>
                                </div>
                                <div
                                    style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '12px',
                                        backgroundColor: stat.bgColor,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '24px',
                                        color: stat.color,
                                    }}
                                >
                                    {stat.icon}
                                </div>
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* Search and Filters */}
            <Card
                style={{
                    borderRadius: '12px',
                    border: '1px solid #f0f0f0',
                }}
                styles={{ body: { padding: '20px' } }}
            >
                <Row gutter={[16, 16]}>
                    <Col xs={24} md={16} lg={14}>
                        <Search
                            placeholder="Search bookings by service name..."
                            allowClear
                            size="large"
                            prefix={<SearchOutlined style={{ color: '#667eea' }} />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            style={{
                                borderRadius: '8px',
                            }}
                        />
                    </Col>
                    <Col xs={12} md={8} lg={6}>
                        <Select
                            size="large"
                            value={statusFilter}
                            onChange={setStatusFilter}
                            style={{ width: '100%', borderRadius: '8px' }}
                            placeholder="Status"
                        >
                            <Select.Option value="all">All Status</Select.Option>
                            <Select.Option value="pending">Pending</Select.Option>
                            <Select.Option value="confirmed">Confirmed</Select.Option>
                            <Select.Option value="in_progress">In Progress</Select.Option>
                            <Select.Option value="completed">Completed</Select.Option>
                            <Select.Option value="cancelled">Cancelled</Select.Option>
                            <Select.Option value="rejected">Rejected</Select.Option>
                        </Select>
                    </Col>
                    <Col xs={12} md={24} lg={4}>
                        <div className="flex items-center justify-end gap-2">
                            <Text type="secondary" style={{ fontSize: '14px' }}>
                                Showing {filteredBookings.length} of {bookings.length}
                            </Text>
                        </div>
                    </Col>
                </Row>
            </Card>

            {/* Bookings Table */}
            <Card
                style={{
                    borderRadius: '12px',
                    border: '1px solid #f0f0f0',
                }}
            >
                <Table
                    columns={columns}
                    dataSource={filteredBookings}
                    loading={loading}
                    rowKey="_id"
                    pagination={{
                        pageSize: 10,
                        showTotal: (total) => `Total ${total} bookings`,
                        showSizeChanger: true,
                    }}
                />
            </Card>

            {/* View Modal */}
            <Modal
                title={<div style={{ fontSize: '18px', fontWeight: 600 }}>Booking Details</div>}
                open={viewModalOpen}
                onCancel={() => setViewModalOpen(false)}
                footer={[
                    <Button key="close" size="large" onClick={() => setViewModalOpen(false)} style={{ borderRadius: '8px' }}>
                        Close
                    </Button>,
                ]}
                width={600}
            >
                {selectedBooking && (
                    <div className="space-y-4" style={{ marginTop: '20px' }}>
                        <div>
                            <Text type="secondary">Service/Property</Text>
                            <div className="font-medium">
                                {selectedBooking.serviceId && typeof selectedBooking.serviceId === 'object'
                                    ? selectedBooking.serviceId.title
                                    : selectedBooking.serviceAddress
                                        ? 'Property Viewing'
                                        : 'N/A'}
                            </div>
                            {selectedBooking.serviceAddress && (
                                <div className="text-sm text-gray-500 mt-1">
                                    {selectedBooking.serviceAddress}
                                </div>
                            )}
                        </div>
                        <div>
                            <Text type="secondary">Customer</Text>
                            <div className="font-medium">
                                {selectedBooking.userId && typeof selectedBooking.userId === 'object'
                                    ? selectedBooking.userId.name
                                    : 'N/A'}
                            </div>
                        </div>
                        <div>
                            <Text type="secondary">Scheduled Date</Text>
                            <div className="font-medium">
                                {new Date(selectedBooking.scheduledDate).toLocaleDateString('en-US', {
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </div>
                        </div>
                        <div>
                            <Text type="secondary">Duration</Text>
                            <div className="font-medium">{selectedBooking.duration} {selectedBooking.duration === 1 ? 'hour' : 'hours'}</div>
                        </div>
                        <div>
                            <Text type="secondary">Contact Phone</Text>
                            <div className="font-medium">{selectedBooking.contactPhone}</div>
                        </div>
                        {selectedBooking.serviceLocation && (
                            <div>
                                <Text type="secondary">Service Location</Text>
                                <div className="font-medium">{selectedBooking.serviceLocation}</div>
                            </div>
                        )}
                        {selectedBooking.serviceAddress && (
                            <div>
                                <Text type="secondary">Service Address</Text>
                                <div className="font-medium">{selectedBooking.serviceAddress}</div>
                            </div>
                        )}
                        <div>
                            <Text type="secondary">Total Price</Text>
                            <div className="font-medium text-lg">
                                ${selectedBooking.totalPrice.toLocaleString()}
                            </div>
                        </div>
                        <div>
                            <Text type="secondary">Status</Text>
                            <div>
                                <Tag color={getStatusColor(selectedBooking.status)}>
                                    {getStatusLabel(selectedBooking.status)}
                                </Tag>
                            </div>
                        </div>
                        <div>
                            <Text type="secondary">Payment Status</Text>
                            <div>
                                <Tag color={getPaymentStatusColor(selectedBooking.paymentStatus)}>
                                    {formatLabel(selectedBooking.paymentStatus as string)}
                                </Tag>
                            </div>
                        </div>
                        {selectedBooking.notes && (
                            <div>
                                <Text type="secondary">Notes</Text>
                                <div className="font-medium">{selectedBooking.notes}</div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* Edit Modal */}
            <Modal
                title={<div style={{ fontSize: '18px', fontWeight: 600 }}>Edit Booking</div>}
                open={editModalOpen}
                onCancel={() => setEditModalOpen(false)}
                width={600}
                footer={[
                    <Button key="cancel" onClick={() => setEditModalOpen(false)} style={{ borderRadius: '8px' }}>
                        Cancel
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        loading={editLoading}
                        onClick={() => form.submit()}
                        style={{ borderRadius: '8px' }}
                    >
                        Save Changes
                    </Button>,
                ]}
            >
                {selectedBooking && (
                    <Spin spinning={editLoading}>
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleEditSubmit}
                            style={{ marginTop: '20px' }}
                        >
                            <Form.Item label="Scheduled Date" name="scheduledDate" rules={[{ required: true }]}>
                                <DatePicker showTime style={{ width: '100%' }} />
                            </Form.Item>
                            <Form.Item label="Duration (hours)" name="duration" rules={[{ required: true }]}>
                                <InputNumber min={1} style={{ width: '100%' }} />
                            </Form.Item>
                            <Form.Item label="Contact Phone" name="contactPhone" rules={[{ required: true }]}>
                                <Input />
                            </Form.Item>
                            <Form.Item label="Service Location" name="serviceLocation">
                                <Input />
                            </Form.Item>
                            <Form.Item label="Service Address" name="serviceAddress">
                                <Input />
                            </Form.Item>
                            <Form.Item label="Notes" name="notes">
                                <TextArea rows={3} />
                            </Form.Item>
                        </Form>
                    </Spin>
                )}
            </Modal>
        </div>
    );
}
