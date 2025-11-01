'use client';

import { useState } from 'react';
import Card from 'antd/es/card';
import Typography from 'antd/es/typography';
import Button from 'antd/es/button';
import { MoreOutlined } from '@ant-design/icons';
import { Column } from '@ant-design/plots';

const { Title } = Typography;

interface PaymentData {
    date: string;
    amount: number;
    type: string;
}

interface PaymentsChartProps {
    data: PaymentData[];
}

export function PaymentsChart({ data }: PaymentsChartProps) {
    const config = {
        data,
        xField: 'date',
        yField: 'amount',
        seriesField: 'type',
        isGroup: true,
        columnStyle: {
            radius: [8, 8, 0, 0],
        },
        color: ['#1890ff', '#52c41a'],
        legend: {
            position: 'top-right' as const,
        },
        label: false,
        xAxis: {
            label: {
                autoRotate: false,
            },
        },
        yAxis: {
            label: {
                formatter: (v: string) => `$${Number(v).toLocaleString()}`,
            },
        },
        tooltip: {
            formatter: (datum: any) => ({
                name: datum.type === 'received' ? 'Received' : 'Due',
                value: `$${datum.amount.toLocaleString()}`,
            }),
        },
    };

    return (
        <Card bordered={false} className="h-full">
            <div className="flex justify-between items-center mb-6">
                <Title level={4} className="!mb-0">Payment Overview</Title>
                <Button type="text" icon={<MoreOutlined />} />
            </div>
            <Column {...config} />
        </Card>
    );
}
