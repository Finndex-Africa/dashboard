'use client';

import { useState, useEffect } from 'react';
import Card from 'antd/es/card';
import Row from 'antd/es/row';
import Col from 'antd/es/col';
import Select from 'antd/es/select';
import Typography from 'antd/es/typography';
import Progress from 'antd/es/progress';
import Badge from 'antd/es/badge';
import Avatar from 'antd/es/avatar';
import Tag from 'antd/es/tag';
import Skeleton from 'antd/es/skeleton';
import Statistic from 'antd/es/statistic';
import {
    HomeOutlined,
    DollarOutlined,
    UserOutlined,
    ToolOutlined,
    RiseOutlined,
    FallOutlined,
    TrophyOutlined,
    CalendarOutlined,
    ArrowRightOutlined,
    EnvironmentOutlined,
    EyeOutlined,
    AppstoreOutlined,
    TeamOutlined,
    ThunderboltOutlined,
    ClockCircleOutlined,
} from '@ant-design/icons';
import { Line, Pie } from '@ant-design/plots';
import { useRouter } from 'next/navigation';
import { propertiesApi } from '@/services/api/properties.api';
import { servicesApi } from '@/services/api/services.api';
import { usersApi } from '@/services/api/users.api';
import { notificationsApi } from '@/services/api/notifications.api';
import type { Property } from '@/types/dashboard';

const { Title, Text } = Typography;

/* ─── helpers ─── */
function greet(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
}

function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmt(value: number, prefix = ''): string {
    if (value === 0) return `${prefix}0`;
    const abs = Math.abs(value);
    if (abs >= 1e9) return `${prefix}${(value / 1e9).toFixed(1)}B`;
    if (abs >= 1e6) return `${prefix}${(value / 1e6).toFixed(1)}M`;
    if (abs >= 1e3) return `${prefix}${(value / 1e3).toFixed(1)}K`;
    return `${prefix}${value.toLocaleString()}`;
}

function badgeStatus(type: string): 'success' | 'info' | 'warning' | 'error' | 'default' {
    const m: Record<string, 'success' | 'info' | 'warning' | 'error' | 'default'> = {
        property_approved: 'success', property_rejected: 'error', booking_confirmed: 'success',
        payment_received: 'success', new_inquiry: 'warning', property_viewed: 'default',
        service_completed: 'success', review_submitted: 'info',
    };
    return m[type] || 'default';
}

