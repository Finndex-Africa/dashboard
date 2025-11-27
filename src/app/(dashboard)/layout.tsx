'use client';

import { useState, useEffect } from 'react';
import Layout from 'antd/es/layout';
import Menu from 'antd/es/menu';
import Dropdown from 'antd/es/dropdown';
import Space from 'antd/es/space';
import Avatar from 'antd/es/avatar';
import {
    HomeOutlined,
    AppstoreOutlined,
    ShopOutlined,
    TeamOutlined,
    MessageOutlined,
    SettingOutlined,
    LogoutOutlined,
    UserOutlined,
    CalendarOutlined,
    BellOutlined,
    TrophyOutlined,
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import { designTokens } from '@/config/theme';
import { Toaster } from 'react-hot-toast';

const { Sider, Header } = Layout;

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [collapsed, setCollapsed] = useState(false);
    const [user, setUser] = useState<any>(null);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Get user data from localStorage
        const userData = localStorage.getItem('user');
        if (userData) {
            try {
                setUser(JSON.parse(userData));
            } catch (error) {
                console.error('Error parsing user data:', error);
            }
        }
    }, []);

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

    const userMenuItems = [
        {
            key: 'home',
            label: 'Home',
            icon: <HomeOutlined />,
            onClick: () => handleHomeClick(),
        },
        {
            key: 'profile',
            label: 'Profile',
            icon: <UserOutlined />,
            onClick: () => handleMenuClick('profile'),
        },
        {
            key: 'settings',
            label: 'Settings',
            icon: <SettingOutlined />,
            onClick: () => handleMenuClick('settings'),
        },
        {
            type: 'divider' as const,
        },
        {
            key: 'logout',
            label: 'Logout',
            icon: <LogoutOutlined />,
            onClick: () => handleLogout(),
            danger: true,
        },
    ];

    const menuItems = [
        {
            key: '/dashboard',
            icon: <HomeOutlined />,
            label: 'Overview',
        },
        {
            key: '/properties',
            icon: <AppstoreOutlined />,
            label: 'Properties',
        },
        {
            key: '/services',
            icon: <ShopOutlined />,
            label: 'Services',
        },
        {
            key: '/bookings',
            icon: <CalendarOutlined />,
            label: 'Bookings',
        },
        {
            key: '/advertisements',
            icon: <TrophyOutlined />,
            label: 'Advertisements',
        },
        {
            key: '/users',
            icon: <TeamOutlined />,
            label: 'Users',
        },
        {
            key: '/notifications',
            icon: <BellOutlined />,
            label: 'Notifications',
        },
        {
            key: '/messages',
            icon: <MessageOutlined />,
            label: 'Messages',
        },
        {
            key: '/settings',
            icon: <SettingOutlined />,
            label: 'Settings',
        },
    ];

    const handleLogout = () => {
        // Clear dashboard auth data
        localStorage.clear();
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
            <Layout>
                <Sider
                collapsible
                collapsed={collapsed}
                onCollapse={setCollapsed}
                style={{
                    overflow: 'auto',
                    height: '100vh',
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    backgroundColor: '#fff',
                    borderRight: '1px solid #f0f0f0',
                }}
                theme="light"
            >
                <div className="h-16 flex items-center justify-center border-b border-gray-100 px-4">
                    {collapsed ? (
                        <img
                            src="/images/logos/logo2.png"
                            alt="Finndex Africa"
                            className="h-8 w-8 object-contain"
                        />
                    ) : (
                        <img
                            src="/images/logos/logo1.png"
                            alt="Finndex Africa"
                            className="h-8 object-contain"
                        />
                    )}
                </div>
                <Menu
                    theme="light"
                    selectedKeys={[pathname]}
                    mode="inline"
                    items={menuItems}
                    onClick={({ key }) => router.push(key)}
                    style={{
                        height: 'calc(100vh - 64px)',
                        borderRight: 0,
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                />
            </Sider>
            <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'margin-left 0.2s' }}>
                <Header
                    style={{
                        padding: '16px 32px',
                        background: '#fff',
                        boxShadow: designTokens.shadows.base,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        height: '72px',
                    }}
                >
                    <Dropdown menu={{ items: userMenuItems }}>
                        <Space className="cursor-pointer hover:bg-gray-50 px-3 py-2 rounded-lg transition-all">
                            <Avatar
                                src={user?.avatar}
                                icon={!user?.avatar && <UserOutlined />}
                                size={40}
                                style={{
                                    backgroundColor: '#6366f1',
                                    border: '2px solid #f0f0f0'
                                }}
                            />
                            <div className="hidden md:block">
                                <div style={{ fontWeight: 600, fontSize: '14px', lineHeight: '18px' }}>
                                    {user?.firstName || user?.email?.split('@')[0] || 'Super'} {user?.lastName || 'Admin'}
                                </div>
                                <div style={{ fontSize: '12px', color: '#888', lineHeight: '16px' }}>
                                    {user?.userType || 'Admin'}
                                </div>
                            </div>
                        </Space>
                    </Dropdown>
                </Header>
                <div className="p-6 bg-gray-50 min-h-[calc(100vh-64px)]">
                    {children}
                </div>
            </Layout>
        </Layout>
        </>
    );
}