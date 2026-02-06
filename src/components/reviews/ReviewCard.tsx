'use client';

import React, { useState } from 'react';
import Card from 'antd/es/card';
import Avatar from 'antd/es/avatar';
import Rate from 'antd/es/rate';
import Typography from 'antd/es/typography';
import Button from 'antd/es/button';
import Image from 'antd/es/image';
import message from 'antd/es/message';
import Modal from 'antd/es/modal';
import Input from 'antd/es/input';
import Space from 'antd/es/space';
import Divider from 'antd/es/divider';
import { UserOutlined, LikeOutlined, MessageOutlined, WarningOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Review, reviewsApi } from '@/services/api/reviews.api';
import { useAuth } from '@/providers/AuthProvider';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

// Helper function to format date distance
const formatDistanceToNow = (date: Date): string => {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} day${days !== 1 ? 's' : ''} ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months !== 1 ? 's' : ''} ago`;
    const years = Math.floor(months / 12);
    return `${years} year${years !== 1 ? 's' : ''} ago`;
};

interface ReviewCardProps {
    review: Review;
    onUpdate?: () => void;
    showOwnerReply?: boolean;
}

export default function ReviewCard({ review, onUpdate, showOwnerReply = true }: ReviewCardProps) {
    const { user, isAuthenticated } = useAuth();
    const [isHelpful, setIsHelpful] = useState(review.helpfulBy.includes(user?.id || ''));
    const [helpfulCount, setHelpfulCount] = useState(review.helpfulCount);
    const [isReportModalVisible, setIsReportModalVisible] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [reportLoading, setReportLoading] = useState(false);

    const handleMarkHelpful = async () => {
        if (!isAuthenticated || !user) {
            message.warning('Please log in to mark reviews as helpful');
            return;
        }

        try {
            await reviewsApi.markAsHelpful(review._id);
            setIsHelpful(!isHelpful);
            setHelpfulCount(isHelpful ? helpfulCount - 1 : helpfulCount + 1);
            message.success(isHelpful ? 'Removed from helpful' : 'Marked as helpful');
        } catch (error) {
            console.error('Mark helpful error:', error);
            message.error('Failed to mark as helpful');
        }
    };

    const handleReport = async () => {
        if (!reportReason.trim()) {
            message.warning('Please provide a reason for reporting');
            return;
        }

        setReportLoading(true);
        try {
            await reviewsApi.reportReview(review._id, { reason: reportReason });
            message.success('Review reported successfully');
            setIsReportModalVisible(false);
            setReportReason('');
        } catch (error) {
            console.error('Report error:', error);
            message.error('Failed to report review');
        } finally {
            setReportLoading(false);
        }
    };

    const handleDelete = async () => {
        Modal.confirm({
            title: 'Delete Review',
            content: 'Are you sure you want to delete this review? This action cannot be undone.',
            okText: 'Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            async onOk() {
                try {
                    await reviewsApi.delete(review._id);
                    message.success('Review deleted successfully');
                    if (onUpdate) onUpdate();
                } catch (error) {
                    console.error('Delete error:', error);
                    message.error('Failed to delete review');
                }
            },
        });
    };

    const isOwnReview = user?.id === review.userId._id;
    const reviewerName = `${review.userId.firstName} ${review.userId.lastName}`;
    const reviewDate = formatDistanceToNow(new Date(review.createdAt));

    return (
        <>
            <Card
                style={{
                    marginBottom: '16px',
                    borderRadius: '12px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }}
            >
                <div style={{ display: 'flex', gap: '16px' }}>
                    {/* Avatar */}
                    <Avatar
                        size={48}
                        src={review.userId.avatar}
                        icon={!review.userId.avatar && <UserOutlined />}
                        style={{ backgroundColor: '#0000FF' }}
                    />

                    {/* Review Content */}
                    <div style={{ flex: 1 }}>
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                            <div>
                                <Text strong style={{ fontSize: '16px', display: 'block' }}>
                                    {reviewerName}
                                </Text>
                                <Text type="secondary" style={{ fontSize: '13px' }}>
                                    {reviewDate}
                                </Text>
                            </div>
                            <Rate disabled value={review.rating} style={{ fontSize: '16px' }} />
                        </div>

                        {/* Review Text */}
                        <Paragraph style={{ marginTop: '12px', marginBottom: '12px' }}>
                            {review.text}
                        </Paragraph>

                        {/* Photos */}
                        {review.photos && review.photos.length > 0 && (
                            <div style={{ marginBottom: '12px' }}>
                                <Image.PreviewGroup>
                                    <Space size={8}>
                                        {review.photos.map((photo, index) => (
                                            <Image
                                                key={index}
                                                src={photo}
                                                alt={`Review photo ${index + 1}`}
                                                width={100}
                                                height={100}
                                                style={{ borderRadius: '8px', objectFit: 'cover' }}
                                            />
                                        ))}
                                    </Space>
                                </Image.PreviewGroup>
                            </div>
                        )}

                        {/* Actions */}
                        <Space size="large" style={{ marginTop: '8px' }}>
                            <Button
                                type="text"
                                icon={<LikeOutlined />}
                                onClick={handleMarkHelpful}
                                style={{ color: isHelpful ? '#0000FF' : undefined }}
                            >
                                Helpful ({helpfulCount})
                            </Button>

                            {isOwnReview && (
                                <Button
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={handleDelete}
                                >
                                    Delete
                                </Button>
                            )}

                            {!isOwnReview && isAuthenticated && (
                                <Button
                                    type="text"
                                    icon={<WarningOutlined />}
                                    onClick={() => setIsReportModalVisible(true)}
                                >
                                    Report
                                </Button>
                            )}
                        </Space>

                        {/* Owner Reply */}
                        {showOwnerReply && review.ownerReply && (
                            <>
                                <Divider style={{ margin: '16px 0' }} />
                                <div style={{ backgroundColor: '#f5f5f5', padding: '12px', borderRadius: '8px' }}>
                                    <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                                        <MessageOutlined /> Owner's Response
                                    </Text>
                                    <Text>{review.ownerReply}</Text>
                                    {review.ownerReplyAt && (
                                        <div style={{ marginTop: '8px' }}>
                                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                                {formatDistanceToNow(new Date(review.ownerReplyAt))}
                                            </Text>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </Card>

            {/* Report Modal */}
            <Modal
                title="Report Review"
                open={isReportModalVisible}
                onCancel={() => setIsReportModalVisible(false)}
                onOk={handleReport}
                okText="Submit Report"
                confirmLoading={reportLoading}
            >
                <div style={{ marginTop: '16px' }}>
                    <Text>Please provide a reason for reporting this review:</Text>
                    <TextArea
                        rows={4}
                        value={reportReason}
                        onChange={(e) => setReportReason(e.target.value)}
                        placeholder="e.g., Inappropriate content, spam, false information..."
                        style={{ marginTop: '12px' }}
                    />
                </div>
            </Modal>
        </>
    );
}
