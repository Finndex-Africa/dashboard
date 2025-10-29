'use client';

import { useState, useEffect } from 'react';
import Card from 'antd/es/card';
import Row from 'antd/es/row';
import Col from 'antd/es/col';
import Select from 'antd/es/select';
import Typography from 'antd/es/typography';
import message from 'antd/es/message';
import Progress from 'antd/es/progress';
import Badge from 'antd/es/badge';
import Avatar from 'antd/es/avatar';
import {
    HomeOutlined,
    DollarOutlined,
    UserOutlined,
    ToolOutlined,
    RiseOutlined,
    FallOutlined,
    TrophyOutlined,
    CalendarOutlined,
} from '@ant-design/icons';
import { Line, Pie } from '@ant-design/plots';
import { propertiesApi } from '@/services/api/properties.api';
import { servicesApi } from '@/services/api/services.api';
import { usersApi } from '@/services/api/users.api';
import type { Property } from '@/types/dashboard';

const { Title, Text } = Typography;

export default function DashboardPage() {
    const [properties, setProperties] = useState<Property[]>([]);
    const [services, setServices] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let mounted = true;
        const fetchData = async () => {
            if (loading) return; // Prevent multiple simultaneous requests

            try {
                setLoading(true);
                const [propertiesRes, servicesRes, usersRes] = await Promise.all([
                    propertiesApi.getAll({ page: 1, limit: 100 }).catch(() => ({ data: { data: [] } })),
                    servicesApi.getAll({ page: 1, limit: 100 }).catch(() => ({ data: { data: [] } })),
                    usersApi.getAll({ page: 1, limit: 100 }).catch(() => ({ data: { data: [] } })),
                ]);

                if (!mounted) return;

                const propertiesData = propertiesRes.data?.data || [];
                const servicesData = servicesRes.data?.data || [];
                const usersData = usersRes.data?.data || [];

                setProperties(propertiesData);
                setServices(servicesData);
                setUsers(usersData);
            } catch (error: any) {
                if (!mounted) return;
                console.error('Failed to fetch dashboard data:', error);
                // Only show error for non-404 errors
                if (error.response?.status !== 404) {
                    message.error('Failed to load dashboard data');
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            mounted = false;
        };
    }, []); // Empty dependency array - only run once on mount

    const totalProperties = properties.length;
    const totalValue = properties.reduce((sum, p) => sum + (p.price || 0), 0);
    const totalServices = services.length;
    const totalUsers = users.length;

    const statsConfig = [
        {
            title: 'Total Properties',
            value: totalProperties,
            change: 12.5,
            IconComponent: HomeOutlined,
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            bgColor: '#667eea10',
        },
        {
            title: 'Portfolio Value',
            value: totalValue,
            prefix: '$',
            change: 8.2,
            IconComponent: DollarOutlined,
            gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            bgColor: '#f093fb10',
        },
        {
            title: 'Active Services',
            value: totalServices,
            change: 15.3,
            IconComponent: ToolOutlined,
            gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            bgColor: '#4facfe10',
        },
        {
            title: 'Total Users',
            value: totalUsers,
            change: 23.1,
            IconComponent: UserOutlined,
            gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            bgColor: '#43e97b10',
        },
    ];

    const revenueData = [
        { month: 'Jan', value: 45000 },
        { month: 'Feb', value: 52000 },
        { month: 'Mar', value: 48000 },
        { month: 'Apr', value: 61000 },
        { month: 'May', value: 55000 },
        { month: 'Jun', value: 67000 },
        { month: 'Jul', value: 71000 },
        { month: 'Aug', value: 69000 },
        { month: 'Sep', value: 78000 },
        { month: 'Oct', value: 82000 },
        { month: 'Nov', value: 75000 },
        { month: 'Dec', value: 85000 },
    ];

    const propertyTypeData = [
        { type: 'Apartments', value: 45 },
        { type: 'Houses', value: 38 },
        { type: 'Commercial', value: 32 },
        { type: 'Land', value: 25 },
        { type: 'Other', value: 16 },
    ];

    const revenueConfig = {
        data: revenueData,
        xField: 'month',
        yField: 'value',
        smooth: true,
        color: '#667eea',
        areaStyle: {
            fill: 'l(270) 0:#ffffff 0.5:#667eea30 1:#667eea',
        },
        line: {
            size: 3,
        },
        point: {
            size: 5,
            shape: 'circle',
            style: {
                fill: 'white',
                stroke: '#667eea',
                lineWidth: 2,
            },
        },
    };

    const pieConfig = {
        data: propertyTypeData,
        angleField: 'value',
        colorField: 'type',
        radius: 0.8,
        innerRadius: 0.6,
        label: {
            type: 'inner',
            offset: '-30%',
            content: '{value}',
            style: {
                fontSize: 14,
                textAlign: 'center',
            },
        },
        statistic: {
            title: false,
            content: {
                style: {
                    fontSize: '24px',
                    fontWeight: 'bold',
                },
                content: totalProperties.toString(),
            },
        },
        color: ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b'],
    };

    return (
        <div className="space-y-6 p-2">
            {/* Modern Header */}
            <div className="flex justify-between items-center">
                <div>
                    <Title level={2} className="mb-0" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Dashboard Overview
                    </Title>
                    <Text type="secondary" className="text-base">Welcome back! Here's what's happening with your properties today.</Text>
                </div>
                <Select defaultValue="today" size="large" style={{ width: 150 }}>
                    <Select.Option value="today">Today</Select.Option>
                    <Select.Option value="week">This Week</Select.Option>
                    <Select.Option value="month">This Month</Select.Option>
                    <Select.Option value="year">This Year</Select.Option>
                </Select>
            </div>

            {/* Modern Compact Statistics Cards */}
            <Row gutter={[16, 16]}>
                {statsConfig.map((stat, index) => {
                    const Icon = stat.IconComponent;
                    return (
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
                                        <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
                                            {stat.prefix}{stat.value.toLocaleString()}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {stat.change > 0 ? (
                                                <>
                                                    <RiseOutlined style={{ color: '#52c41a', fontSize: '14px' }} />
                                                    <span style={{ color: '#52c41a', fontWeight: 600, fontSize: '13px' }}>{stat.change}%</span>
                                                </>
                                            ) : (
                                                <>
                                                    <FallOutlined style={{ color: '#ff4d4f', fontSize: '14px' }} />
                                                    <span style={{ color: '#ff4d4f', fontWeight: 600, fontSize: '13px' }}>{Math.abs(stat.change)}%</span>
                                                </>
                                            )}
                                            <Text type="secondary" style={{ fontSize: '12px', marginLeft: '4px' }}>vs last month</Text>
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
                                        }}
                                    >
                                        <span style={{
                                            background: stat.gradient,
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                            fontSize: '24px',
                                        }}>
                                            <Icon />
                                        </span>
                                    </div>
                                </div>
                            </Card>
                        </Col>
                    );
                })}
            </Row>

            {/* Charts Section */}
            <Row gutter={[24, 24]}>
                {/* Revenue Trend */}
                <Col xs={24} lg={16}>
                    <Card
                        title={
                            <div className="flex items-center gap-2">
                                <TrophyOutlined style={{ fontSize: '20px', color: '#667eea' }} />
                                <Text strong style={{ fontSize: '18px' }}>Revenue Trend</Text>
                            </div>
                        }
                        extra={
                            <Select defaultValue="2024" style={{ width: 100 }}>
                                <Select.Option value="2024">2024</Select.Option>
                                <Select.Option value="2023">2023</Select.Option>
                            </Select>
                        }
                        style={{ borderRadius: '16px', border: 'none' }}
                        className="shadow-lg"
                    >
                        <Line {...revenueConfig} height={320} />
                        <Row gutter={16} className="mt-6 pt-4 border-t">
                            <Col span={8} className="text-center">
                                <Text type="secondary">Average</Text>
                                <div className="mt-1">
                                    <Text strong className="text-xl">$65,167</Text>
                                </div>
                            </Col>
                            <Col span={8} className="text-center">
                                <Text type="secondary">Highest</Text>
                                <div className="mt-1">
                                    <Text strong className="text-xl" style={{ color: '#52c41a' }}>$85,000</Text>
                                </div>
                            </Col>
                            <Col span={8} className="text-center">
                                <Text type="secondary">Lowest</Text>
                                <div className="mt-1">
                                    <Text strong className="text-xl" style={{ color: '#faad14' }}>$45,000</Text>
                                </div>
                            </Col>
                        </Row>
                    </Card>
                </Col>

                {/* Property Distribution */}
                <Col xs={24} lg={8}>
                    <Card
                        title={
                            <div className="flex items-center gap-2">
                                <HomeOutlined style={{ fontSize: '20px', color: '#667eea' }} />
                                <Text strong style={{ fontSize: '18px' }}>Property Types</Text>
                            </div>
                        }
                        style={{ borderRadius: '16px', border: 'none' }}
                        className="shadow-lg"
                    >
                        <Pie {...pieConfig} height={320} />
                        <div className="mt-4 space-y-2">
                            {propertyTypeData.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <div style={{
                                            width: '12px',
                                            height: '12px',
                                            borderRadius: '50%',
                                            background: ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b'][idx],
                                        }} />
                                        <Text>{item.type}</Text>
                                    </div>
                                    <Text strong>{item.value}</Text>
                                </div>
                            ))}
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* Bottom Section */}
            <Row gutter={[24, 24]}>
                {/* Top Properties */}
                <Col xs={24} lg={12}>
                    <Card
                        title={
                            <div className="flex items-center gap-2">
                                <TrophyOutlined style={{ fontSize: '20px', color: '#f5576c' }} />
                                <Text strong style={{ fontSize: '18px' }}>Top Performing Properties</Text>
                            </div>
                        }
                        style={{ borderRadius: '16px', border: 'none' }}
                        className="shadow-lg"
                    >
                        <div className="space-y-4">
                            {[
                                { name: 'Karen Luxury Villa', location: 'Karen, Nairobi', value: 125000, performance: 95 },
                                { name: 'Westlands Penthouse', location: 'Westlands', value: 98000, performance: 88 },
                                { name: 'Kilimani Apartment', location: 'Kilimani', value: 85000, performance: 82 },
                                { name: 'Runda Estate', location: 'Runda', value: 156000, performance: 78 },
                                { name: 'CBD Office Space', location: 'Central', value: 210000, performance: 92 },
                            ].map((prop, idx) => (
                                <div key={idx} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                    <Avatar size={48} style={{ background: `linear-gradient(135deg, ${['#667eea', '#f093fb', '#4facfe', '#43e97b', '#ffa94d'][idx]} 0%, ${['#764ba2', '#f5576c', '#00f2fe', '#38f9d7', '#ff6b6b'][idx]} 100%)` }}>
                                        {idx + 1}
                                    </Avatar>
                                    <div className="flex-1">
                                        <Text strong className="block">{prop.name}</Text>
                                        <Text type="secondary" className="text-sm">{prop.location}</Text>
                                    </div>
                                    <div className="text-right">
                                        <Text strong className="block">${prop.value.toLocaleString()}</Text>
                                        <Progress percent={prop.performance} size="small" strokeColor="#52c41a" showInfo={false} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </Col>

                {/* Recent Activity */}
                <Col xs={24} lg={12}>
                    <Card
                        title={
                            <div className="flex items-center gap-2">
                                <CalendarOutlined style={{ fontSize: '20px', color: '#4facfe' }} />
                                <Text strong style={{ fontSize: '18px' }}>Recent Activity</Text>
                            </div>
                        }
                        style={{ borderRadius: '16px', border: 'none' }}
                        className="shadow-lg"
                    >
                        <div className="space-y-3">
                            {[
                                { action: 'New property listed', detail: 'Karen Luxury Villa', time: '2 mins ago', status: 'success' },
                                { action: 'Booking confirmed', detail: 'Westlands Apartment #304', time: '15 mins ago', status: 'info' },
                                { action: 'Payment received', detail: '$125,000 from John Doe', time: '1 hour ago', status: 'success' },
                                { action: 'New inquiry', detail: 'Office Space CBD', time: '2 hours ago', status: 'warning' },
                                { action: 'Property viewed', detail: 'Kilimani Penthouse', time: '3 hours ago', status: 'default' },
                                { action: 'Service completed', detail: 'Plumbing - Runda Estate', time: '4 hours ago', status: 'success' },
                                { action: 'Review submitted', detail: '5 stars for Karen Villa', time: '5 hours ago', status: 'success' },
                            ].map((activity, idx) => (
                                <div key={idx} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                    <Badge status={activity.status as any} />
                                    <div className="flex-1">
                                        <Text strong className="block">{activity.action}</Text>
                                        <Text type="secondary" className="text-sm">{activity.detail}</Text>
                                    </div>
                                    <Text type="secondary" className="text-xs whitespace-nowrap">{activity.time}</Text>
                                </div>
                            ))}
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
