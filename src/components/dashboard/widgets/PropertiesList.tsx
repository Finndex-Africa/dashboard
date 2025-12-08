'use client';

import { Card, Empty } from 'antd';

export default function PropertiesList({ userId, userRole }: { userId: string; userRole: string }) {
    return (
        <Card bordered={false}>
            <Empty description="PropertiesList - Coming Soon" />
        </Card>
    );
}
