'use client';

import { Card, Empty } from 'antd';

export default function UserGrowthChart({ userId, userRole }: { userId: string; userRole: string }) {
    return (
        <Card bordered={false}>
            <Empty description="UserGrowthChart - Coming Soon" />
        </Card>
    );
}
