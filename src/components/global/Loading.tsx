import React from 'react';
import Spin from 'antd/es/spin';

interface LoadingProps {
    height?: number | string;
    tip?: string;
}

export function Loading({ height = 400, tip = 'Loading...' }: LoadingProps) {
    return (
        <div
            className="flex justify-center items-center"
            style={{ minHeight: typeof height === 'number' ? `${height}px` : height }}
        >
            <Spin size="large" tip={tip} />
        </div>
    );
}