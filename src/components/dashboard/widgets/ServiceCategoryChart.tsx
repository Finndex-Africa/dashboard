'use client';

import { Card, Empty } from 'antd';

export default function ServiceCategoryChart({ userId, userRole }: { userId: string; userRole: string }) {
    return (
        <Card bordered={false}>
            <Empty description="ServiceCategoryChart - Coming Soon" />
        </Card>
    );
}
