'use client';

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
    { value: 'Garden', icon: '🌳' },
    { value: 'Balcony', icon: '🏠' },
    { value: 'Air Conditioning', icon: '❄️' },
    { value: 'Heating', icon: '🔥' },
    { value: 'Laundry', icon: '🧺' },
    { value: 'Elevator', icon: '🛗' },
    { value: 'Generator', icon: '⚙️' },
    { value: 'CCTV', icon: '📹' },
    { value: 'Gate', icon: '🚪' },
] as const;

interface PropertyFormProps {
    initialValues?: Partial<Property>;
    onSubmit: (values: Partial<Property>, files: File[]) => void;
    onCancel: () => void;
    loading?: boolean;
}

export function PropertyForm({
    initialValues,
    onSubmit,
    onCancel,
    loading,
}: PropertyFormProps) {
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

        onSubmit({ ...values, amenities: amenitiesPayload }, filesToUpload);
    };

    const handleUploadChange = ({ fileList: newFileList }: any) => {
        setFileList(newFileList);
    };

    const beforeUpload = (file: File) => {
        const isImage = file.type.startsWith('image/');
        if (!isImage) {
            showToast.error('You can only upload image files!');
            return Upload.LIST_IGNORE;
        }
        const isLt10M = file.size / 1024 / 1024 < 10;
        if (!isLt10M) {
            showToast.error('Image must be smaller than 10MB!');
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
                    Basic Information
                </Text>
                <Row gutter={16}>
                    <Col xs={24}>
                        <Form.Item
                            name="title"
                            label="Property Title"
                            rules={[{ required: true, message: 'Please enter property title' }]}
                        >
                            <Input
                                size="large"
                                placeholder="e.g., Luxury 3BR Apartment in Westlands"
                                style={{ borderRadius: '8px' }}
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24}>
                        <Form.Item
                            name="description"
                            label="Description"
                            rules={[{ required: true, message: 'Please enter description' }]}
                        >
                            <TextArea
                                rows={4}
                                placeholder="Describe your property..."
                                style={{ borderRadius: '8px' }}
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Form.Item
                            name="propertyType"
                            label="Property Type"
                            rules={[{ required: true, message: 'Please select property type' }]}
                        >
                            <Select
                                size="large"
                                placeholder="Select type"
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
                            label="Furnished"
                            rules={[{ required: true, message: 'Please select furnished status' }]}
                            initialValue={false}
                        >
                            <Select
                                size="large"
                                placeholder="Select furnished status"
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
                    Location
                </Text>
                <Row gutter={16}>
                    <Col xs={24}>
                        <Form.Item
                            name="location"
                            label="Location"
                            rules={[{ required: true, message: 'Please enter location' }]}
                        >
                            <Input
                                size="large"
                                placeholder="e.g., Westlands, Nairobi"
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
                    Property Details
                </Text>
                <Row gutter={16}>
                    <Col xs={24} sm={12}>
                        <Form.Item
                            name="price"
                            label="Price (USD)"
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
                        <Form.Item name="area" label="Area (sq ft)">
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
                            label="Bedrooms"
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
                            label="Bathrooms"
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
                        <Form.Item name="maxGuests" label="Max Guests">
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

            <Divider style={{ margin: '24px 0' }} />

            {/* Amenities – same chip grid as user form with yellow selected state */}
            <div style={{ marginBottom: '24px' }}>
                <Text strong style={{ fontSize: '15px', color: '#667eea', display: 'block', marginBottom: '8px' }}>
                    Amenities
                </Text>
                <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '12px' }}>
                    Select the amenities available in this property
                </Text>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
                    {AMENITY_OPTIONS.map((amenity) => (
                        <button
                            key={amenity.value}
                            type="button"
                            onClick={() => toggleAmenity(amenity.value)}
                            style={{
                                padding: '12px',
                                borderRadius: '8px',
                                border: `2px solid ${selectedAmenities.includes(amenity.value) ? '#ffcc00' : '#e5e7eb'}`,
                                background: selectedAmenities.includes(amenity.value) ? 'rgba(255, 204, 0, 0.15)' : '#fff',
                                color: selectedAmenities.includes(amenity.value) ? '#111' : '#374151',
                                textAlign: 'left',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                cursor: 'pointer',
                            }}
                        >
                            <span style={{ fontSize: '20px' }}>{amenity.icon}</span>
                            <span style={{ fontSize: '13px', fontWeight: 500 }}>{amenity.value}</span>
                            {selectedAmenities.includes(amenity.value) && (
                                <svg
                                    style={{ marginLeft: 'auto', width: 20, height: 20, color: '#ffcc00' }}
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <Divider style={{ margin: '24px 0' }} />

            {/* Images Section */}
            <div style={{ marginBottom: '24px' }}>
                <Text strong style={{ fontSize: '15px', color: '#667eea', display: 'block', marginBottom: '16px' }}>
                    Property Images
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
                    Upload up to 10 images. Max size: 10MB per image. Images will be uploaded to digital ocean.
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
                    Cancel
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
