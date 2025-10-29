import Skeleton from 'antd/es/skeleton';
import Card from 'antd/es/card';

export default function LoadingAgents() {
    return (
        <div className="space-y-6">
            <Skeleton active paragraph={{ rows: 0 }} className="w-48" />

            <Card>
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} active avatar paragraph={{ rows: 2 }} />
                    ))}
                </div>
            </Card>
        </div>
    );
}
