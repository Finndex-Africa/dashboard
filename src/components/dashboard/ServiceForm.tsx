'use client';

import { useTranslations } from "next-intl";
import { useState, useEffect } from 'react';
import Form from 'antd/es/form';
import { CURRENCIES, CURRENCY_META, DEFAULT_CURRENCY, type Currency } from '@/lib/currency/config';
import Input from 'antd/es/input';
import InputNumber from 'antd/es/input-number';
import Select from 'antd/es/select';
import Button from 'antd/es/button';
import Row from 'antd/es/row';
import Col from 'antd/es/col';
import Divider from 'antd/es/divider';
import Typography from 'antd/es/typography';
import Upload from 'antd/es/upload';
import { PlusOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import type { Service } from '@/types/dashboard';
import { showToast } from '@/lib/toast';
import { SERVICE_CATEGORY_OPTIONS } from '@/lib/service-categories';

const { TextArea } = Input;
const { Text } = Typography;

interface ServiceFormProps {
    initialValues?: Partial<Service>;
    onSubmit: (values: Partial<Service>, files: File[], keptImages: string[]) => void;
    onCancel: () => void;
    loading?: boolean;
}

export function ServiceForm({
    initialValues,
    onSubmit,
    onCancel,
    loading,
}: ServiceFormProps) {
    const t_hints = useTranslations("hints");
    const t_common = useTranslations("common");
    const t_errors2 = useTranslations("errors2");
    const t_form = useTranslations("form");
    const t_listing = useTranslations("listing");
    const t_placeholder = useTranslations("placeholder");
    const [form] = Form.useForm();
    /* Price label, prefix and precision all follow the chosen currency. */
    const selectedCurrency: Currency =
        (Form.useWatch('currency', form) as Currency) ?? DEFAULT_CURRENCY;
    const currencyMeta = CURRENCY_META[selectedCurrency] ?? CURRENCY_META[DEFAULT_CURRENCY];

    const [fileList, setFileList] = useState<UploadFile[]>([]);

    // Reset form when initialValues changes (modal opens/closes)
    useEffect(() => {
        if (!initialValues) {
            form.resetFields();
            setFileList([]);
        } else {
            form.setFieldsValue(initialValues);

            // Convert existing images to UploadFile format
            if (initialValues.images && initialValues.images.length > 0) {
                const existingFiles: UploadFile[] = initialValues.images.map((url, index) => ({
                    uid: `-existing-${index}`,
                    name: `image-${index}.jpg`,
                    status: 'done',
                    url: url,
                }));
                setFileList(existingFiles);
            }
        }
    }, [initialValues, form]);

    const handleSubmit = (values: any) => {
        const filesToUpload = fileList
            .filter(file => file.originFileObj)
            .map(file => file.originFileObj as File);

        const keptImages = fileList
            .filter((file) => !file.originFileObj && file.url)
            .map((file) => file.url as string);

        onSubmit(values, filesToUpload, keptImages);
    };

    const handleUploadChange = ({ fileList: newFileList }: any) => {
        setFileList(newFileList);
    };

    const beforeUpload = (file: File) => {
        const isImage = file.type.startsWith('image/');
        if (!isImage) {
            showToast.error(t_errors2("imageOnly"));
            return Upload.LIST_IGNORE;
        }
        const isLt10M = file.size / 1024 / 1024 < 10;
        if (!isLt10M) {
            showToast.error(t_errors2("imageMax10"));
            return Upload.LIST_IGNORE;
        }
        return false; // Prevent auto upload, we'll handle it manually
    };

    return (
        <Form
            form={form}
            layout="vertical"
            initialValues={initialValues}
            onFinish={handleSubmit}
            style={{ marginTop: '20px' }}
        >
            {/* Basic Information Section */}
            <div style={{ marginBottom: '24px' }}>
                <Text strong style={{ fontSize: '15px', color: '#4facfe', display: 'block', marginBottom: '16px' }}>
                    {t_form("basicInformation")}
                </Text>
                <Row gutter={16}>
                    <Col xs={24}>
                        <Form.Item
                            name="title"
                            label="Service ame"
                            rules={[{ required: true, message: 'Please enter service name' }]}
                        >
                            <Input
                                size="large"
                                placeholder={t_hints("e_g_professional_cleaning_service")}
                                style={{ borderRadius: '8px' }}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col xs={24} sm={12}>
                        <Form.Item
                            name="category"
                            label={t_common("category")}
                            rules={[{ required: true, message: 'Please select category' }]}
                        >
                            <Select
                                size="large"
                                placeholder={t_placeholder("selectCategory")}
                                style={{ borderRadius: '8px' }}
                            >
                                {SERVICE_CATEGORY_OPTIONS.map((cat) => (
                                    <Select.Option key={cat.value} value={cat.value}>
                                        {cat.label}
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Form.Item
                            name="location"
                            label={t_common("location")}
                            rules={[{ required: true, message: 'Please enter location' }]}
                        >
                            <Input
                                size="large"
                                placeholder={t_hints("e_g_paynesville_city_montserrado")}
                                style={{ borderRadius: '8px' }}
                            />
                        </Form.Item>
                    </Col>
                </Row>
            </div>

            <Divider style={{ margin: '24px 0' }} />

            {/* Business Details Section */}
            <div style={{ marginBottom: '24px' }}>
                <Text strong style={{ fontSize: '15px', color: '#4facfe', display: 'block', marginBottom: '16px' }}>
                    {t_listing("businessDetails")}
                </Text>
                <Row gutter={16}>
                    <Col xs={24} sm={12}>
                        <Form.Item
                            name="businessName"
                            label={t_form("businessName")}
                        >
                            <Input
                                size="large"
                                placeholder={t_hints("e_g_abc_services_ltd")}
                                style={{ borderRadius: '8px' }}
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Form.Item
                            name="experience"
                            label={t_form("yearsOfExperience")}
                        >
                            <InputNumber
                                size="large"
                                style={{ width: '100%', borderRadius: '8px' }}
                                placeholder="0"
                                min={0}
                            />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col xs={24} sm={12}>
                        <Form.Item
                            name="phoneNumber"
                            label={t_form("phoneNumber")}
                        >
                            <Input
                                size="large"
                                placeholder={t_hints("e_g_231886149219")}
                                style={{ borderRadius: '8px' }}
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Form.Item
                            name="whatsappNumber"
                            label={t_form("whatsappNumber")}
                        >
                            <Input
                                size="large"
                                placeholder={t_hints("e_g_231886149219")}
                                style={{ borderRadius: '8px' }}
                            />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col xs={24}>
                        <Form.Item
                            name="verificationNumber"
                            label={t_form("licenseNumber")}
                        >
                            <Input
                                size="large"
                                placeholder={t_hints("e_g_lic_12345")}
                                style={{ borderRadius: '8px' }}
                            />
                        </Form.Item>
                    </Col>
                </Row>
            </div>

            <Divider style={{ margin: '24px 0' }} />

            {/* Pricing Section */}
            <div style={{ marginBottom: '24px' }}>
                <Text strong style={{ fontSize: '15px', color: '#4facfe', display: 'block', marginBottom: '16px' }}>
                    {t_form("pricingDuration")}
                </Text>
                <Row gutter={16}>
                    <Col xs={24} sm={8}>
                        <Form.Item
                            name="price"
                            label={`${t_common("price")} (${currencyMeta.label}) - ${t_common("optional")}`}
                        >
                            <InputNumber
                                size="large"
                                style={{ width: '100%', borderRadius: '8px' }}
                                placeholder={t_placeholder("enterPriceOptional")}
                                min={0}
                                // RWF has no minor unit — offering cents there is wrong.
                                precision={currencyMeta.decimals}
                                formatter={(value) => `${currencyMeta.symbol} ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={(value) => String(value ?? '').replace(/[^0-9.]/g, '') as any}
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Form.Item
                            name="currency"
                            label="Currency"
                            initialValue={DEFAULT_CURRENCY}
                        >
                            <Select size="large" style={{ borderRadius: '8px' }}>
                                {CURRENCIES.map((c) => (
                                    <Select.Option key={c} value={c}>
                                        {CURRENCY_META[c].label}
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Form.Item
                            name="priceUnit"
                            label={t_form("priceUnit")}
                            initialValue="hour"
                        >
                            <Select
                                size="large"
                                placeholder={t_placeholder("selectUnit")}
                                style={{ borderRadius: '8px' }}
                            >
                                <Select.Option value="hour">Per Hour</Select.Option>
                                <Select.Option value="day">Per Day</Select.Option>
                                <Select.Option value="week">Per Week</Select.Option>
                                <Select.Option value="month">Per Month</Select.Option>
                                <Select.Option value="project">Per Project</Select.Option>
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col xs={24}>
                        <Form.Item
                            name="duration"
                            label={t_form("typicalDuration")}
                        >
                            <Input
                                size="large"
                                placeholder={t_hints("e_g_2_3_hours")}
                                style={{ borderRadius: '8px' }}
                            />
                        </Form.Item>
                    </Col>
                </Row>
            </div>

            <Divider style={{ margin: '24px 0' }} />

            {/* Description Section */}
            <div style={{ marginBottom: '24px' }}>
                <Text strong style={{ fontSize: '15px', color: '#4facfe', display: 'block', marginBottom: '16px' }}>
                    {t_common("description")}
                </Text>
                <Form.Item
                    name="description"
                    label={t_form("serviceDescription")}
                    rules={[{ required: true, message: 'Please enter description' }]}
                >
                    <TextArea
                        rows={5}
                        placeholder="Provide a detailed description of the service, including what's included and any special features..."
                        style={{ borderRadius: '8px' }}
                    />
                </Form.Item>
            </div>

            <Divider style={{ margin: '24px 0' }} />

            {/* Images Section */}
            <div style={{ marginBottom: '24px' }}>
                <Text strong style={{ fontSize: '15px', color: '#4facfe', display: 'block', marginBottom: '16px' }}>
                    Service Images <span style={{ color: '#ff4d4f' }}>*</span>
                </Text>
                <Upload
                    listType="picture-card"
                    fileList={fileList}
                    onChange={handleUploadChange}
                    beforeUpload={beforeUpload}
                    customRequest={({ onSuccess }) => {
                        // Just mark as done - actual upload happens on form submit
                        setTimeout(() => {
                            onSuccess?.('ok');
                        }, 0);
                    }}
                    multiple
                    maxCount={10}
                >
                    {fileList.length < 10 && (
                        <div>
                            <PlusOutlined />
                            <div style={{ marginTop: 8 }}>Upload</div>
                        </div>
                    )}
                </Upload>
                <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '8px' }}>
                    Upload at least 1 image (up to 10). Max size: 10MB per image. Images will be uploaded to digital ocean.
                </Text>
            </div>

            {/* Action Buttons */}
            <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                paddingTop: '16px',
                borderTop: '1px solid #f0f0f0',
                marginTop: '24px'
            }}>
                <Button
                    size="large"
                    onClick={onCancel}
                    style={{ borderRadius: '8px', minWidth: '100px' }}
                >
                    {t_common("cancel")}
                </Button>
                <Button
                    type="primary"
                    size="large"
                    htmlType="submit"
                    loading={loading}
                    style={{
                        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                        border: 'none',
                        borderRadius: '8px',
                        minWidth: '120px'
                    }}
                >
                    {initialValues ? 'Update Service' : 'Add Service'}
                </Button>
            </div>
        </Form>
    );
}
