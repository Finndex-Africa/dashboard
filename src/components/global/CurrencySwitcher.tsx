'use client'

import { useTranslations } from 'next-intl'
import Select from 'antd/es/select'
import { DollarOutlined } from '@ant-design/icons'
import { useCurrency } from '@/lib/currency/CurrencyProvider'
import { CURRENCIES, CURRENCY_META, type Currency } from '@/lib/currency/config'

/**
 * Switches the currency every figure in the dashboard is displayed in.
 *
 * Deliberately parallel to LanguageSwitcher: same antd Select, same cookie-
 * backed persistence, same block variant for the mobile drawer. It changes
 * presentation only — listings keep the currency their owner priced them in.
 */
export default function CurrencySwitcher({
    block = false,
}: {
    /** Full-width variant for the mobile drawer / settings page. */
    block?: boolean
}) {
    const t = useTranslations('currencySwitcher')
    const { currency, setCurrency } = useCurrency()

    return (
        <Select<Currency>
            value={currency}
            onChange={setCurrency}
            aria-label={t('changeCurrency')}
            title={t('changeCurrency')}
            style={block ? { width: '100%' } : { width: 140 }}
            suffixIcon={<DollarOutlined />}
            options={CURRENCIES.map((c) => ({
                value: c,
                label: CURRENCY_META[c].label,
            }))}
        />
    )
}
