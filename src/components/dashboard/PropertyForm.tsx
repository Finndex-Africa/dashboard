'use client';

import { useTranslations } from "next-intl";
import { useState, useEffect } from 'react';
import Form from 'antd/es/form';
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
import type { Property } from '@/types/dashboard';
import { showToast } from '@/lib/toast';

const { TextArea } = Input;
const { Text } = Typography;

// Same amenity options as user property form (backend expects { icon, label }[])
const AMENITY_OPTIONS = [
    { value: 'Water', icon: '💧' },
    { value: 'Electricity', icon: '⚡' },
    { value: 'WiFi', icon: '📶' },
    { value: 'Parking', icon: '🚗' },
    { value: 'Security', icon: '🔒' },
    { value: 'Swimming Pool', icon: '🏊' },
    { value: 'Gym', icon: '💪' },
    { value: 'Living Room', icon: '🛋️' },
    { value: 'Porch', icon: '🌿' },
    { value: 'Air Conditioning', icon: '❄️' },
    { value: 'Dining Room', icon: '🍽️' },
    { value: 'Laundry', icon: '🧺' },
    { value: 'Kitchen', icon: '🍳' },
    { value: 'Generator', icon: '⚙️' },
    { value: 'CCTV', icon: '📹' },
    { value: 'Gate', icon: '🚪' },
] as const;

interface PropertyFormProps {
    initialValues?: Partial<Property>;
    onSubmit: (values: Partial<Property>, files: File[], keptImages: string[]) => void;
    onCancel: () => void;
    loading?: boolean;
}

