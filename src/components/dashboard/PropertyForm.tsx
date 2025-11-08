'use client';

import { useState } from 'react';
import Form from 'antd/es/form';
import Input from 'antd/es/input';
import InputNumber from 'antd/es/input-number';
import Select from 'antd/es/select';
import Button from 'antd/es/button';
import Row from 'antd/es/row';
import Col from 'antd/es/col';
import Divider from 'antd/es/divider';
import Space from 'antd/es/space';
import Typography from 'antd/es/typography';
import Upload from 'antd/es/upload';
import Checkbox from 'antd/es/checkbox';
import { PlusOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import type { Property } from '@/types/dashboard';
import { showToast } from '@/lib/toast';

const { TextArea } = Input;
const { Text } = Typography;

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

    const handleSubmit = async (values: any) => {
        // Extract actual File objects from fileList
        const filesToUpload = fileList
            .filter(file => file.originFileObj)
            .map(file => file.originFileObj as File);

        console.log('📸 Files to upload:', filesToUpload.length, filesToUpload);
        console.log('📋 Form values:', values);

        // Pass form values and files to parent
        // Parent will create property first, then upload images with property ID
        onSubmit(values, filesToUpload);
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
            {/* Basic Information Section */}
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
                </Row>

                <Row gutter={16}>
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
                                <Select.Option value="House">House</Select.Option>
                                <Select.Option value="Commercial">Commercial</Select.Option>
                                <Select.Option value="Land">Land</Select.Option>
                                <Select.Option value="Other">Other</Select.Option>
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

            {/* Property Details Section */}
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
                        <Form.Item
                            name="area"
                            label="Area (sq ft)"
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
                        <Form.Item
                            name="maxGuests"
                            label="Max Guests"
                        >
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

            {/* Amenities Section */}
            <div style={{ marginBottom: '24px' }}>
                <Text strong style={{ fontSize: '15px', color: '#667eea', display: 'block', marginBottom: '16px' }}>
                    Amenities & Features
                </Text>

                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} md={8}>
                        <Form.Item name="wifi" valuePropName="checked" style={{ marginBottom: 0 }}>
                            <Checkbox>WiFi</Checkbox>
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <Form.Item name="airConditioning" valuePropName="checked" style={{ marginBottom: 0 }}>
                            <Checkbox>Air Conditioning</Checkbox>
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <Form.Item name="heating" valuePropName="checked" style={{ marginBottom: 0 }}>
                            <Checkbox>Heating</Checkbox>
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <Form.Item name="kitchen" valuePropName="checked" style={{ marginBottom: 0 }}>
                            <Checkbox>Kitchen</Checkbox>
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <Form.Item name="washer" valuePropName="checked" style={{ marginBottom: 0 }}>
                            <Checkbox>Washer</Checkbox>
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <Form.Item name="dryer" valuePropName="checked" style={{ marginBottom: 0 }}>
                            <Checkbox>Dryer</Checkbox>
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <Form.Item name="tv" valuePropName="checked" style={{ marginBottom: 0 }}>
                            <Checkbox>TV</Checkbox>
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <Form.Item name="workspace" valuePropName="checked" style={{ marginBottom: 0 }}>
                            <Checkbox>Dedicated Workspace</Checkbox>
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <Form.Item name="parking" valuePropName="checked" style={{ marginBottom: 0 }}>
                            <Checkbox>Parking</Checkbox>
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <Form.Item name="pool" valuePropName="checked" style={{ marginBottom: 0 }}>
                            <Checkbox>Swimming Pool</Checkbox>
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <Form.Item name="gym" valuePropName="checked" style={{ marginBottom: 0 }}>
                            <Checkbox>Gym</Checkbox>
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <Form.Item name="elevator" valuePropName="checked" style={{ marginBottom: 0 }}>
                            <Checkbox>Elevator</Checkbox>
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <Form.Item name="balcony" valuePropName="checked" style={{ marginBottom: 0 }}>
                            <Checkbox>Balcony</Checkbox>
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <Form.Item name="garden" valuePropName="checked" style={{ marginBottom: 0 }}>
                            <Checkbox>Garden</Checkbox>
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <Form.Item name="securitySystem" valuePropName="checked" style={{ marginBottom: 0 }}>
                            <Checkbox>Security System</Checkbox>
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <Form.Item name="petFriendly" valuePropName="checked" style={{ marginBottom: 0 }}>
                            <Checkbox>Pet Friendly</Checkbox>
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <Form.Item name="smoking" valuePropName="checked" style={{ marginBottom: 0 }}>
                            <Checkbox>Smoking Allowed</Checkbox>
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16} style={{ marginTop: '16px' }}>
                    <Col xs={24} sm={12}>
                        <Form.Item
                            name="parkingSpaces"
                            label="Number of Parking Spaces"
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
            </div>

            <Divider style={{ margin: '24px 0' }} />

            {/* Location Section */}
            <div style={{ marginBottom: '24px' }}>
                <Text strong style={{ fontSize: '15px', color: '#667eea', display: 'block', marginBottom: '16px' }}>
                    Location
                </Text>
                <Row gutter={16}>
                    <Col xs={24}>
                        <Form.Item
                            name="location"
                            label="Full Address"
                            rules={[{ required: true, message: 'Please enter location' }]}
                        >
                            <Input
                                size="large"
                                placeholder="e.g., Westlands, Nairobi, Kenya"
                                style={{ borderRadius: '8px' }}
                            />
                        </Form.Item>
                    </Col>
                </Row>
            </div>

            <Divider style={{ margin: '24px 0' }} />

            {/* Description Section */}
            <div style={{ marginBottom: '24px' }}>
                <Text strong style={{ fontSize: '15px', color: '#667eea', display: 'block', marginBottom: '16px' }}>
                    Description
                </Text>
                <Form.Item
                    name="description"
                    label="Property Description"
                    rules={[{ required: true, message: 'Please enter description' }]}
                >
                    <TextArea
                        rows={5}
                        placeholder="Provide a detailed description of the property, including key features and amenities..."
                        style={{ borderRadius: '8px' }}
                    />
                </Form.Item>
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
                    Upload up to 10 images. Max size: 10MB per image. Images will be uploaded to Cloudinary.
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
