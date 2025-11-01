'use client';

import Typography from 'antd/es/typography';
import Card from 'antd/es/card';
import Button from 'antd/es/button';
import Select from 'antd/es/select';
import {
    EyeOutlined,
    DollarOutlined,
    ShoppingOutlined,
    TeamOutlined,
    MoreOutlined,
} from '@ant-design/icons';
import { KPICardsGrid } from '@/components/dashboard/KPICard';
import { PaymentsChart } from '@/components/dashboard/PaymentsChart';
import { PropertiesTable } from '@/components/dashboard/PropertiesTable';

const { Title } = Typography;

export default function DashboardPage() {
    const kpiData = [
        {
            title: 'Total Views',
            value: 3456,
            change: 0.43,
            trend: 'up' as const,
            icon: <EyeOutlined />,
        },
        {
            title: 'Total Profit',
            value: 42200,
            change: 4.35,
            trend: 'up' as const,
            prefix: '$',
            icon: <DollarOutlined />,
        },
        {
            title: 'Total Products',
            value: 2450,
            change: 2.59,
            trend: 'up' as const,
            icon: <ShoppingOutlined />,
        },
        {
            title: 'Total Users',
            value: 3465,
            change: 1.45,
            trend: 'up' as const,
            icon: <TeamOutlined />,
        },
    ];

    const paymentsData = Array.from({ length: 12 }, (_, i) => ({
        date: new Date(2025, i, 1).toLocaleString('default', { month: 'short' }),
        amount: Math.floor(Math.random() * 50000) + 20000,
        type: 'received',
    })).concat(
        Array.from({ length: 12 }, (_, i) => ({
            date: new Date(2025, i, 1).toLocaleString('default', { month: 'short' }),
            amount: Math.floor(Math.random() * 40000) + 15000,
            type: 'due',
        }))
    );

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <Title level={2} className="!mb-0">Dashboard</Title>
                <Select
                    defaultValue="monthly"
                    style={{ width: 120 }}
                    options={[
                        { value: 'daily', label: 'Daily' },
                        { value: 'weekly', label: 'Weekly' },
                        { value: 'monthly', label: 'Monthly' },
                        { value: 'yearly', label: 'Yearly' },
                    ]}
                />
            </div>

            <KPICardsGrid kpiData={kpiData} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PaymentsChart data={paymentsData} />

                <Card bordered={false} className="h-full">
                    <div className="flex justify-between items-center mb-6">
                        <Title level={4} className="!mb-0">Profit this Week</Title>
                        <Button type="text" icon={<MoreOutlined />} />
                    </div>
                    {/* Add profit chart component here */}
                </Card>
            </div>

            <Card>
                <div className="flex justify-between items-center mb-6">
                    <Title level={4} className="!mb-0">Recent Transactions</Title>
                    <Button type="primary">View All</Button>
                </div>
                <PropertiesTable properties={[]} />
            </Card>
        </div>
    );
}