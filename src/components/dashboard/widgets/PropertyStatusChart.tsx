'use client';

import { useState, useEffect } from 'react';
import { Card, Spin } from 'antd';
import { Pie } from '@ant-design/plots';
import { propertiesApi } from '@/services/api/properties.api';

interface PropertyStatusChartProps {
    userId: string;
    userRole: string;
}

export default function PropertyStatusChart({ userId, userRole }: PropertyStatusChartProps) {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch properties based on user role
                const queryParams = userRole === 'admin' ? {} : { userId };
                const response = await propertiesApi.getAll({ ...queryParams, limit: 1000 });

                // Extract data array from paginated response
                // response.data is PaginatedResponse<Property> with structure { data: Property[], pagination: {...} }
                const properties = response?.data?.data || [];

                // Count properties by status
                const statusCounts: Record<string, number> = {};
                properties.forEach((property: any) => {
                    const status = property.status || 'unknown';
                    statusCounts[status] = (statusCounts[status] || 0) + 1;
                });

                // Convert to chart data format
                const chartData = Object.entries(statusCounts).map(([status, count]) => ({
                    type: status.charAt(0).toUpperCase() + status.slice(1),
                    value: count,
                }));

                setData(chartData);
            } catch (error) {
                console.error('Error fetching property status data:', error);
                setData([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [userId, userRole]);

    const config = {
        appendPadding: 10,
        data,
        angleField: 'value',
        colorField: 'type',
        radius: 0.8,
        label: {
            type: 'outer',
            content: '{name} {percentage}',
        },
        interactions: [
            {
                type: 'element-active',
            },
        ],
        color: ({ type }: any) => {
            const colors: Record<string, string> = {
                Approved: '#52c41a',
                Pending: '#faad14',
                Rejected: '#ff4d4f',
                Rented: '#1890ff',
                Archived: '#8c8c8c',
            };
            return colors[type] || '#d9d9d9';
        },
    };

    if (loading) {
        return (
            <Card bordered={false}>
                <Spin tip="Loading chart..." />
            </Card>
        );
    }

    if (!data.length) {
        return (
            <Card bordered={false}>
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                    No property data available
                </div>
            </Card>
        );
    }

    return (
        <Card bordered={false}>
            <Pie {...config} height={300} />
        </Card>
    );
}
