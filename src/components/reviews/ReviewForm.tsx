'use client';

import React, { useState } from 'react';
import Form from 'antd/es/form';
import Input from 'antd/es/input';
import Button from 'antd/es/button';
import Rate from 'antd/es/rate';
import Upload from 'antd/es/upload';
import message from 'antd/es/message';
import Modal from 'antd/es/modal';
import Typography from 'antd/es/typography';
import { StarOutlined, PictureOutlined } from '@ant-design/icons';
import { reviewsApi, CreateReviewDto } from '@/services/api/reviews.api';
import { useAuth } from '@/providers/AuthProvider';

const { TextArea } = Input;
const { Title, Text } = Typography;

interface ReviewFormProps {
    itemType: 'property' | 'service';
    itemId: string;
    itemTitle?: string;
    onSuccess?: () => void;
}

export default function ReviewForm({ itemType, itemId, itemTitle, onSuccess }: ReviewFormProps) {
    const { user, isAuthenticated } = useAuth();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);

    const handleSubmit = async (values: any) => {
        if (!isAuthenticated || !user) {
            message.warning('Please log in to leave a review');
            return;
        }

        setLoading(true);
        try {
            const reviewData: CreateReviewDto = {
                itemType,
                itemId,
                rating: values.rating,
                text: values.text,
                photos: uploadedPhotos.length > 0 ? uploadedPhotos : undefined,
            };

            await reviewsApi.create(reviewData);
            message.success('Review submitted successfully!');
            form.resetFields();
            setUploadedPhotos([]);
            setIsModalVisible(false);
            if (onSuccess) {
                onSuccess();
            }
        } catch (error: any) {
            console.error('Review submission error:', error);
            const errorMessage = error?.response?.data?.message || error?.message || 'Failed to submit review';
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoUpload = async (file: File) => {
        // TODO: Implement actual photo upload to your storage service
        // For now, just creating a placeholder URL
        try {
            message.info('Photo upload functionality to be implemented');
            // const formData = new FormData();
            // formData.append('file', file);
            // const response = await uploadApi.uploadFile(formData);
            // setUploadedPhotos([...uploadedPhotos, response.url]);
            return false;
        } catch (error) {
            message.error('Failed to upload photo');
            return false;
        }
    };

    if (!isAuthenticated) {
        return (
            <div style={{ padding: '24px', textAlign: 'center', background: '#f5f5f5', borderRadius: '8px' }}>
                <Text>Please log in to leave a review</Text>
            </div>
        );
    }

    return (
        <>
            <Button
                type="primary"
                size="large"
                icon={<StarOutlined />}
                onClick={() => setIsModalVisible(true)}
                style={{ width: '100%' }}
            >
                Write a Review
            </Button>

            <Modal
                title={`Review ${itemTitle || (itemType === 'property' ? 'Property' : 'Service')}`}
                open={isModalVisible}
                onCancel={() => {
                    setIsModalVisible(false);
                    form.resetFields();
                }}
                footer={null}
                width={600}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    autoComplete="off"
                    style={{ marginTop: '24px' }}
                >
                    <Form.Item
                        label="Rating"
                        name="rating"
                        rules={[{ required: true, message: 'Please select a rating' }]}
                    >
                        <Rate
                            allowHalf
                            style={{ fontSize: 32 }}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Your Review"
                        name="text"
                        rules={[
                            { required: true, message: 'Please write your review' },
                            { min: 10, message: 'Review must be at least 10 characters' },
                        ]}
                    >
                        <TextArea
                            rows={6}
                            placeholder="Share your experience with this property/service..."
                            maxLength={1000}
                            showCount
                        />
                    </Form.Item>

                    <Form.Item label="Photos (Optional)">
                        <Upload
                            listType="picture-card"
                            beforeUpload={handlePhotoUpload}
                            maxCount={5}
                            accept="image/*"
                        >
                            <div>
                                <PictureOutlined style={{ fontSize: 24 }} />
                                <div style={{ marginTop: 8 }}>Upload</div>
                            </div>
                        </Upload>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                            Maximum 5 photos
                        </Text>
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 0, marginTop: '32px' }}>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <Button
                                onClick={() => {
                                    setIsModalVisible(false);
                                    form.resetFields();
                                }}
                                size="large"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                size="large"
                                loading={loading}
                                icon={<StarOutlined />}
                            >
                                Submit Review
                            </Button>
                        </div>
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
}
