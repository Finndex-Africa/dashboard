'use client';

import { Spin, Card, Empty } from 'antd';
import { useAuth } from '@/providers/AuthProvider';
import { useState, useEffect } from 'react';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import HomeSeekerDashboard from '@/components/dashboard/HomeSeekerDashboard';
import AgentDashboard from '@/components/dashboard/AgentDashboard';
import ServiceProviderDashboard from '@/components/dashboard/ServiceProviderDashboard';

export default function DashboardPage() {
    const { user, isLoading } = useAuth();

    // Show loading spinner while auth is loading
    if (isLoading || !user) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <Spin size="large" tip="Loading your dashboard..." />
            </div>
        );
    }

    // If still no user after timeout, show error
    if (!user) {
        return (
            <div style={{ padding: '24px' }}>
                <Card>
                    <Empty description="Unable to load user data. Please refresh the page or sign in again." />
                </Card>
            </div>
        );
    }

    // Route to appropriate dashboard based on role
    if (user.role === 'home_seeker') {
        return <HomeSeekerDashboard />;
    }

    // Route other roles to their specific dashboards
    switch (user.role) {
        case 'landlord': // Legacy support - now redirects to agent dashboard
        case 'agent':
            return <AgentDashboard />;
        case 'service_provider':
            return <ServiceProviderDashboard />;
        case 'admin':
            return <AdminDashboard />;
        default:
            return <AdminDashboard />;
    }
}
