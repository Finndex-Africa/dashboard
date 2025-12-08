'use client';

import { Card, Empty } from 'antd';

export default function SavedProperties({ userId }: { userId: string }) {
    return (
        <Card bordered={false}>
            <Empty description="No saved properties yet" />
        </Card>
    );
}
