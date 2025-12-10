'use client';

import { Spin, Card, Empty } from 'antd';
import { useAuth } from '@/providers/AuthProvider';
import { useState, useEffect } from 'react';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import HomeSeekerDashboard from '@/components/dashboard/HomeSeekerDashboard';
import AgentDashboard from '@/components/dashboard/AgentDashboard';
import ServiceProviderDashboard from '@/components/dashboard/ServiceProviderDashboard';

export default function DashboardPage() {
    const { user } = useAuth();
    const [isInitializing, setIsInitializing] = useState(true);
    const [retryCount, setRetryCount] = useState(0);

    // Check for user data with retries
    useEffect(() => {
        // If we have user data, stop initializing immediately
        if (user) {
            setIsInitializing(false);
            return;
        }

        // Retry checking for user data every 200ms for up to 3 seconds
        if (retryCount < 15) {
            const timer = setTimeout(() => {
                setRetryCount(prev => prev + 1);
            }, 200);
            return () => clearTimeout(timer);
        } else {
            // After max retries, stop initializing
            setIsInitializing(false);
        }
    }, [user, retryCount]);

    // Show loading spinner while initializing
    if (!user && isInitializing) {
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