/* ─── main ─── */
export default function AdminDashboard() {
    const router = useRouter();
    const [properties, setProperties] = useState<Property[]>([]);
    const [services, setServices] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [rawResponses, setRawResponses] = useState<any>(null);
    const [selectedYear, setSelectedYear] = useState<number>(2026);
    const [selectedMonth, setSelectedMonth] = useState<string>('all');
    const [userName, setUserName] = useState('Admin');

    const availableYears = [2024, 2025, 2026];
    const availableMonths = [
        { value: 'all', label: 'All Months' },
        ...['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December']
            .map((m, i) => ({ value: String(i), label: m })),
    ];

    useEffect(() => {
        // Get user name
        try {
            const raw = localStorage.getItem('user') || sessionStorage.getItem('user');
            if (raw) {
                const u = JSON.parse(raw);
                setUserName(u.firstName || u.email?.split('@')[0] || 'Admin');
            }
        } catch { /* ignore */ }
    }, []);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setLoading(true);
                const [pRes, sRes, uRes, nRes] = await Promise.all([
                    propertiesApi.getAllAdminProperties({ page: 1, limit: 10 }).catch(() => ({ data: [] })),
                    servicesApi.getAllAdminServices({ page: 1, limit: 10 }).catch(() => ({ data: [] })),
                    usersApi.getAll({ page: 1, limit: 10 }).catch(() => ({ data: [] })),
                    notificationsApi.getAll({ limit: 10 }).catch(() => ({ data: [] })),
                ]);
                if (!mounted) return;
                setRawResponses({ pRes, sRes, uRes, nRes });
                const ex = (r: any) => { const d = Array.isArray(r?.data) ? r.data : r?.data?.data || []; return Array.isArray(d) ? d : []; };
                setProperties(ex(pRes));
                setServices(ex(sRes));
                setUsers(ex(uRes));
                setNotifications(ex(nRes));
            } catch {
                if (!mounted) return;
                setProperties([]); setServices([]); setUsers([]); setNotifications([]);
            } finally { if (mounted) setLoading(false); }
        })();
        return () => { mounted = false; };
    }, []);

    /* derived data */
    const propTotal = rawResponses?.pRes?.data?.pagination?.totalItems || properties.length;
    const svcTotal = rawResponses?.sRes?.data?.pagination?.totalItems || services.length;
    const usrTotal = rawResponses?.uRes?.data?.pagination?.totalItems || users.length;
    const portfolioValue = properties.reduce((s, p) => s + (p.price || 0), 0);

    /* ─── quick action cards ─── */
    const quickActions = [
        { label: 'Properties', icon: <HomeOutlined />, path: '/properties', count: propTotal },
        { label: 'Services', icon: <ToolOutlined />, path: '/services', count: svcTotal },
        { label: 'Users', icon: <TeamOutlined />, path: '/users', count: usrTotal },
        { label: 'Bookings', icon: <CalendarOutlined />, path: '/bookings' },
    ];

    /* ─── stat cards ─── */
    const stats = [
        { title: 'Total Properties', value: propTotal, change: 12.5, icon: <HomeOutlined />, color: '#0000FF' },
        { title: 'Portfolio Value', value: portfolioValue, prefix: '$', change: 8.2, icon: <DollarOutlined />, color: '#0000CC' },
        { title: 'Active Services', value: svcTotal, change: 15.3, icon: <ToolOutlined />, color: '#0000FF' },
        { title: 'Total Users', value: usrTotal, change: 23.1, icon: <UserOutlined />, color: '#0044CC' },
    ];

    /* ─── trend data ─── */
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = (() => {
        const filter = (arr: any[], mi: number) => arr.filter(x => {
            if (!x.createdAt) return false;
            const d = new Date(x.createdAt);
            return d.getMonth() === mi && d.getFullYear() === selectedYear;
        }).length;
        if (selectedMonth !== 'all') {
            const mi = parseInt(selectedMonth);
            return [{ month: months[mi], properties: filter(properties, mi), services: filter(services, mi), users: filter(users, mi) }];
        }
        return months.map((m, i) => ({ month: m, properties: filter(properties, i), services: filter(services, i), users: filter(users, i) }));
    })();

    /* ─── property types ─── */
    const typeCounts: Record<string, number> = {};
    properties.forEach(p => { const t = p.propertyType || 'Other'; typeCounts[t] = (typeCounts[t] || 0) + 1; });
    const typeData = Object.entries(typeCounts).map(([type, value]) => ({
        type: type.charAt(0).toUpperCase() + type.slice(1), value,
    })).sort((a, b) => b.value - a.value);

    /* ─── top properties ─── */
    const topProps = [...properties]
        .map(p => ({ ...p, perf: (p.views || 0) + (p.inquiries || 0) * 5 }))
        .sort((a, b) => b.perf - a.perf)
        .slice(0, 5);

    /* ─── recent activity ─── */
    const activity = notifications.slice(0, 8).map(n => ({
        action: n.title || 'Activity',
        detail: n.message || '',
        time: formatTimeAgo(n.createdAt),
        status: badgeStatus(n.type),
    }));

    /* ─── chart configs ─── */
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
        color: ['#0000FF', '#0044CC', '#52c41a'],
        legend: { position: 'top-right' as const },
        lineStyle: { lineWidth: 3 },
        point: { size: 4, shape: 'circle' as const, style: { fill: 'white', lineWidth: 2 } },
        area: { style: { fillOpacity: 0.06 } },
        animation: { appear: { animation: 'wave-in' as const, duration: 1200 } },
    };

    const pieColors = ['#0000FF', '#0044CC', '#3366FF', '#6688FF', '#52c41a'];
    const pieConfig = {
        data: typeData,
        angleField: 'value',
        colorField: 'type',
        radius: 0.85,
        innerRadius: 0.65,
        label: false as const,
        statistic: {
            title: { style: { fontSize: '13px', color: '#999' }, content: 'Total' },
            content: { style: { fontSize: '28px', fontWeight: '700', color: '#111' }, content: String(propTotal) },
        },
        color: pieColors,
        legend: false as const,
        animation: { appear: { animation: 'fade-in' as const, duration: 800 } },
    };

    /* ─── loading skeleton ─── */
    if (loading) {
        return (
            <div className="space-y-6">
                {/* Header skeleton */}
                <div className="space-y-2">
                    <Skeleton.Input active style={{ width: 280, height: 36 }} />
                    <Skeleton.Input active style={{ width: 360, height: 20 }} />
                </div>
                {/* Stat card skeletons */}
                <Row gutter={[16, 16]}>
                    {[1, 2, 3, 4].map(i => (
                        <Col xs={24} sm={12} lg={6} key={i}>
                            <Card style={{ borderRadius: 16 }}><Skeleton active paragraph={{ rows: 2 }} /></Card>
                        </Col>
                    ))}
                </Row>
                {/* Chart skeletons */}
                <Row gutter={[16, 16]}>
                    <Col xs={24} lg={16}><Card style={{ borderRadius: 16, height: 420 }}><Skeleton active paragraph={{ rows: 8 }} /></Card></Col>
                    <Col xs={24} lg={8}><Card style={{ borderRadius: 16, height: 420 }}><Skeleton active paragraph={{ rows: 8 }} /></Card></Col>
                </Row>
            </div>
        );
    }

    return (
        <div className="space-y-6">

            {/* ───────── HERO HEADER ───────── */}
            <div style={{
                background: 'linear-gradient(135deg, #0000FF 0%, #0033CC 50%, #0055EE 100%)',
                borderRadius: 20,
                padding: 'clamp(20px, 4vw, 32px)',
                position: 'relative',
                overflow: 'hidden',
            }}>
                {/* Decorative circles */}
                <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
                <div style={{ position: 'absolute', bottom: -60, right: 80, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
                <div style={{ position: 'absolute', top: 20, right: 160, width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 'clamp(13px, 2.5vw, 15px)', display: 'block', marginBottom: 4 }}>
                        <ClockCircleOutlined style={{ marginRight: 6 }} />
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </Text>
                    <Title level={2} style={{ color: '#fff', margin: 0, fontSize: 'clamp(22px, 5vw, 32px)', fontWeight: 700 }}>
                        {greet()}, {userName}
                    </Title>
                    <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 'clamp(13px, 2.5vw, 16px)', display: 'block', marginTop: 6 }}>
                        Here&apos;s what&apos;s happening across your platform today.
                    </Text>

                    {/* Quick action pills */}
                    <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
                        {quickActions.map((qa) => (
                            <button
                                key={qa.label}
                                onClick={() => router.push(qa.path)}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 8,
                                    background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    borderRadius: 12, padding: '8px 16px',
                                    color: '#fff', fontSize: 'clamp(12px, 2vw, 14px)', fontWeight: 500,
                                    cursor: 'pointer', transition: 'all 0.2s',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.25)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
                            >
                                {qa.icon}
                                {qa.label}
                                {qa.count !== undefined && (
                                    <span style={{ background: 'rgba(255,255,255,0.25)', borderRadius: 8, padding: '2px 8px', fontSize: 12 }}>
                                        {qa.count}
                                    </span>
                                )}
                                <ArrowRightOutlined style={{ fontSize: 10, opacity: 0.7 }} />
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ───────── STAT CARDS ───────── */}
            <Row gutter={[16, 16]}>
                {stats.map((s, i) => (
                    <Col xs={24} sm={12} lg={6} key={i}>
                        <Card
                            hoverable
                            style={{
                                borderRadius: 16,
                                border: 'none',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)',
                                overflow: 'hidden',
                            }}
                            styles={{ body: { padding: '20px 20px 16px' } }}
                        >
                            {/* Accent bar */}
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: s.color }} />

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <Text type="secondary" style={{ fontSize: 13, letterSpacing: '0.02em' }}>{s.title}</Text>
                                    <div style={{ fontSize: 'clamp(26px, 5vw, 34px)', fontWeight: 700, lineHeight: 1.2, marginTop: 6, color: '#111' }}>
                                        {fmt(s.value, s.prefix)}
                                    </div>
                                </div>
                                <div style={{
                                    width: 48, height: 48, borderRadius: 14,
                                    background: `${s.color}0D`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 22, color: s.color, flexShrink: 0,
                                }}>
                                    {s.icon}
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, paddingTop: 12, borderTop: '1px solid #f5f5f5' }}>
                                {s.change > 0 ? (
                                    <Tag color="success" style={{ margin: 0, borderRadius: 6, fontWeight: 600, fontSize: 12 }}>
                                        <RiseOutlined /> {s.change}%
                                    </Tag>
                                ) : (
                                    <Tag color="error" style={{ margin: 0, borderRadius: 6, fontWeight: 600, fontSize: 12 }}>
                                        <FallOutlined /> {Math.abs(s.change)}%
                                    </Tag>
                                )}
                                <Text type="secondary" style={{ fontSize: 12 }}>vs last month</Text>
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* ───────── CHARTS ROW ───────── */}
            <Row gutter={[16, 16]}>
                {/* Revenue Trend */}
                <Col xs={24} lg={16}>
                    <Card
                        style={{ borderRadius: 16, border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)' }}
                        styles={{ body: { padding: 'clamp(16px, 3vw, 24px)' } }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
                            <div>
                                <Text strong style={{ fontSize: 'clamp(16px, 3vw, 20px)', display: 'block' }}>Growth Overview</Text>
                                <Text type="secondary" style={{ fontSize: 13 }}>Monthly registration trends</Text>
                            </div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                <Select value={selectedYear} onChange={setSelectedYear} size="small" style={{ minWidth: 85 }}
                                    options={availableYears.map(y => ({ value: y, label: String(y) }))} />
                                <Select value={selectedMonth} onChange={setSelectedMonth} size="small" style={{ minWidth: 120 }}
                                    options={availableMonths} />
                            </div>
                        </div>

                        <Line {...trendConfig} height={280} />

                        {/* Summary pills */}
                        <div style={{ display: 'flex', gap: 16, marginTop: 20, paddingTop: 16, borderTop: '1px solid #f0f0f0', flexWrap: 'wrap', justifyContent: 'center' }}>
                            {[
                                { label: 'Properties', value: propTotal, color: '#0000FF' },
                                { label: 'Services', value: svcTotal, color: '#0044CC' },
                                { label: 'Users', value: usrTotal, color: '#52c41a' },
                            ].map(item => (
                                <div key={item.label} style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    background: '#fafafa', borderRadius: 12, padding: '10px 20px',
                                }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} />
                                    <div>
                                        <Text type="secondary" style={{ fontSize: 12, display: 'block', lineHeight: 1 }}>{item.label}</Text>
                                        <Text strong style={{ fontSize: 18, color: item.color }}>{item.value}</Text>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </Col>

                {/* Property Types */}
                <Col xs={24} lg={8}>
                    <Card
                        style={{ borderRadius: 16, border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)', height: '100%' }}
                        styles={{ body: { padding: 'clamp(16px, 3vw, 24px)', height: '100%', display: 'flex', flexDirection: 'column' } }}
                    >
                        <div style={{ marginBottom: 16 }}>
                            <Text strong style={{ fontSize: 'clamp(16px, 3vw, 20px)', display: 'block' }}>Property Types</Text>
                            <Text type="secondary" style={{ fontSize: 13 }}>Distribution breakdown</Text>
                        </div>

                        {typeData.length > 0 ? (
                            <>
                                <div style={{ flex: 1, minHeight: 220 }}>
                                    <Pie {...pieConfig} height={220} />
                                </div>
                                <div style={{ marginTop: 16 }}>
                                    {typeData.map((item, idx) => (
                                        <div key={idx} style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            padding: '8px 12px', borderRadius: 10, marginBottom: 4,
                                            background: idx === 0 ? `${pieColors[0]}08` : 'transparent',
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{ width: 10, height: 10, borderRadius: 3, background: pieColors[idx % pieColors.length], flexShrink: 0 }} />
                                                <Text style={{ fontSize: 14 }}>{item.type}</Text>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <Text strong style={{ fontSize: 14 }}>{item.value}</Text>
                                                <Text type="secondary" style={{ fontSize: 12 }}>
                                                    ({propTotal > 0 ? Math.round((item.value / propTotal) * 100) : 0}%)
                                                </Text>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
                                <AppstoreOutlined style={{ fontSize: 40, color: '#d9d9d9' }} />
                                <Text type="secondary">No property data yet</Text>
                            </div>
                        )}
                    </Card>
                </Col>
            </Row>

            {/* ───────── BOTTOM SECTION ───────── */}
            <Row gutter={[16, 16]}>
                {/* Top Properties */}
                <Col xs={24} lg={12}>
                    <Card
                        style={{ borderRadius: 16, border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)' }}
                        styles={{ body: { padding: 'clamp(16px, 3vw, 24px)' } }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <div>
                                <Text strong style={{ fontSize: 'clamp(16px, 3vw, 20px)', display: 'block' }}>Top Properties</Text>
                                <Text type="secondary" style={{ fontSize: 13 }}>By engagement score</Text>
                            </div>
                            <TrophyOutlined style={{ fontSize: 20, color: '#faad14' }} />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {topProps.length > 0 ? topProps.map((prop, idx) => {
                                const maxPerf = Math.max(...topProps.map(p => p.perf || 1));
                                const pct = maxPerf > 0 ? Math.round(((prop.perf || 0) / maxPerf) * 100) : 0;
                                const medals = ['#FFD700', '#C0C0C0', '#CD7F32'];

                                return (
                                    <div key={prop._id || idx} style={{
                                        display: 'flex', alignItems: 'center', gap: 12,
                                        padding: '12px 14px', borderRadius: 14,
                                        background: idx === 0 ? '#fafafa' : 'transparent',
                                        transition: 'background 0.2s',
                                        cursor: 'pointer',
                                    }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = '#fafafa'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = idx === 0 ? '#fafafa' : 'transparent'; }}
                                    >
                                        {/* Rank */}
                                        <div style={{
                                            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontWeight: 700, fontSize: 14,
                                            background: idx < 3 ? `${medals[idx]}20` : '#f5f5f5',
                                            color: idx < 3 ? medals[idx] : '#999',
                                        }}>
                                            {idx + 1}
                                        </div>
                                        {/* Info */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <Text strong style={{ fontSize: 14, display: 'block' }} className="truncate">{prop.title || 'Untitled'}</Text>
                                            <Text type="secondary" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <EnvironmentOutlined style={{ fontSize: 11 }} /> {prop.location || 'N/A'}
                                            </Text>
                                        </div>
                                        {/* Price + bar */}
                                        <div style={{ textAlign: 'right', minWidth: 90 }}>
                                            <Text strong style={{ fontSize: 14 }}>${(prop.price || 0).toLocaleString()}</Text>
                                            <Progress percent={pct} size="small" strokeColor="#0000FF" showInfo={false} style={{ marginTop: 4 }} />
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                    <HomeOutlined style={{ fontSize: 40, color: '#d9d9d9' }} />
                                    <br />
                                    <Text type="secondary" style={{ marginTop: 8, display: 'inline-block' }}>No properties yet</Text>
                                </div>
                            )}
                        </div>
                    </Card>
                </Col>

                {/* Recent Activity */}
                <Col xs={24} lg={12}>
                    <Card
                        style={{ borderRadius: 16, border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)' }}
                        styles={{ body: { padding: 'clamp(16px, 3vw, 24px)' } }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <div>
                                <Text strong style={{ fontSize: 'clamp(16px, 3vw, 20px)', display: 'block' }}>Recent Activity</Text>
                                <Text type="secondary" style={{ fontSize: 13 }}>Latest platform events</Text>
                            </div>
                            <ThunderboltOutlined style={{ fontSize: 20, color: '#0000FF' }} />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {activity.length > 0 ? activity.map((a, idx) => (
                                <div key={idx} style={{
                                    display: 'flex', alignItems: 'flex-start', gap: 12,
                                    padding: '10px 12px', borderRadius: 12,
                                    transition: 'background 0.2s',
                                }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = '#fafafa'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                >
                                    <div style={{ marginTop: 6, flexShrink: 0 }}>
                                        <Badge status={a.status as any} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <Text strong style={{ fontSize: 14, display: 'block' }} className="truncate">{a.action}</Text>
                                        <Text type="secondary" style={{ fontSize: 12 }} className="line-clamp-1">{a.detail}</Text>
                                    </div>
                                    <Text type="secondary" style={{ fontSize: 11, whiteSpace: 'nowrap', flexShrink: 0 }}>{a.time}</Text>
                                </div>
                            )) : (
                                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                    <CalendarOutlined style={{ fontSize: 40, color: '#d9d9d9' }} />
                                    <br />
                                    <Text type="secondary" style={{ marginTop: 8, display: 'inline-block' }}>No recent activity</Text>
                                </div>
                            )}
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
