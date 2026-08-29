'use client';

import React, { useState } from 'react';
import Card from 'antd/es/card';
import Spin from 'antd/es/spin';
import Typography from 'antd/es/typography';
import { useTranslations } from 'next-intl';
import LanguageSwitcher from '@/components/global/LanguageSwitcher';

const { Title, Text } = Typography;

export default function SettingsPage() {
    const t = useTranslations('settings');
    const [loading] = useState(false);

    return (
        <div className="space-y-6">
            <Title level={2}>{t('title')}</Title>

            {loading ? (
                <div className="flex justify-center items-center min-h-[400px]">
                    <Spin size="large" />
                </div>
            ) : (
                <Card title={t('language')}>
                    <div className="space-y-3 max-w-sm">
                        <Text type="secondary">{t('languageHelp')}</Text>
                        <LanguageSwitcher block />
                    </div>
                </Card>
            )}
        </div>
    );
}
