'use client';

import { useState } from 'react';
import Layout from 'antd/es/layout';
import Menu from 'antd/es/menu';
import Dropdown from 'antd/es/dropdown';
import Drawer from 'antd/es/drawer';
import Space from 'antd/es/space';
import Avatar from 'antd/es/avatar';
import Button from 'antd/es/button';
import Input from 'antd/es/input';
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
    SearchOutlined,
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import { designTokens } from '@/config/theme';
import { Toaster } from 'react-hot-toast';
import { useAuth } from '@/providers/AuthProvider';
import { getRoleRedirectPath } from '@/lib/role-redirects';

const { Search } = Input;

const { Header, Content, Sider } = Layout;

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const [isSearching, setIsSearching] = useState(false);
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

    const handleSearch = (value: string) => {
        if (!value.trim() || isSearching) return;

        setIsSearching(true);
        const searchQuery = encodeURIComponent(value);

        // Clear search value and reset loading state after navigation
        setTimeout(() => {
            setSearchValue('');
            setIsSearching(false);
        }, 500);

        if (pathname.includes('/properties')) {
            router.push(`/properties?search=${searchQuery}`);
            return;
        }

        if (pathname.includes('/services')) {
            router.push(`/services?search=${searchQuery}`);
            return;
        }

        if (pathname.includes('/users')) {
            router.push(`/users?search=${searchQuery}`);
            return;
        }

        if (pathname.includes('/bookings')) {
            router.push(`/bookings?search=${searchQuery}`);
            return;
        }

        // Default to searching properties
        router.push(`/properties?search=${searchQuery}`);
    };

    // User dropdown menu items (top-right profile) - Only profile actions, no navigation
    const userDropdownItems = [
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
            icon: <LogoutOutlined />,
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
                        zIndex: 11,
                    }}
                    className="hidden md:block"
                >
                    {/* Sidebar Logo */}
                    <div
                        className="cursor-pointer flex items-center justify-center py-6 px-4 border-b border-gray-200"
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
                <Layout className="md:ml-[260px]">
                    {/* Header */}
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
                            gap: '24px',
                        }}
                    >
                        {/* Left side: Logo (mobile only) or empty space for balance */}
                        <div className="flex items-center flex-shrink-0" style={{ minWidth: '200px' }}>
                            <div
                                className="cursor-pointer flex items-center md:hidden"
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
                        </div>

                        {/* Center: Search Bar */}
                        <div className="flex-1 flex justify-center items-center">
                            <div className="w-full max-w-xl" style={{ marginTop: '4px' }}>
                                <Search
                                    placeholder="Search properties, services, users..."
                                    allowClear
                                    enterButton={<SearchOutlined />}
                                    size="large"
                                    value={searchValue}
                                    onChange={(e) => setSearchValue(e.target.value)}
                                    onSearch={handleSearch}
                                    loading={isSearching}
                                    disabled={isSearching}
                                    style={{
                                        borderRadius: '24px',
                                    }}
                                />
                            </div>
                        </div>

                        {/* Right side: Burger Menu (mobile only) + User Menu */}
                        <div className="flex items-center gap-2 flex-shrink-0" style={{ minWidth: '200px', justifyContent: 'flex-end' }}>
                            {/* Burger Menu Button - Show only on mobile */}
                            <Button
                                type="text"
                                icon={<MenuOutlined style={{ fontSize: '18px' }} />}
                                onClick={() => setDrawerOpen(true)}
                                className="md:hidden flex items-center justify-center"
                                style={{
                                    width: '42px',
                                    height: '42px',
                                    borderRadius: '50%',
                                    border: '1px solid #ddd',
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
                    <Content style={{ background: '#f7f7f7', minHeight: 'calc(100vh - 80px)', paddingTop: '32px' }}>
                        <div className="max-w-7xl mx-auto px-6">
                            {children}
                        </div>
                    </Content>
                </Layout>
            </Layout>
        </>
    );
}
