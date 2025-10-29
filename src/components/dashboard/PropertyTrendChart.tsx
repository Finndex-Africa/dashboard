'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const Line = dynamic(
    () => import('@ant-design/plots').then((mod) => mod.Line),
    { ssr: false }
);

interface ChartData {
    date: string;
    value: number;
    category: string;
}

interface PropertyTrendChartProps {
    data: ChartData[];
}

export function PropertyTrendChart({ data }: PropertyTrendChartProps) {
    if (!data) return null;

    const config = {
        data,
        padding: 'auto',
        xField: 'date',
        yField: 'value',
        seriesField: 'category',
        legend: {
            position: 'top',
        },
        smooth: true,
        animation: {
            appear: {
                animation: 'path-in',
                duration: 1000,
            },
        },
        color: ['#1890ff', '#52c41a'],
        height: 300,
        xAxis: {
            type: 'time',
            tickCount: 6,
        },
        yAxis: {
            title: {
                text: 'Number of Properties',
            },
            grid: {
                line: {
                    style: {
                        stroke: '#E5E7EB',
                        lineWidth: 1,
                        lineDash: [4, 5],
                        strokeOpacity: 0.7,
                    },
                },
            },
        },
        tooltip: {
            showMarkers: true,
        },
        point: {
            size: 4,
            shape: 'circle',
            style: {
                fill: '#fff',
                stroke: '#1890ff',
                lineWidth: 2,
            },
        },
    };

    return (
        <div style={{ width: '100%', height: '300px' }}>
            <Line {...config} />
        </div>
    );
}