'use client';

import Card from 'antd/es/card';
import Row from 'antd/es/row';
import Col from 'antd/es/col';
import Statistic from 'antd/es/statistic';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { ReactNode } from 'react';

interface KPIData {
    title: string;
    value: number;
    change?: number;
    trend?: 'up' | 'down' | 'neutral';
    icon?: ReactNode;
    prefix?: string;
    suffix?: string;
}

interface KPICardsGridProps {
    kpiData: KPIData[];
}

export function KPICardsGrid({ kpiData }: KPICardsGridProps) {
    return (
        <Row gutter={[16, 16]}>
            {kpiData.map((kpi, index) => (
                <Col xs={24} sm={12} lg={6} key={index}>
                    <Card bordered={false} className="h-full">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <p className="text-gray-500 text-sm mb-2">{kpi.title}</p>
                                <Statistic
                                    value={kpi.value}
                                    prefix={kpi.prefix}
                                    suffix={kpi.suffix}
                                    valueStyle={{ fontSize: '24px', fontWeight: 'bold' }}
                                />
                                {kpi.change !== undefined && (
                                    <div className="mt-2">
                                        <span
                                            className={`text-sm ${
                                                kpi.trend === 'up'
                                                    ? 'text-green-500'
                                                    : kpi.trend === 'down'
                                                    ? 'text-red-500'
                                                    : 'text-gray-500'
                                            }`}
                                        >
                                            {kpi.trend === 'up' ? (
                                                <ArrowUpOutlined />
                                            ) : kpi.trend === 'down' ? (
                                                <ArrowDownOutlined />
                                            ) : null}{' '}
                                            {kpi.change > 0 ? '+' : ''}
                                            {kpi.change}%
                                        </span>
                                    </div>
                                )}
                            </div>
                            {kpi.icon && (
                                <div
                                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                                    style={{ backgroundColor: '#1890ff20' }}
                                >
                                    <div style={{ fontSize: 24, color: '#1890ff' }}>{kpi.icon}</div>
                                </div>
                            )}
                        </div>
                    </Card>
                </Col>
            ))}
        </Row>
    );
}
