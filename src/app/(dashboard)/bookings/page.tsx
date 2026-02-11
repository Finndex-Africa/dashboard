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
import Avatar from 'antd/es/avatar';
import Space from 'antd/es/space';
import Tooltip from 'antd/es/tooltip';
import Modal from 'antd/es/modal';
import Input from 'antd/es/input';
import Select from 'antd/es/select';
import {
    UserOutlined,
    TeamOutlined,
    HomeOutlined,
    ToolOutlined,
    SearchOutlined,
    EyeOutlined,
    EditOutlined,
    DeleteOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
} from '@ant-design/icons';
import { Column } from '@ant-design/plots';
import { usersApi } from '@/services/api/users.api';
import type { User } from '@/types/users';
import { useAuth } from '@/providers/AuthProvider';

const { Title, Text } = Typography;

export default function UsersPage() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [verificationFilter, setVerificationFilter] = useState<string>('all');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            
            // Fetch ALL users by fetching all pages for accurate statistics
            // Backend controller returns: { success: true, data: [...], pagination: {...} }
            // API client returns: { success: true, data: [...], pagination: {...} } (same structure)
            let allUsers: User[] = [];
            let currentPage = 1;
            let hasMorePages = true;
            const pageSize = 100; // Fetch 100 at a time
            
            while (hasMorePages) {
                const response = await usersApi.getAll({ page: currentPage, limit: pageSize });
                
                // Backend returns: { success: true, data: User[], pagination: {...} }
                // Handle both possible structures (direct array or nested)
                let pageUsers: User[] = [];
                
                if (Array.isArray(response.data)) {
                    // Direct array structure (backend format)
                    pageUsers = response.data;
                } else if (response.data?.data && Array.isArray(response.data.data)) {
                    // Nested structure (if wrapped)
                    pageUsers = response.data.data;
                } else {
                    // Fallback
                    pageUsers = [];
                }
                
                allUsers = [...allUsers, ...pageUsers];
                
                // Check pagination - backend returns pagination at root level
                const pagination = (response as any).pagination || response.data?.pagination;
                if (pagination) {
                    hasMorePages = currentPage < pagination.totalPages;
                    currentPage++;
                } else {
                    // If no pagination info, stop if we got fewer than pageSize results
                    hasMorePages = pageUsers.length === pageSize;
                    currentPage++;
                }
                
                // Safety limit to prevent infinite loops
                if (currentPage > 100) {
                    console.warn('Reached safety limit of 100 pages while fetching users');
                    break;
                }
            }
            
            setUsers(allUsers);
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || error.message || 'Failed to load users';
            message.error(errorMsg);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleView = (user: User) => {
        setSelectedUser(user);
        setViewModalOpen(true);
    };

    const handleDelete = (user: User) => {
        Modal.confirm({
            title: 'Delete User',
            content: `Are you sure you want to delete ${user.firstName} ${user.lastName}?`,
            okText: 'Delete',
            okType: 'danger',
            onOk: async () => {
                try {
                    await usersApi.delete(user._id);
                    message.success('User deleted successfully');
                    fetchUsers();
                } catch (error: any) {
                    message.error('Failed to delete user');
                }
            },
        });
    };

    const handleToggleVerification = async (user: User) => {
        // Check if current user is admin
        if (currentUser?.role !== 'admin') {
            message.error('Only administrators can verify or unverify users');
            return;
        }

        try {
            if (user.verified) {
                await usersApi.unverify(user._id);
                message.success(`${user.firstName} ${user.lastName} has been unverified`);
            } else {
                await usersApi.verify(user._id);
                message.success(`${user.firstName} ${user.lastName} has been verified`);
            }
            fetchUsers();
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update verification status';
            message.error(errorMessage);
        }
    };

    // Helper functions for role display
    const getRoleColor = (role: User['userType']) => {
        switch (role) {
            case 'admin': return 'red';
            case 'landlord': return 'blue';
            case 'agent': return 'green';
            case 'service_provider': return 'orange';
            case 'home_seeker': return 'blue';
            default: return 'default';
        }
    };

    const getRoleLabel = (role: User['userType']) => {
        switch (role) {
            case 'admin': return 'Admin';
            case 'landlord': return 'Landlord';
            case 'agent': return 'Agent';
            case 'service_provider': return 'Service Provider';
            case 'home_seeker': return 'Home Seeker';
            default: return role;
        }
    };

    // Filter users based on search term and verification status
    const filteredUsers = users.filter(user => {
        // Search filter
        if (searchTerm.trim()) {
            const search = searchTerm.toLowerCase();
            const matchesSearch = (
                user.firstName?.toLowerCase().includes(search) ||
                user.lastName?.toLowerCase().includes(search) ||
                user.email?.toLowerCase().includes(search) ||
                user.phone?.toLowerCase().includes(search) ||
                getRoleLabel(user.userType).toLowerCase().includes(search)
            );
            if (!matchesSearch) return false;
        }

        // Verification filter
        if (verificationFilter !== 'all') {
            if (verificationFilter === 'verified' && !user.verified) return false;
            if (verificationFilter === 'not_verified' && user.verified) return false;
        }

        return true;
    });

    const totalUsers = users.length;
    const adminUsers = users.filter(u => u.userType === 'admin').length;
    const landlordUsers = users.filter(u => u.userType === 'landlord').length;
    const agentUsers = users.filter(u => u.userType === 'agent').length;
    const serviceProviderUsers = users.filter(u => u.userType === 'service_provider').length;
    const homeSeekerUsers = users.filter(u => u.userType === 'home_seeker').length;
    const verifiedUsers = users.filter(u => u.verified).length;
    const activeUsers = users.filter(u => u.status === 'active').length;

    const columns = [
        {
            title: 'User',
            key: 'user',
            render: (_: any, record: User) => (
                <Space>
                    <Avatar style={{ backgroundColor: '#0000FF' }} size="large">
                        {(record.firstName || 'U').charAt(0)}{(record.lastName || 'N').charAt(0)}
                    </Avatar>
                    <div>
                        <div className="font-medium">{record.firstName || ''} {record.lastName || 'Unknown'}</div>
                        <div className="text-sm text-gray-500">{record.email}</div>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Phone',
            dataIndex: 'phone',
            key: 'phone',
            render: (phone: string) => phone || 'N/A',
        },
        {
            title: 'Role',
            dataIndex: 'userType',
            key: 'userType',
            filters: [
                { text: 'admin', value: 'admin' },
                { text: 'Landlord', value: 'landlord' },
                { text: 'Agent', value: 'agent' },
                { text: 'Service_rovider', value: 'service_provider' },
                { text: 'Home Seeker', value: 'home_seeker' },
            ],
            onFilter: (value: any, record: User) => record.userType === value,
            render: (role: User['userType']) => (
                <Tag color={getRoleColor(role)}>{getRoleLabel(role)}</Tag>
            ),
        },
        {
            title: 'Verified',
            dataIndex: 'verified',
            key: 'verified',
            filters: [
                { text: 'Verified', value: true },
                { text: 'Not Verified', value: false },
            ],
            onFilter: (value: any, record: User) => record.verified === value,
            render: (verified: boolean) => (
                <Tag color={verified ? 'green' : 'orange'} icon={verified ? <CheckCircleOutlined /> : <CloseCircleOutlined />}>
                    {verified ? 'Verified' : 'Not Verified'}
                </Tag>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            filters: [
                { text: 'Active', value: "active" },
                { text: 'Inactive', value: "inactive" },
            ],
            onFilter: (value: any, record: User) => record.status === value,
            render: (status: string) => (
                <Tag color={status === 'active' ? 'green' : 'red'}>{status === 'active' ? 'Active' : 'Inactive'}</Tag>
            ),
        },
        {
            title: 'Created',
            dataIndex: 'createdAt',
            key: 'createdAt',
            sorter: (a: User, b: User) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
            render: (date: string) => new Date(date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            }),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: User) => {
                const isAdmin = currentUser?.role === 'admin';

                return (
                    <Space size="small">
                        {isAdmin && (
                            <Tooltip title={record.verified ? 'Unverify User' : 'Verify User'}>
                                <Button
                                    type="text"
                                    icon={record.verified ? <CloseCircleOutlined /> : <CheckCircleOutlined />}
                                    onClick={() => handleToggleVerification(record)}
                                    style={{ color: record.verified ? '#fa8c16' : '#52c41a' }}
                                />
                            </Tooltip>
                        )}
                        <Tooltip title="View">
                            <Button type="text" icon={<EyeOutlined />} onClick={() => handleView(record)} />
                        </Tooltip>
                        <Tooltip title="Edit">
                            <Button type="text" icon={<EditOutlined />} onClick={() => message.info('Edit functionality coming soon')} />
                        </Tooltip>
                        {isAdmin && (
                            <Tooltip title="Delete">
                                <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)} />
                            </Tooltip>
                        )}
                    </Space>
                );
            },
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <Title level={3} className="mb-1">Users</Title>
                    <Text type="secondary">Manage users and view user statistics by type</Text>
                </div>
            </div>

            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="h-full">
                        <div className="flex items-start justify-between h-full">
                            <div className="flex-1">
                                <p className="text-gray-500 text-sm mb-2">Total Users</p>
                                <Statistic value={totalUsers} valueStyle={{ fontSize: '24px', fontWeight: 'bold' }} />
                            </div>
                            <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#0000FF20' }}>
                                <UserOutlined style={{ fontSize: 24, color: '#0000FF' }} />
                            </div>
                        </div>
                    </Card>
                </Col>

                <Col xs={24} sm={12} lg={6}>
                    <Card className="h-full">
                        <div className="flex items-start justify-between h-full">
                            <div className="flex-1">
                                <p className="text-gray-500 text-sm mb-2">Verified Users</p>
                                <Statistic value={verifiedUsers} valueStyle={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }} />
                            </div>
                            <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#52c41a20' }}>
                                <CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                            </div>
                        </div>
                    </Card>
                </Col>

                <Col xs={24} sm={12} lg={6}>
                    <Card className="h-full">
                        <div className="flex items-start justify-between h-full">
                            <div className="flex-1">
                                <p className="text-gray-500 text-sm mb-2">Active Users</p>
                                <Statistic value={activeUsers} valueStyle={{ fontSize: '24px', fontWeight: 'bold', color: '#0000FF' }} />
                            </div>
                            <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#0000FF20' }}>
                                <UserOutlined style={{ fontSize: 24, color: '#0000FF' }} />
                            </div>
                        </div>
                    </Card>
                </Col>

                <Col xs={24} sm={12} lg={6}>
                    <Card className="h-full">
                        <div className="flex items-start justify-between h-full">
                            <div className="flex-1">
                                <p className="text-gray-500 text-sm mb-2">Agents</p>
                                <Statistic value={agentUsers} valueStyle={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }} />
                            </div>
                            <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#52c41a20' }}>
                                <TeamOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                            </div>
                        </div>
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={8}>
                    <Card className="h-full">
                        <div className="flex items-start justify-between h-full">
                            <div className="flex-1">
                                <p className="text-gray-500 text-sm mb-2">Landlords</p>
                                <Statistic value={landlordUsers} valueStyle={{ fontSize: '20px', fontWeight: 'bold', color: '#0000FF' }} />
                            </div>
                            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#0000FF20' }}>
                                <HomeOutlined style={{ fontSize: 20, color: '#0000FF' }} />
                            </div>
                        </div>
                    </Card>
                </Col>

                <Col xs={24} sm={12} lg={8}>
                    <Card className="h-full">
                        <div className="flex items-start justify-between h-full">
                            <div className="flex-1">
                                <p className="text-gray-500 text-sm mb-2">Service Providers</p>
                                <Statistic value={serviceProviderUsers} valueStyle={{ fontSize: '20px', fontWeight: 'bold', color: '#fa8c16' }} />
                            </div>
                            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#fa8c1620' }}>
                                <ToolOutlined style={{ fontSize: 20, color: '#fa8c16' }} />
                            </div>
                        </div>
                    </Card>
                </Col>

                <Col xs={24} sm={12} lg={8}>
                    <Card className="h-full">
                        <div className="flex items-start justify-between h-full">
                            <div className="flex-1">
                                <p className="text-gray-500 text-sm mb-2">Home Seekers</p>
                                <Statistic value={homeSeekerUsers} valueStyle={{ fontSize: '20px', fontWeight: 'bold', color: '#722ed1' }} />
                            </div>
                            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#722ed120' }}>
                                <SearchOutlined style={{ fontSize: 20, color: '#722ed1' }} />
                            </div>
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* Search and Filters */}
            <Card>
                <Row gutter={[16, 16]}>
                    <Col xs={24} md={16}>
                        <Input
                            placeholder="Search by name, email, phone, or role..."
                            allowClear
                            size="large"
                            prefix={<SearchOutlined />}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </Col>
                    <Col xs={24} md={8}>
                        <Select
                            size="large"
                            value={verificationFilter}
                            onChange={setVerificationFilter}
                            style={{ width: '100%' }}
                        >
                            <Select.Option value="all">All Users</Select.Option>
                            <Select.Option value="verified">Verified</Select.Option>
                            <Select.Option value="not_verified">Not Verified</Select.Option>
                        </Select>
                    </Col>
                </Row>
            </Card>

            {/* Users Table */}
            <Card>
                <Table
                    columns={columns}
                    dataSource={filteredUsers}
                    loading={loading}
                    rowKey="_id"
                    pagination={{
                        pageSize: 10,
                        showTotal: (total) => `Total ${total} user${total !== 1 ? 's' : ''}`,
                        showSizeChanger: true
                    }}
                />
            </Card>

            <Modal title="User Details" open={viewModalOpen} onCancel={() => setViewModalOpen(false)} footer={[<Button key="close" onClick={() => setViewModalOpen(false)}>Close</Button>]} width={600}>
                {selectedUser && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <Avatar size={64} style={{ backgroundColor: '#0000FF' }}>
                                {(selectedUser.firstName || 'U').charAt(0)}{(selectedUser.lastName || 'N').charAt(0)}
                            </Avatar>
                            <div>
                                <div className="text-xl font-bold">{selectedUser.firstName || ''} {selectedUser.lastName || 'Unknown'}</div>
                                <div className="text-gray-500">{selectedUser.email}</div>
                            </div>
                        </div>
                        <div><Text type="secondary">Phone Number</Text><div className="font-medium">{selectedUser.phone || 'N/A'}</div></div>
                        <div><Text type="secondary">Role</Text><div><Tag color={getRoleColor(selectedUser.userType)}>{getRoleLabel(selectedUser.userType)}</Tag></div></div>
                        <div><Text type="secondary">Verification Status</Text><div><Tag color={selectedUser.verified ? 'green' : 'orange'} icon={selectedUser.verified ? <CheckCircleOutlined /> : <CloseCircleOutlined />}>{selectedUser.verified ? 'Verified' : 'Not Verified'}</Tag></div></div>
                        <div><Text type="secondary">Account Status</Text><div><Tag color={selectedUser.status === 'active' ? 'green' : 'red'}>{selectedUser.status === 'active' ? 'Active' : 'Inactive'}</Tag></div></div>
                        <div><Text type="secondary">Created</Text><div className="font-medium">{new Date(selectedUser.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div></div>
                        <div><Text type="secondary">Last Updated</Text><div className="font-medium">{selectedUser.updatedAt ? new Date(selectedUser.updatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}</div></div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
