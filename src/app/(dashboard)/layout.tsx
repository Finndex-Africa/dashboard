'use client';

import { useState } from 'react';
import Layout from 'antd/es/layout';
import Menu from 'antd/es/menu';
import Drawer from 'antd/es/drawer';
import Avatar from 'antd/es/avatar';
import Button from 'antd/es/button';
import {
    HomeOutlined,
    AppstoreOutlined,
    ShopOutlined,
    TeamOutlined,
    MessageOutlined,
    LogoutOutlined,
    UserOutlined,
    CalendarOutlined,
    BellOutlined,
    TrophyOutlined,
    MenuOutlined,
    CloseOutlined,
    SafetyCertificateOutlined,
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import { useAuth } from '@/providers/AuthProvider';
import { getRoleRedirectPath } from '@/lib/role-redirects';

const { Content, Sider } = Layout;

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const { user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    // No top-right dropdown - Profile is now in the sidebar

    // Define all menu items with role restrictions
    // admin = general admin (full access), admin_property = properties only, admin_services = services only
    const allMenuItems = [
        {
            key: '/dashboard',
            icon: <HomeOutlined />,
            label: 'Dashboard',
            roles: ['admin', 'admin_property', 'admin_services'],
        },
        {
            key: '/properties',
            icon: <AppstoreOutlined />,
            label: 'Properties',
            roles: ['home_seeker', 'landlord', 'agent', 'admin', 'admin_property'],
        },
        {
            key: '/services',
            icon: <ShopOutlined />,
            label: 'Services',
            roles: ['home_seeker', 'service_provider', 'admin', 'admin_services'],
        },
        {
            key: '/bookings',
            icon: <CalendarOutlined />,
            label: 'Bookings',
            roles: ['home_seeker', 'landlord', 'agent', 'service_provider', 'admin'],
        },
        {
            key: '/advertisements',
            icon: <TrophyOutlined />,
            label: 'Advertisements',
            roles: ['admin'],
        },
        {
            key: '/users',
            icon: <TeamOutlined />,
            label: 'Users',
            roles: ['admin'],
        },
        {
            key: '/verifications',
            icon: <SafetyCertificateOutlined />,
            label: 'Verifications',
            roles: ['admin'],
        },
        {
            key: '/notifications',
            icon: <BellOutlined />,
            label: 'Notifications',
            roles: ['home_seeker', 'landlord', 'agent', 'service_provider', 'admin', 'admin_property', 'admin_services'],
        },
        {
            key: '/messages',
            icon: <MessageOutlined />,
            label: 'Messages',
            roles: ['home_seeker', 'landlord', 'agent', 'service_provider', 'admin', 'admin_property', 'admin_services'],
        },
        {
            key: '/profile',
            icon: <UserOutlined />,
            label: 'Profile',
            roles: ['home_seeker', 'landlord', 'agent', 'service_provider', 'admin', 'admin_property', 'admin_services'],
        },
    ];

    // Filter menu items based on user role
    const menuItems = user?.role
        ? allMenuItems.filter(item => item.roles.includes(user.role)).map(({ roles, ...item }) => item)
        : [];

    const handleLogout = () => {
        // Clear dashboard auth data (only auth keys)
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        localStorage.removeItem('refreshToken');
        document.cookie = 'token=; path=/; max-age=0';

        // Redirect to frontend and trigger logout there as well
        const websiteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || 'http://localhost:3000';
        window.location.href = `${websiteUrl}/?logout=true`;
    };

    return (
        <>
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: '#fff',
                        color: '#333',
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        padding: '16px',
                        fontSize: '14px',
                    },
                    success: {
                        iconTheme: {
                            primary: '#52c41a',
                            secondary: '#fff',
                        },
                        style: {
                            border: '1px solid #52c41a20',
                        },
                    },
                    error: {
                        iconTheme: {
                            primary: '#ff6b6b',
                            secondary: '#fff',
                        },
                        style: {
                            border: '1px solid #ff6b6b20',
                        },
                    },
                    loading: {
                        iconTheme: {
                            primary: '#0000FF',
                            secondary: '#fff',
                        },
                    },
                }}
            />

            <Layout style={{ minHeight: '100vh' }}>
                {/* Desktop Sidebar - Hidden on mobile (md and below) */}
                <Sider
                    width={260}
                    breakpoint="md"
                    collapsedWidth={0}
                    trigger={null}
                    style={{
                        overflow: 'auto',
                        height: '100vh',
                        position: 'fixed',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        background: '#fff',
                        borderRight: '1px solid #ebebeb',
                        zIndex: 200,
                    }}
                    className="hidden md:block"
                >
                    {/* Sidebar Logo */}
                    <div
                        className="cursor-pointer flex py-6 px-4 border-b border-gray-200"
                        onClick={() => {
                            const redirectPath = user?.role ? getRoleRedirectPath(user.role) : '/properties';
                            router.push(redirectPath);
                        }}
                    >
                        <img
                            src="/images/logos/Finndex Africa Updated Logo.png"
                            alt="Finndex Africa"
                            className="h-10 object-contain"
                        />
                    </div>

                    {/* Sidebar Menu */}
                    <Menu
                        mode="vertical"
                        selectedKeys={[pathname]}
                        onClick={({ key }) => router.push(key)}
                        items={menuItems}
                        style={{
                            border: 'none',
                            fontSize: '15px',
                            paddingTop: '16px',
                        }}
                    />

                    {/* Sidebar Footer - Logout Button */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
                        <Button
                            block
                            size="large"
                            onClick={handleLogout}
                            icon={<LogoutOutlined />}
                            style={{
                                borderRadius: '8px',
                                fontWeight: 500,
                            }}
                        >
                            Log out
                        </Button>
                    </div>
                </Sider>

                {/* Main Layout - Adjust margin for sidebar on desktop */}
                <Layout className="md:ml-[260px]" style={{ position: 'relative' }}>
                    {/* Mobile-only header with burger menu — hidden on md+ */}
                    <div className="block md:hidden sticky top-0 z-[100]">
                        <div
                            className="flex items-center justify-between"
                            style={{
                                width: '100%',
                                padding: '0 16px',
                                background: '#fff',
                                borderBottom: '1px solid #ebebeb',
                                height: '56px',
                                boxShadow: '0 1px 4px 0 rgba(0, 0, 0, 0.06)',
                            }}
                        >
                            {/* Logo (mobile) */}
                            <div
                                className="cursor-pointer flex items-center"
                                onClick={() => {
                                    const redirectPath = user?.role ? getRoleRedirectPath(user.role) : '/properties';
                                    router.push(redirectPath);
                                }}
                            >
                                <img
                                    src="/images/logos/Finndex Africa Updated Logo.png"
                                    alt="Finndex Africa"
                                    className="h-8 object-contain"
                                />
                            </div>

                            {/* Burger menu (mobile) */}
                            <Button
                                type="text"
                                icon={<MenuOutlined style={{ fontSize: '16px' }} />}
                                onClick={() => setDrawerOpen(true)}
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    border: '1px solid #ddd',
                                }}
                            />
                        </div>
                    </div>

                    {/* Mobile Drawer Menu */}
                    <Drawer
                        title={null}
                        placement="right"
                        onClose={() => setDrawerOpen(false)}
                        open={drawerOpen}
                        width={320}
                        closable={false}
                        styles={{
                            body: { padding: 0 },
                            header: { display: 'none' },
                        }}
                    >
                        {/* Drawer Header */}
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Avatar
                                    src={user?.avatar}
                                    icon={!user?.avatar && <UserOutlined />}
                                    size={48}
                                    style={{ backgroundColor: '#0000FF' }}
                                />
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '16px' }}>
                                        {`${user?.firstName || user?.email?.split('@')[0] || 'User'}${user?.lastName ? ' ' + user.lastName : ''}`}
                                    </div>
                                    <div style={{ fontSize: '14px', color: '#717171' }}>
                                        {user?.role?.replace('_', ' ') || 'User'}
                                    </div>
                                </div>
                            </div>
                            <Button
                                type="text"
                                icon={<CloseOutlined />}
                                onClick={() => setDrawerOpen(false)}
                            />
                        </div>

                        {/* Drawer Menu Items */}
                        <Menu
                            mode="vertical"
                            selectedKeys={[pathname]}
                            onClick={({ key }) => {
                                router.push(key);
                                setDrawerOpen(false);
                            }}
                            items={menuItems}
                            style={{
                                border: 'none',
                                fontSize: '16px',
                            }}
                        />

                        {/* Drawer Footer */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200">
                            <Button
                                block
                                size="large"
                                onClick={handleLogout}
                                style={{
                                    borderRadius: '8px',
                                    fontWeight: 500,
                                }}
                            >
                                <LogoutOutlined /> Log out
                            </Button>
                        </div>
                    </Drawer>

                    {/* Main Content */}
                    <Content
                        style={{
                            background: '#f7f7f7',
                            minHeight: 'calc(100vh - 56px)',
                            padding: '32px 20px',
                            position: 'relative',
                            zIndex: 1,
                        }}
                    >
                        <div className="max-w-7xl mx-auto" style={{ position: 'relative', zIndex: 2 }}>
                            {children}
                        </div>
                    </Content>
                </Layout>
            </Layout>
        </>
    );
}
