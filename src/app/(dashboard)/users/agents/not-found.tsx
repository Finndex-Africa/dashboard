import Result from 'antd/es/result';
import Button from 'antd/es/button';

export default function NotFound() {
    return (
        <Result
            status="404"
            title="Agent Not Found"
            subTitle="The agent you are looking for does not exist or has been removed."
            extra={
                <Button type="primary" href="/agents">
                    Go Back to Agents
                </Button>
            }
        />
    );
}