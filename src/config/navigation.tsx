import React from 'react';
import {
    DashboardOutlined,
    HomeOutlined,
    UserOutlined,
    TeamOutlined,
    SettingOutlined,
    FileTextOutlined,
    CheckCircleOutlined,
    ShopOutlined,
    MessageOutlined,
    BellOutlined,
} from '@ant-design/icons';
import type { SidebarMenuItem } from '@/types/dashboard';
import type { UserRole } from '@/types/users';

/**
 * Navigation menu items with role-based access control
 * Only items with roles matching the user's role will be displayed
 */
export const navigationMenu: SidebarMenuItem[] = [
    {
        key: 'dashboard',
        label: 'Overview',
        icon: <DashboardOutlined />,
        path: '/dashboard',
        roles: ['admin', 'agent', 'landlord', 'service_provider', 'home_seeker'],
    },
    {
        key: 'properties',
        label: 'Properties',
        icon: <HomeOutlined />,
        path: '/properties',
        roles: ['admin', 'agent', 'landlord'],
    },
    {
        key: 'services',
        label: 'Services',
        icon: <ShopOutlined />,
        path: '/services',
        roles: ['admin', 'service_provider'],
    },
    {
        key: 'agents',
        label: 'Agents',
        icon: <TeamOutlined />,
        path: '/agents',
        roles: ['admin'],
    },
    {
        key: 'users',
        label: 'Users',
        icon: <TeamOutlined />,
        path: '/users',
        roles: ['admin'],
    },
    {
        key: 'messages',
        label: 'Messages',
        icon: <MessageOutlined />,
        path: '/messages',
        roles: ['admin', 'agent', 'landlord', 'service_provider'],
    },
    {
        key: 'notifications',
        label: 'Notifications',
        icon: <BellOutlined />,
        path: '/notifications',
        roles: ['admin', 'agent', 'landlord', 'service_provider', 'home_seeker'],
    },
    {
        key: 'profile',
        label: 'Profile',
        icon: <UserOutlined />,
        path: '/profile',
        roles: ['admin', 'agent', 'landlord', 'service_provider', 'home_seeker'],
    },
    {
        key: 'settings',
        label: 'Settings',
        icon: <SettingOutlined />,
        path: '/settings',
        roles: ['admin'],
    },
];

/**
 * Filter menu items based on user role
 */
export const filterMenuByRole = (
    menu: SidebarMenuItem[],
    userRole: UserRole
): SidebarMenuItem[] => {
    return menu
        .filter((item) => item.roles.includes(userRole))
        .map((item) => {
            if (item.children) {
                return {
                    ...item,
                    children: filterMenuByRole(item.children, userRole),
                };
            }
            return item;
        })
        .filter((item) => !item.children || item.children.length > 0);
};

/**
 * Get default route for user role
 */
export const getDefaultRoute = (userRole: UserRole): string => {
    const roleRoutes: Partial<Record<UserRole, string>> = {
        admin: '/dashboard',
        agent: '/dashboard',
        landlord: '/dashboard',
        service_provider: '/dashboard',
        home_seeker: '/dashboard',
    };

    return roleRoutes[userRole] || '/';
};