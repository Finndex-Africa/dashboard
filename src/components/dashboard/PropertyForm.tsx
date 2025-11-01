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
        }
        const isLt10M = file.size / 1024 / 1024 < 10;
        if (!isLt10M) {
            showToast.error('Image must be smaller than 10MB!');
        }
        return isImage && isLt10M;
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
                            name="rooms"
                            label="Number of Rooms"
                            rules={[{ required: true, message: 'Please enter number of rooms' }]}
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
                    Upload up to 10 images. Max size: 10MB per image. Images will be uploaded to DigitalOcean Spaces.
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
