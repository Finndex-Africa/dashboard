import { useTranslations } from "next-intl";
import Result from 'antd/es/result';
import Button from 'antd/es/button';

export default function NotFound() {
    const t_listing = useTranslations("listing");
    const t_nav2 = useTranslations("nav2");
    return (
        <Result
            status="404"
            title={t_listing("agentNotFound")}
            subTitle="The agent you are looking for does not exist or has been removed."
            extra={
                <Button type="primary" href="/agents">
                    {t_nav2("goBackToAgents")}
                </Button>
            }
        />
    );
}