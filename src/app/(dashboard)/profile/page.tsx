'use client';

import React, { useState } from 'react';
import Card from 'antd/es/card';
import Spin from 'antd/es/spin';
import Typography from 'antd/es/typography';

const { Title } = Typography;

export default function ProfilePage() {
    const [loading] = useState(false);

    return (
        <div className="space-y-6">
            <Title level={2}>Profile</Title>

            {loading ? (
                <div className="flex justify-center items-center min-h-[400px]">
                    <Spin size="large" />
                </div>
            ) : (
                <Card>
                    <p>Profile page content will go here</p>
                </Card>
            )}
        </div>
    );
}