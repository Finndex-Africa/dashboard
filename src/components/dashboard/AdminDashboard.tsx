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
import Button from 'antd/es/button';
import Collapse from 'antd/es/collapse';
import { propertiesApi } from '@/services/api/properties.api';
import { servicesApi } from '@/services/api/services.api';
import { usersApi } from '@/services/api/users.api';
import { notificationsApi } from '@/services/api/notifications.api';
import type { Property } from '@/types/dashboard';

const { Title, Text } = Typography;

// Helper functions
function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} mins ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

function getNotificationStatus(type: string): 'success' | 'info' | 'warning' | 'error' | 'default' {
    const statusMap: Record<string, 'success' | 'info' | 'warning' | 'error' | 'default'> = {
        'property_approved': 'success',
        'property_rejected': 'error',
        'booking_confirmed': 'success',
        'payment_received': 'success',
        'new_inquiry': 'warning',
        'property_viewed': 'default',
        'service_completed': 'success',
        'review_submitted': 'info',
    };
    return statusMap[type] || 'default';
}

export default function AdminDashboard() {
    const [properties, setProperties] = useState<Property[]>([]);
    const [services, setServices] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [rawResponses, setRawResponses] = useState<any>(null);
    const [rawError, setRawError] = useState<any>(null);

    useEffect(() => {
        let mounted = true;

        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch data with simple pagination
                const [propertiesResponse, servicesResponse, usersResponse, notificationsResponse] = await Promise.all([
                    propertiesApi.getAll({ page: 1, limit: 100 }).catch((e) => ({ data: [], __error: e })),
                    servicesApi.getAll({ page: 1, limit: 100 }).catch((e) => ({ data: [], __error: e })),
                    usersApi.getAll({ page: 1, limit: 100 }).catch((e) => ({ data: [], __error: e })),
                    notificationsApi.getAll({ limit: 50 }).catch((e) => ({ data: [], __error: e }))
                ]);

                if (!mounted) return;

                setRawResponses({
                    propertiesResponse,
                    servicesResponse,
                    usersResponse,
                    notificationsResponse,
                });

                // Extract data from paginated responses
                const propertiesData = (propertiesResponse as any)?.data?.data || propertiesResponse.data || [];
                const servicesData = (servicesResponse as any)?.data?.data || servicesResponse.data || [];
                const usersData = (usersResponse as any)?.data?.data || usersResponse.data || [];
                const notificationsData = (notificationsResponse as any)?.data?.data || notificationsResponse.data || [];

                setProperties(Array.isArray(propertiesData) ? propertiesData : []);
                setServices(Array.isArray(servicesData) ? servicesData : []);
                setUsers(Array.isArray(usersData) ? usersData : []);
                setNotifications(Array.isArray(notificationsData) ? notificationsData : []);
            } catch (error: any) {
                if (!mounted) return;
                console.error('Failed to fetch dashboard data:', error);
                setRawError({ message: error?.message, response: error?.response?.data || null });
                // Set empty arrays on error
                setProperties([]);
                setServices([]);
                setUsers([]);
                setNotifications([]);
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
    }, []);

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

    // Generate monthly trend data
    const generateMonthlyData = () => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentYear = new Date().getFullYear();

        return months.map((month, index) => {
            const monthProperties = properties.filter(p => {
                const date = new Date(p.createdAt);
                return date.getMonth() === index && date.getFullYear() === currentYear;
            });
            const monthServices = services.filter(s => {
                const date = new Date(s.createdAt);
                return date.getMonth() === index && date.getFullYear() === currentYear;
            });
            const monthUsers = users.filter(u => {
                const date = new Date(u.createdAt);
                return date.getMonth() === index && date.getFullYear() === currentYear;
            });

            return {
                month,
                properties: monthProperties.length,
                services: monthServices.length,
                users: monthUsers.length,
            };
        });
    };

    const monthlyData = generateMonthlyData();

    // Property type distribution
    const propertyTypeCounts: Record<string, number> = {};
    properties.forEach(p => {
        const type = p.propertyType || 'Other';
        propertyTypeCounts[type] = (propertyTypeCounts[type] || 0) + 1;
    });

    const propertyTypeData = Object.entries(propertyTypeCounts)
        .map(([type, value]) => ({
            type: type.charAt(0).toUpperCase() + type.slice(1),
            value,
        }))
        .sort((a, b) => b.value - a.value);

    // Top performing properties
    const topProperties = properties
        .map(p => ({
            ...p,
            performance: (p.views || 0) + (p.inquiries || 0) * 5,
        }))
        .sort((a, b) => b.performance - a.performance)
        .slice(0, 5);

    // Recent activity
    const recentActivity = notifications.slice(0, 7).map(notif => ({
        action: notif.title || 'Activity',
        detail: notif.message || '',
        time: formatTimeAgo(notif.createdAt),
        status: getNotificationStatus(notif.type),
    }));

    const trendConfig = {
        data: monthlyData.flatMap(d => [
            { month: d.month, value: d.properties, category: 'Properties' },
            { month: d.month, value: d.services, category: 'Services' },
            { month: d.month, value: d.users, category: 'Users' },
        ]),
        xField: 'month',
        yField: 'value',
        seriesField: 'category',
        smooth: true,
        color: ['#667eea', '#4facfe', '#43e97b'],
        legend: { position: 'top' as const },
        lineStyle: { lineWidth: 3 },
        point: {
            size: 5,
            shape: 'circle',
            style: { fill: 'white', lineWidth: 2 },
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
            style: { fontSize: 14, textAlign: 'center' },
        },
        statistic: {
            title: false,
            content: {
                style: { fontSize: '24px', fontWeight: 'bold' },
                content: totalProperties.toString(),
            },
        },
        color: ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b'],
    };

    return (
        <div className="space-y-6 p-2">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <Title level={2} className="mb-0" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Dashboard Overview
                    </Title>
                    <Text type="secondary" className="text-base">Welcome back! Here's what's happening with your platform today.</Text>
                </div>
                <Select defaultValue="today" size="large" style={{ width: 150 }}>
                    <Select.Option value="today">Today</Select.Option>
                    <Select.Option value="week">This Week</Select.Option>
                    <Select.Option value="month">This Month</Select.Option>
                    <Select.Option value="year">This Year</Select.Option>
                </Select>
            </div>

            {/* Stats Cards */}
            <Row gutter={[16, 16]}>
                {statsConfig.map((stat, index) => {
                    const Icon = stat.IconComponent;
                    return (
                        <Col xs={12} sm={12} lg={6} key={index}>
                            <Card
                                className="hover:shadow-lg transition-all duration-300"
                                style={{ borderRadius: '12px', border: '1px solid #f0f0f0' }}
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

            {/* Charts */}
            <Row gutter={[24, 24]}>
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
                        <Line {...trendConfig} height={320} />
                        <Row gutter={16} className="mt-6 pt-4 border-t">
                            <Col span={8} className="text-center">
                                <Text type="secondary">Properties</Text>
                                <div className="mt-1">
                                    <Text strong className="text-xl" style={{ color: '#667eea' }}>{totalProperties}</Text>
                                </div>
                            </Col>
                            <Col span={8} className="text-center">
                                <Text type="secondary">Services</Text>
                                <div className="mt-1">
                                    <Text strong className="text-xl" style={{ color: '#4facfe' }}>{totalServices}</Text>
                                </div>
                            </Col>
                            <Col span={8} className="text-center">
                                <Text type="secondary">Users</Text>
                                <div className="mt-1">
                                    <Text strong className="text-xl" style={{ color: '#43e97b' }}>{totalUsers}</Text>
                                </div>
                            </Col>
                        </Row>
                    </Card>
                </Col>

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
                        {propertyTypeData.length > 0 ? (
                            <>
                                <Pie {...pieConfig} height={320} />
                                <div className="mt-4 space-y-2">
                                    {propertyTypeData.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <div style={{
                                                    width: '12px',
                                                    height: '12px',
                                                    borderRadius: '50%',
                                                    background: ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b'][idx % 5],
                                                }} />
                                                <Text>{item.type}</Text>
                                            </div>
                                            <Text strong>{item.value}</Text>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-8">
                                <Text type="secondary">No property type data available</Text>
                            </div>
                        )}
                    </Card>
                </Col>
            </Row>

            {/* Bottom Section */}
            <Row gutter={[24, 24]}>
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
                            {topProperties.length > 0 ? topProperties.map((prop, idx) => {
                                const maxPerformance = Math.max(...topProperties.map(p => p.performance || 0));
                                const performancePercent = maxPerformance > 0 ? ((prop.performance || 0) / maxPerformance) * 100 : 0;

                                return (
                                    <div key={prop._id || idx} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                        <Avatar size={48} style={{ background: `linear-gradient(135deg, ${['#667eea', '#f093fb', '#4facfe', '#43e97b', '#ffa94d'][idx]} 0%, ${['#764ba2', '#f5576c', '#00f2fe', '#38f9d7', '#ff6b6b'][idx]} 100%)` }}>
                                            {idx + 1}
                                        </Avatar>
                                        <div className="flex-1">
                                            <Text strong className="block">{prop.title || 'Untitled Property'}</Text>
                                            <Text type="secondary" className="text-sm">{prop.location || 'Location not specified'}</Text>
                                        </div>
                                        <div className="text-right">
                                            <Text strong className="block">${(prop.price || 0).toLocaleString()}</Text>
                                            <Progress percent={Math.round(performancePercent)} size="small" strokeColor="#52c41a" showInfo={false} />
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="text-center py-8">
                                    <Text type="secondary">No properties data available</Text>
                                </div>
                            )}
                        </div>
                    </Card>
                </Col>

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
                            {recentActivity.length > 0 ? recentActivity.map((activity, idx) => (
                                <div key={idx} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                    <Badge status={activity.status as any} />
                                    <div className="flex-1">
                                        <Text strong className="block">{activity.action}</Text>
                                        <Text type="secondary" className="text-sm">{activity.detail}</Text>
                                    </div>
                                    <Text type="secondary" className="text-xs whitespace-nowrap">{activity.time}</Text>
                                </div>
                            )) : (
                                <div className="text-center py-8">
                                    <Text type="secondary">No recent activity</Text>
                                </div>
                            )}
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