export function PropertyForm({
    initialValues,
    onSubmit,
    onCancel,
    loading,
}: PropertyFormProps) {
    const t_hints = useTranslations("hints");
    const t_common = useTranslations("common");
    const t_errors2 = useTranslations("errors2");
    const t_form = useTranslations("form");
    const t_listing = useTranslations("listing");
    const t_placeholder = useTranslations("placeholder");
    const [form] = Form.useForm();
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

    // Reset form when initialValues changes (modal opens/closes)
    useEffect(() => {
        if (!initialValues) {
            form.resetFields();
            setFileList([]);
            setSelectedAmenities([]);
        } else {
            form.setFieldsValue(initialValues);

            // Sync amenities from saved property (same as user form)
            const savedAmenities = initialValues.amenities as Array<{ label: string }> | undefined;
            if (savedAmenities?.length) {
                setSelectedAmenities(savedAmenities.map((a) => a.label));
            } else {
                setSelectedAmenities([]);
            }

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

    const toggleAmenity = (amenity: string) => {
        setSelectedAmenities((prev) =>
            prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
        );
    };

    const handleSubmit = (values: any) => {
        const amenitiesPayload =
            selectedAmenities.length > 0
                ? selectedAmenities.map((label) => {
                    const opt = AMENITY_OPTIONS.find((a) => a.value === label);
                    return { icon: opt?.icon ?? '•', label };
                })
                : undefined;

        const filesToUpload = fileList
            .filter((file) => file.originFileObj)
            .map((file) => file.originFileObj as File);

        const keptImages = fileList
            .filter((file) => !file.originFileObj && file.url)
            .map((file) => file.url as string);

        onSubmit({ ...values, amenities: amenitiesPayload }, filesToUpload, keptImages);
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
            {/* Basic Information – same order as user form */}
            <div style={{ marginBottom: '24px' }}>
                <Text strong style={{ fontSize: '15px', color: '#667eea', display: 'block', marginBottom: '16px' }}>
                    {t_form("basicInformation")}
                </Text>
                <Row gutter={16}>
                    <Col xs={24}>
                        <Form.Item
                            name="title"
                            label={t_form("propertyTitle")}
                            rules={[{ required: true, message: 'Please enter property title' }]}
                        >
                            <Input
                                size="large"
                                placeholder={t_hints("e_g_luxury_3br_apartment_in_westlands")}
                                style={{ borderRadius: '8px' }}
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24}>
                        <Form.Item
                            name="description"
                            label={t_common("description")}
                            rules={[{ required: true, message: 'Please enter description' }]}
                        >
                            <TextArea
                                rows={4}
                                placeholder={t_placeholder("describeProperty")}
                                style={{ borderRadius: '8px' }}
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Form.Item
                            name="propertyType"
                            label={t_form("propertyType")}
                            rules={[{ required: true, message: 'Please select property type' }]}
                        >
                            <Select
                                size="large"
                                placeholder={t_placeholder("selectType")}
                                style={{ borderRadius: '8px' }}
                            >
                                <Select.Option value="Apartment">Apartment</Select.Option>
                                <Select.Option value="Office Space">Office Space</Select.Option>
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Form.Item
                            name="furnished"
                            label={t_form("furnished")}
                            rules={[{ required: true, message: 'Please select furnished status' }]}
                            initialValue={false}
                        >
                            <Select
                                size="large"
                                placeholder={t_placeholder("selectFurnished")}
                                style={{ borderRadius: '8px' }}
                            >
                                <Select.Option value={true}>Yes - Furnished</Select.Option>
                                <Select.Option value={false}>No - Unfurnished</Select.Option>
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>
            </div>

            <Divider style={{ margin: '24px 0' }} />

            {/* Location – same as user form */}
            <div style={{ marginBottom: '24px' }}>
                <Text strong style={{ fontSize: '15px', color: '#667eea', display: 'block', marginBottom: '16px' }}>
                    {t_common("location")}
                </Text>
                <Row gutter={16}>
                    <Col xs={24}>
                        <Form.Item
                            name="location"
                            label={t_common("location")}
                            rules={[{ required: true, message: 'Please enter location' }]}
                        >
                            <Input
                                size="large"
                                placeholder={t_hints("e_g_westlands_nairobi")}
                                style={{ borderRadius: '8px' }}
                            />
                        </Form.Item>
                    </Col>
                </Row>
            </div>

            <Divider style={{ margin: '24px 0' }} />

            {/* Property Details – same as user form */}
            <div style={{ marginBottom: '24px' }}>
                <Text strong style={{ fontSize: '15px', color: '#667eea', display: 'block', marginBottom: '16px' }}>
                    {t_listing("propertyDetails")}
                </Text>
                <Row gutter={16}>
                    <Col xs={24} sm={12}>
                        <Form.Item
                            name="price"
                            label={t_form("priceUsd")}
                            rules={[{ required: true, message: 'Please enter price' }]}
                        >
                            <InputNumber
                                size="large"
                                style={{ width: '100%', borderRadius: '8px' }}
                                placeholder="0"
                                min={0}
                                formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={(value) => value?.replace(/\$\s?|(,*)/g, '') as any}
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Form.Item name="area" label={t_form("areaSqFt")}>
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
                    <Col xs={24} sm={8}>
                        <Form.Item
                            name="bedrooms"
                            label={t_form("bedrooms")}
                            rules={[{ required: true, message: 'Please enter number of bedrooms' }]}
                        >
                            <InputNumber
                                size="large"
                                style={{ width: '100%', borderRadius: '8px' }}
                                placeholder="0"
                                min={0}
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Form.Item
                            name="bathrooms"
                            label={t_form("bathrooms")}
                            rules={[{ required: true, message: 'Please enter number of bathrooms' }]}
                        >
                            <InputNumber
                                size="large"
                                style={{ width: '100%', borderRadius: '8px' }}
                                placeholder="0"
                                min={0}
                                step={0.5}
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Form.Item name="maxGuests" label={t_form("maxGuests")}>
                            <InputNumber
                                size="large"
                                style={{ width: '100%', borderRadius: '8px' }}
                                placeholder="0"
                                min={1}
                            />
                        </Form.Item>
                    </Col>
                </Row>
            </div>

            {/* Agent Fee */}
            <Divider style={{ margin: '24px 0' }} />
            <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/50 p-4" style={{ marginBottom: '24px' }}>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Agent Fee</h3>
                <p className="text-xs text-gray-600 mb-3">
                    {t_form("agentFeeHelp")}
                </p>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t_form("yourAgentFee")}
                </label>
                <Form.Item
                    name="agentFee"
                    noStyle
                    getValueFromEvent={(e) => {
                        const v = e.target.value;
                        return v === '' ? undefined : Number(v);
                    }}
                >
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-full max-w-xs px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={t_hints("e_g_150")}
                    />
                </Form.Item>
            </div>

            <Divider style={{ margin: '24px 0' }} />

            {/* Amenities – chip grid matching design */}
            <div style={{ marginBottom: '24px' }}>
                <Text strong style={{ fontSize: '15px', color: '#667eea', display: 'block', marginBottom: '8px' }}>
                    {t_listing("amenities")}
                </Text>
                <Text type="secondary" style={{ fontSize: '13px', display: 'block', marginBottom: '16px' }}>
                    {t_placeholder("selectAmenities")}
                </Text>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
                    {AMENITY_OPTIONS.map((amenity) => {
                        const active = selectedAmenities.includes(amenity.value);
                        return (
                            <button
                                key={amenity.value}
                                type="button"
                                onClick={() => toggleAmenity(amenity.value)}
                                style={{
                                    padding: '14px 16px',
                                    borderRadius: '10px',
                                    border: `1.5px solid ${active ? '#667eea' : '#e5e7eb'}`,
                                    background: active ? 'rgba(102, 126, 234, 0.08)' : '#fff',
                                    color: active ? '#667eea' : '#374151',
                                    textAlign: 'left',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                    fontWeight: active ? 600 : 400,
                                }}
                            >
                                <span style={{ fontSize: '22px', lineHeight: 1, flexShrink: 0 }}>{amenity.icon}</span>
                                <span style={{ fontSize: '13px' }}>{amenity.value}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <Divider style={{ margin: '24px 0' }} />

            {/* Images Section */}
            <div style={{ marginBottom: '24px' }}>
                <Text strong style={{ fontSize: '15px', color: '#667eea', display: 'block', marginBottom: '16px' }}>
                    {t_form("propertyImages")}
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
                    {t_placeholder("uploadHelp")}
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
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        border: 'none',
                        borderRadius: '8px',
                        minWidth: '120px'
                    }}
                >
                    {initialValues ? 'Update Property' : 'Add Property'}
                </Button>
            </div>
        </Form>
    );
}
