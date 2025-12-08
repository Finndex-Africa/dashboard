'use client';

import { useAuth } from '@/providers/AuthProvider';
import HomeSeekerDashboard from '@/components/dashboard/HomeSeekerDashboard';
import LandlordDashboard from '@/components/dashboard/LandlordDashboard';
import AgentDashboard from '@/components/dashboard/AgentDashboard';
import ServiceProviderDashboard from '@/components/dashboard/ServiceProviderDashboard';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import Typography from 'antd/es/typography';
import Card from 'antd/es/card';

const { Title, Paragraph } = Typography;

export default function DashboardPage() {
    const { user } = useAuth();

    // Render role-specific dashboard
    if (user && user.role) {
        switch (user.role) {
            case 'home_seeker':
                return <HomeSeekerDashboard />;

            case 'landlord':
                return <LandlordDashboard />;

            case 'agent':
                return <AgentDashboard />;

            case 'service_provider':
                return <ServiceProviderDashboard />;

            case 'admin':
                return <AdminDashboard />;

            default:
                // Log unexpected role for debugging
                console.warn('Unknown user role:', user.role);
                break;
        }
    } else if (user && !user.role) {
        // User is loaded but has no role - this is an error state
        console.error('User loaded but has no role', user);
        return (
            <div className="space-y-8">
                <Typography.Title level={2} className="!mb-0">Error: Invalid User Role</Typography.Title>
                <Card>
                    <Typography.Paragraph>
                        Your account does not have a valid role assigned. Please contact support.
                    </Typography.Paragraph>
                </Card>
            </div>
        );
    }

    // Default loading state
    return (
        <div className="space-y-8">
            <Title level={2}>Dashboard</Title>
            <Card>
                <Paragraph>Loading dashboard...</Paragraph>
            </Card>
        </div>
    );
}
