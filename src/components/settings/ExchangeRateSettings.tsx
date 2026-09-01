'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Alert from 'antd/es/alert';
import Button from 'antd/es/button';
import Card from 'antd/es/card';
import Descriptions from 'antd/es/descriptions';
import Form from 'antd/es/form';
import InputNumber from 'antd/es/input-number';
import Switch from 'antd/es/switch';
import Tag from 'antd/es/tag';
import Typography from 'antd/es/typography';
import message from 'antd/es/message';
import Spin from 'antd/es/spin';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api-client';

const { Text } = Typography;

type FxSettings = {
    settings: {
        fallbackUsdRwf: number | null;
        overrideEnabled: boolean;
        overrideUsdRwf: number | null;
        updatedByEmail: string | null;
    };
    effective: {
        usdToRwf: number | null;
        provider: 'wise' | 'fallback' | 'identity' | 'override';
        fetchedAt: string;
    };
    wiseConfigured: boolean;
};

/**
 * Admin control over the USD/RWF rate.
 *
 * Shows the rate users are *actually* seeing alongside the configuration, because
 * those diverge whenever Wise is down or an override is active — an admin looking
 * at only the config would draw the wrong conclusion.
 *
 * There is no credential field on purpose: WISE_API_TOKEN lives in environment
 * config so it never reaches the database or a form POST.
 */
export default function ExchangeRateSettings() {
    const t = useTranslations('exchangeRates');
    const [form] = Form.useForm();
    const [data, setData] = useState<FxSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [overrideOn, setOverrideOn] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            // The client unwraps some responses and not others; accept both shapes.
            const res = await apiClient.get<FxSettings>('/currency/settings');
            const payload =
                (res as unknown as { data?: FxSettings })?.data ??
                (res as unknown as FxSettings);
            setData(payload);
            setOverrideOn(payload.settings.overrideEnabled);
            form.setFieldsValue({
                fallbackUsdRwf: payload.settings.fallbackUsdRwf ?? undefined,
                overrideEnabled: payload.settings.overrideEnabled,
                overrideUsdRwf: payload.settings.overrideUsdRwf ?? undefined,
            });
        } catch {
            message.error(t('loadFailed'));
        } finally {
            setLoading(false);
        }
    }, [form, t]);

    useEffect(() => {
        void load();
    }, [load]);

    const onSave = async (values: {
        fallbackUsdRwf?: number;
        overrideEnabled?: boolean;
        overrideUsdRwf?: number;
    }) => {
        setSaving(true);
        try {
            await apiClient.patch('/currency/settings', values);
            message.success(t('saved'));
            await load();
        } catch (error) {
            const detail = (error as { response?: { data?: { message?: string } } })
                ?.response?.data?.message;
            message.error(detail || t('saveFailed'));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Card title={t('title')}>
                <Spin />
            </Card>
        );
    }

    const provider = data?.effective.provider ?? 'identity';
    const providerTag = {
        wise: <Tag color="green">{t('sourceLive')}</Tag>,
        override: <Tag color="blue">{t('sourceOverride')}</Tag>,
        fallback: <Tag color="orange">{t('sourceFallback')}</Tag>,
        identity: <Tag>{t('sourceNone')}</Tag>,
    }[provider];

    return (
        <Card title={t('title')}>
            <div className="space-y-4">
                <Text type="secondary">{t('help')}</Text>

                {!data?.wiseConfigured && (
                    <Alert
                        type="warning"
                        showIcon
                        message={t('wiseNotConfigured')}
                        description={t('wiseNotConfiguredHelp')}
                    />
                )}

                {data?.effective.usdToRwf == null && (
                    <Alert
                        type="error"
                        showIcon
                        message={t('noRate')}
                        description={t('noRateHelp')}
                    />
                )}

                <Descriptions bordered size="small" column={1}>
                    <Descriptions.Item label={t('effectiveRate')}>
                        {data?.effective.usdToRwf
                            ? `1 USD = ${data.effective.usdToRwf.toLocaleString()} RWF`
                            : '—'}
                    </Descriptions.Item>
                    <Descriptions.Item label={t('source')}>{providerTag}</Descriptions.Item>
                    <Descriptions.Item label={t('updated')}>
                        {data?.effective.fetchedAt
                            ? new Date(data.effective.fetchedAt).toLocaleString()
                            : '—'}
                    </Descriptions.Item>
                    {data?.settings.updatedByEmail && (
                        <Descriptions.Item label={t('changedBy')}>
                            {data.settings.updatedByEmail}
                        </Descriptions.Item>
                    )}
                </Descriptions>

                <Form form={form} layout="vertical" onFinish={onSave} className="max-w-md pt-2">
                    <Form.Item
                        name="fallbackUsdRwf"
                        label={t('fallbackLabel')}
                        extra={t('fallbackHelp')}
                        rules={[{ type: 'number', min: 0.000001, max: 1000000 }]}
                    >
                        <InputNumber className="w-full" addonBefore="1 USD =" addonAfter="RWF" />
                    </Form.Item>

                    <Form.Item
                        name="overrideEnabled"
                        label={t('overrideLabel')}
                        valuePropName="checked"
                        extra={t('overrideHelp')}
                    >
                        <Switch onChange={setOverrideOn} />
                    </Form.Item>

                    <Form.Item
                        name="overrideUsdRwf"
                        label={t('overrideRateLabel')}
                        rules={[
                            // Mirrors the server rule: enabling an override without a
                            // rate would silently fall through to the live provider.
                            { required: overrideOn, message: t('overrideRateRequired') },
                            { type: 'number', min: 0.000001, max: 1000000 },
                        ]}
                    >
                        <InputNumber
                            className="w-full"
                            disabled={!overrideOn}
                            addonBefore="1 USD ="
                            addonAfter="RWF"
                        />
                    </Form.Item>

                    <Button type="primary" htmlType="submit" loading={saving}>
                        {t('save')}
                    </Button>
                </Form>
            </div>
        </Card>
    );
}
