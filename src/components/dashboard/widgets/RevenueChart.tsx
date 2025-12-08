'use client';

import { Card, Empty } from 'antd';

export default function RevenueChart({ userId, userRole }: { userId: string; userRole: string }) {
    return (
        <Card bordered={false}>
            <Empty description="RevenueChart - Coming Soon" />
        </Card>
    );
}
