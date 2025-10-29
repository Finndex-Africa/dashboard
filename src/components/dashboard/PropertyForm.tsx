'use client';

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
import type { Property } from '@/types/dashboard';

const { TextArea } = Input;
const { Text } = Typography;

interface PropertyFormProps {
    initialValues?: Partial<Property>;
    onSubmit: (values: Partial<Property>) => void;
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

    const handleSubmit = (values: any) => {
        onSubmit(values);
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
                            name="type"
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
                            name="status"
                            label="Status"
                            rules={[{ required: true, message: 'Please select status' }]}
                        >
                            <Select
                                size="large"
                                placeholder="Select status"
                                style={{ borderRadius: '8px' }}
                            >
                                <Select.Option value="Available">Available</Select.Option>
                                <Select.Option value="Rented">Rented</Select.Option>
                                <Select.Option value="Sold">Sold</Select.Option>
                                <Select.Option value="Pending">Pending</Select.Option>
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
                    <Col xs={24} sm={8}>
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
                                parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Form.Item
                            name="area"
                            label="Area (sq ft)"
                            rules={[{ required: true, message: 'Please enter area' }]}
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
                            name="bedrooms"
                            label="Bedrooms"
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
                            name="bathrooms"
                            label="Bathrooms"
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
