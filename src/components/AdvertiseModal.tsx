'use client';

import { useState } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import { apiClient } from '@/lib/api-client';

const { TextArea } = Input;

interface AdvertiseModalProps {
    open: boolean;
    onClose: () => void;
}

interface AdvertiseFormData {
    name: string;
    email: string;
    phone: string;
    company?: string;
    message?: string;
}

export default function AdvertiseModal({ open, onClose }: AdvertiseModalProps) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (values: AdvertiseFormData) => {
        try {
            setLoading(true);

            await apiClient.post('/advertisements/advertise-request', values);

            message.success('Thank you! We will contact you soon.');
            form.resetFields();
            onClose();
        } catch (error: any) {
            console.error('Failed to submit request:', error);
            message.error(
                error.response?.data?.message || 'Failed to submit request. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title={
                <div>
                    <h2 className="text-xl font-bold">Advertise With Us</h2>
                    <p className="text-sm text-gray-500 font-normal mt-1">
                        Fill out the form below and we'll get back to you soon.
                    </p>
                </div>
            }
            open={open}
            onCancel={onClose}
            footer={null}
            width={600}
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                className="mt-4"
            >
                <Form.Item
                    label="Full Name"
                    name="name"
                    rules={[
                        { required: true, message: 'Please enter your name' },
                    ]}
                >
                    <Input
                        placeholder="John Doe"
                        size="large"
                    />
                </Form.Item>

                <Form.Item
                    label="Email"
                    name="email"
                    rules={[
                        { required: true, message: 'Please enter your email' },
                        { type: 'email', message: 'Please enter a valid email' },
                    ]}
                >
                    <Input
                        placeholder="john@example.com"
                        size="large"
                    />
                </Form.Item>

                <Form.Item
                    label="Phone Number"
                    name="phone"
                    rules={[
                        { required: true, message: 'Please enter your phone number' },
                    ]}
                >
                    <Input
                        placeholder="+1 (555) 000-0000"
                        size="large"
                    />
                </Form.Item>

                <Form.Item
                    label="Company Name"
                    name="company"
                >
                    <Input
                        placeholder="Your Company"
                        size="large"
                    />
                </Form.Item>

                <Form.Item
                    label="Message"
                    name="message"
                >
                    <TextArea
                        placeholder="Tell us about your advertising needs..."
                        rows={4}
                        size="large"
                    />
                </Form.Item>

                <Form.Item className="mb-0">
                    <div className="flex gap-3 justify-end">
                        <Button onClick={onClose} size="large">
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            size="large"
                        >
                            Submit Request
                        </Button>
                    </div>
                </Form.Item>
            </Form>
        </Modal>
    );
}
