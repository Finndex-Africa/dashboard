'use client';

import { Card, Empty } from 'antd';

export default function BookingsChart({ userId, userRole }: { userId: string; userRole: string }) {
    return (
        <Card bordered={false}>
            <Empty description="BookingsChart - Coming Soon" />
        </Card>
    );
}
