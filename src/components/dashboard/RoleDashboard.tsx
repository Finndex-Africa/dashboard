'use client';

import { useMemo } from 'react';
import { Row, Col, Typography, Empty } from 'antd';
import { getDashboardConfig, UserRole } from '@/config/dashboard-roles.config';
import StatsCard from './widgets/StatsCard';
import RecentBookings from './widgets/RecentBookings';
import SavedProperties from './widgets/SavedProperties';
import NotificationsList from './widgets/NotificationsList';
import PropertiesList from './widgets/PropertiesList';
import RevenueChart from './widgets/RevenueChart';
import PropertyStatusChart from './widgets/PropertyStatusChart';
import BookingsChart from './widgets/BookingsChart';
import ServiceCategoryChart from './widgets/ServiceCategoryChart';
import UserGrowthChart from './widgets/UserGrowthChart';

const { Title, Text } = Typography;

interface RoleDashboardProps {
    userRole: string;
    userId: string;
}

// Widget component mapping
const WIDGET_COMPONENTS: Record<string, React.ComponentType<any>> = {
    BookingsList: RecentBookings,
    SavedPropertiesList: SavedProperties,
    NotificationsList: NotificationsList,
    PropertiesList: PropertiesList,
    RevenueChart: RevenueChart,
    PropertyStatusChart: PropertyStatusChart,
    BookingsChart: BookingsChart,
    ServiceCategoryChart: ServiceCategoryChart,
    UserGrowthChart: UserGrowthChart,
};

export default function RoleDashboard({ userRole, userId }: RoleDashboardProps) {
    const dashboardConfig = useMemo(() => getDashboardConfig(userRole), [userRole]);

    const renderWidget = (widget: any) => {
        const WidgetComponent = WIDGET_COMPONENTS[widget.component];

        if (!WidgetComponent) {
            console.warn(`Widget component not found: ${widget.component}`);
            return (
                <Empty
                    description={`Widget "${widget.title}" is not yet implemented`}
                    style={{ padding: '40px 20px' }}
                />
            );
        }

        return <WidgetComponent userId={userId} userRole={userRole} />;
    };

    return (
        <div className="role-dashboard">
            {/* Dashboard Header */}
            <div style={{ marginBottom: 24 }}>
                <Title level={3} style={{ margin: 0 }}>
                    {dashboardConfig.displayName}
                </Title>
                <Text type="secondary">
                    Welcome back! Here's what's happening with your account.
                </Text>
            </div>

            {/* Stats Cards */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                {dashboardConfig.statsCards.map((statType) => (
                    <Col xs={24} sm={12} md={6} key={statType}>
                        <StatsCard type={statType} userRole={userRole} userId={userId} />
                    </Col>
                ))}
            </Row>

            {/* Dashboard Widgets */}
            <Row gutter={[16, 16]}>
                {dashboardConfig.widgets.map((widget) => (
                    <Col
                        key={widget.id}
                        xs={widget.gridSize?.xs || 24}
                        sm={widget.gridSize?.sm || 24}
                        md={widget.gridSize?.md || 12}
                        lg={widget.gridSize?.lg || 12}
                    >
                        <div className="dashboard-widget">
                            <Title level={5} style={{ marginBottom: 16 }}>
                                {widget.title}
                            </Title>
                            {renderWidget(widget)}
                        </div>
                    </Col>
                ))}
            </Row>
        </div>
    );
}
