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
import Select from 'antd/es/select';
import { PlusOutlined, TeamOutlined, TrophyOutlined, DollarCircleOutlined, StarOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { Column } from '@ant-design/plots';
import type { Agent } from '@/types/dashboard';
import { usersApi } from '@/services/api/users.api';
import type { User } from '@/types/users';

const { Title } = Typography;

export default function AgentsPage() {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch users (agents) on component mount
    useEffect(() => {
        fetchAgents();
    }, []);

    const fetchAgents = async () => {
        try {
            setLoading(true);
            const response = await usersApi.getAll({ userType: 'AGENT' });

            // Transform User data to Agent format
            const agentsData: Agent[] = (response.data.data || []).map((user: User) => ({
                _id: user._id,
                name: `${user.firstName} ${user.lastName}`,
                email: user.email,
                phone: user.phone || 'N/A',
                specialization: 'General',
                properties: 0,
                sales: 0,
                rating: 0,
                status: user.status === 'active' ? 'Active' : 'Inactive',
                createdAt: user.createdAt,
            }));

            setAgents(agentsData);
        } catch (error: any) {
            console.error('Failed to fetch agents:', error);
            message.error('Failed to load agents');
            setAgents([]);
        } finally {
            setLoading(false);
        }
    };

    const performanceData = agents.map(agent => ({
        name: agent.name.split(' ')[0],
        sales: agent.sales,
        properties: agent.properties,
    }));

    const chartConfig = {
        data: performanceData.flatMap(item => [
            { agent: item.name, value: item.sales, type: 'Sales' },
            { agent: item.name, value: item.properties, type: 'Properties' }
        ]),
        isGroup: true,
        xField: 'agent',
        yField: 'value',
        seriesField: 'type',
        color: ['#6366f1', '#3b82f6'],
        columnStyle: { radius: [4, 4, 0, 0] },
    };

    const columns = [
        {
            title: 'Agent',
            key: 'agent',
            render: (_: any, record: Agent) => (
                <Space>
                    <Avatar style={{ backgroundColor: '#6366f1' }} size="large">
                        {record.name.charAt(0)}
                    </Avatar>
                    <div>
                        <div className="font-medium">{record.name}</div>
                        <div className="text-sm text-gray-500">{record.email}</div>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Specialization',
            dataIndex: 'specialization',
            key: 'specialization',
            filters: [
                { text: 'Residential', value: 'Residential' },
                { text: 'Commercial', value: 'Commercial' },
                { text: 'Land', value: 'Land' },
                { text: 'Luxury', value: 'Luxury' },
            ],
            onFilter: (value: any, record: Agent) => record.specialization === value,
        },
        {
            title: 'Properties',
            dataIndex: 'properties',
            key: 'properties',
            sorter: (a: Agent, b: Agent) => a.properties - b.properties,
        },
        {
            title: 'Sales',
            dataIndex: 'sales',
            key: 'sales',
            sorter: (a: Agent, b: Agent) => a.sales - b.sales,
        },
        {
            title: 'Rating',
            dataIndex: 'rating',
            key: 'rating',
            render: (rating: number) => `${rating}/5 ⭐`,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            filters: [
                { text: 'Active', value: 'Active' },
                { text: 'Inactive', value: 'Inactive' },
            ],
            onFilter: (value: any, record: Agent) => record.status === value,
            render: (status: string) => (
                <Tag color={status === 'Active' ? 'green' : 'red'}>{status}</Tag>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: Agent) => (
                <Space size="small">
                    <Tooltip title="View">
                        <Button type="text" icon={<EyeOutlined />} />
                    </Tooltip>
                    <Tooltip title="Edit">
                        <Button type="text" icon={<EditOutlined />} />
                    </Tooltip>
                    <Tooltip title="Delete">
                        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => {
                            setAgents(agents.filter(a => a._id !== record._id));
                            message.success('Agent removed');
                        }} />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <Title level={3} className="mb-1">Agents</Title>
                    <p className="text-gray-500">Manage your property agents and team</p>
                </div>
                <Button type="primary" icon={<PlusOutlined />} size="large">Add Agent</Button>
            </div>

            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-gray-500 text-sm mb-2">Total Agents</p>
                                <Statistic value={agents.length} valueStyle={{ fontSize: '24px', fontWeight: 'bold' }} />
                            </div>
                            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#1890ff20' }}>
                                <TeamOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                            </div>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-gray-500 text-sm mb-2">Total Sales</p>
                                <Statistic value={agents.reduce((sum, a) => sum + a.sales, 0)} valueStyle={{ fontSize: '24px', fontWeight: 'bold' }} />
                            </div>
                            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#52c41a20' }}>
                                <TrophyOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                            </div>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-gray-500 text-sm mb-2">Total Properties</p>
                                <Statistic value={agents.reduce((sum, a) => sum + a.properties, 0)} valueStyle={{ fontSize: '24px', fontWeight: 'bold' }} />
                            </div>
                            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#ff950020' }}>
                                <DollarCircleOutlined style={{ fontSize: 24, color: '#ff9500' }} />
                            </div>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-gray-500 text-sm mb-2">Avg Rating</p>
                                <Statistic value={(agents.reduce((sum, a) => sum + a.rating, 0) / agents.length).toFixed(1)} suffix="/5" valueStyle={{ fontSize: '24px', fontWeight: 'bold' }} />
                            </div>
                            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#faad1420' }}>
                                <StarOutlined style={{ fontSize: 24, color: '#faad14' }} />
                            </div>
                        </div>
                    </Card>
                </Col>
            </Row>

            <Card title="Agent Performance" extra={<Select defaultValue="monthly" style={{ width: 120 }}><Select.Option value="monthly">Monthly</Select.Option><Select.Option value="yearly">Yearly</Select.Option></Select>}>
                <Column {...chartConfig} height={300} />
            </Card>

            <Card>
                <Table columns={columns} dataSource={agents} loading={loading} rowKey="_id" pagination={{ pageSize: 10, showTotal: (total) => `Total ${total} agents` }} />
            </Card>
        </div>
    );
}
