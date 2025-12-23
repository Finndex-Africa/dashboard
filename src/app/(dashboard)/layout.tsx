'use client';

import { useState } from 'react';
import Layout from 'antd/es/layout';
import Menu from 'antd/es/menu';
import Dropdown from 'antd/es/dropdown';
import Drawer from 'antd/es/drawer';
import Space from 'antd/es/space';
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
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import { designTokens } from '@/config/theme';
import { Toaster } from 'react-hot-toast';
import { useAuth } from '@/providers/AuthProvider';
import { getRoleRedirectPath } from '@/lib/role-redirects';

const { Header, Content } = Layout;

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const { user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const handleMenuClick = (key: string) => {
        if (key === 'logout') {
            handleLogout();
        } else {
            router.push(`/${key}`);
        }
    };

    const handleHomeClick = () => {
        const websiteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || 'http://localhost:3000';
        window.location.href = websiteUrl;
    };

    // User dropdown menu items (top-right profile) - role-aware
    const userDropdownItems = [
        // Only show Dashboard for admin
        ...(user?.role === 'admin' ? [{
            key: 'dashboard',
            label: 'Dashboard',
            icon: <HomeOutlined />,
            onClick: () => router.push('/dashboard'),
        }] : []),
        {
            key: 'profile',
            label: 'Profile',
            icon: <UserOutlined />,
            onClick: () => router.push('/profile'),
        },
        {
            type: 'divider' as const,
        },
        {
            key: 'logout',
            label: 'Log out',
            onClick: () => handleLogout(),
        },
    ];

    // Define all menu items with role restrictions
    const allMenuItems = [
        {
            key: '/dashboard',
            icon: <HomeOutlined />,
            label: 'Dashboard',
            roles: ['admin'], // ONLY admin has dashboard
        },
        {
            key: '/properties',
            icon: <AppstoreOutlined />,
            label: 'Properties',
            roles: ['home_seeker', 'landlord', 'agent', 'admin'], // Everyone sees properties
        },
        {
            key: '/services',
            icon: <ShopOutlined />,
            label: 'Services',
            roles: ['home_seeker', 'service_provider', 'admin'], // Home seekers can browse services
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
            key: '/notifications',
            icon: <BellOutlined />,
            label: 'Notifications',
            roles: ['home_seeker', 'landlord', 'agent', 'service_provider', 'admin'],
        },
        {
            key: '/messages',
            icon: <MessageOutlined />,
            label: 'Messages',
            roles: ['home_seeker', 'landlord', 'agent', 'service_provider', 'admin'],
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
                            primary: '#43e97b',
                            secondary: '#fff',
                        },
                        style: {
                            border: '1px solid #43e97b20',
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
                            primary: '#4facfe',
                            secondary: '#fff',
                        },
                    },
                }}
            />

            <Layout style={{ minHeight: '100vh' }}>
                {/* Airbnb-style Header */}
                <Header
                    style={{
                        position: 'sticky',
                        top: 0,
                        zIndex: 10,
                        width: '100%',
                        padding: '0 24px',
                        background: '#fff',
                        borderBottom: '1px solid #ebebeb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        height: '80px',
                    }}
                >
                    {/* Logo */}
                    <div
                        className="cursor-pointer flex items-center"
                        onClick={() => {
                            const redirectPath = user?.role ? getRoleRedirectPath(user.role) : '/properties';
                            router.push(redirectPath);
                        }}
                    >
                        <img
                            src="/images/logos/logo1.png"
                            alt="Finndex Africa"
                            className="h-10 object-contain"
                        />
                    </div>

                    {/* Right side: Notifications + User Menu */}
                    <div className="flex items-center gap-2">
                        {/* Burger Menu Button */}
                        <Button
                            type="text"
                            icon={<MenuOutlined style={{ fontSize: '18px' }} />}
                            onClick={() => setDrawerOpen(true)}
                            style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: '50%',
                                border: '1px solid #ddd',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        />

                        {/* User Avatar Dropdown */}
                        <Dropdown menu={{ items: userDropdownItems }} trigger={['click']}>
                            <div
                                className="cursor-pointer flex items-center gap-3 px-3 py-2 rounded-full border border-gray-300 hover:shadow-md transition-all"
                                style={{ height: '42px' }}
                            >
                                <MenuOutlined style={{ fontSize: '14px', color: '#717171' }} />
                                <Avatar
                                    src={user?.avatar}
                                    icon={!user?.avatar && <UserOutlined />}
                                    size={28}
                                    style={{
                                        backgroundColor: '#717171',
                                    }}
                                />
                            </div>
                        </Dropdown>
                    </div>
                </Header>

                {/* Airbnb-style Drawer Menu */}
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
                                style={{ backgroundColor: '#6366f1' }}
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
                <Content style={{ background: '#f7f7f7', minHeight: 'calc(100vh - 80px)' }}>
                    <div className="max-w-7xl mx-auto px-6 py-8">
                        {children}
                    </div>
                </Content>
            </Layout>
        </>
    );
}