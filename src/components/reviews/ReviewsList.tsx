'use client';

import React, { useState, useEffect } from 'react';
import Card from 'antd/es/card';
import Empty from 'antd/es/empty';
import Spin from 'antd/es/spin';
import Typography from 'antd/es/typography';
import Rate from 'antd/es/rate';
import Progress from 'antd/es/progress';
import Select from 'antd/es/select';
import Pagination from 'antd/es/pagination';
import Space from 'antd/es/space';
import Divider from 'antd/es/divider';
import message from 'antd/es/message';
import { StarFilled } from '@ant-design/icons';
import ReviewCard from './ReviewCard';
import ReviewForm from './ReviewForm';
import { reviewsApi, Review, RatingDistribution } from '@/services/api/reviews.api';

const { Title, Text } = Typography;
const { Option } = Select;

interface ReviewsListProps {
    itemType: 'property' | 'service';
    itemId: string;
    itemTitle?: string;
}

export default function ReviewsList({ itemType, itemId, itemTitle }: ReviewsListProps) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [averageRating, setAverageRating] = useState(0);
    const [reviewCount, setReviewCount] = useState(0);
    const [distribution, setDistribution] = useState<RatingDistribution | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize] = useState(10);
    const [sortBy, setSortBy] = useState<'recent' | 'helpful' | 'rating'>('recent');
    const [filterRating, setFilterRating] = useState<number | undefined>(undefined);

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const response = await reviewsApi.getByItem(itemType, itemId, {
                page: currentPage,
                limit: pageSize,
                sortBy,
                rating: filterRating,
            });

            setReviews(response.data || []);
            setTotalPages(response.pagination?.totalPages || 1);
        } catch (error) {
            console.error('Error fetching reviews:', error);
            message.error('Failed to load reviews');
        } finally {
            setLoading(false);
        }
    };

    const fetchRatingData = async () => {
        try {
            const [avgResponse, distResponse] = await Promise.all([
                reviewsApi.getAverageRating(itemType, itemId),
                reviewsApi.getRatingDistribution(itemType, itemId),
            ]);

            setAverageRating(avgResponse.data.averageRating || 0);
            setReviewCount(avgResponse.data.reviewCount || 0);
            setDistribution(distResponse.data);
        } catch (error) {
            console.error('Error fetching rating data:', error);
        }
    };

    useEffect(() => {
        fetchReviews();
        fetchRatingData();
    }, [itemType, itemId, currentPage, sortBy, filterRating]);

    const handleReviewSubmitted = () => {
        setCurrentPage(1);
        fetchReviews();
        fetchRatingData();
    };

    const getPercentage = (count: number) => {
        if (reviewCount === 0) return 0;
        return Math.round((count / reviewCount) * 100);
    };

    return (
        <div style={{ marginTop: '32px' }}>
            <Card style={{ borderRadius: '12px', marginBottom: '24px' }}>
                <Title level={3} style={{ marginBottom: '24px' }}>
                    Reviews & Ratings
                </Title>

                {/* Rating Summary */}
                <div style={{ display: 'flex', gap: '48px', flexWrap: 'wrap', marginBottom: '32px' }}>
                    {/* Average Rating */}
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#faad14' }}>
                            {averageRating.toFixed(1)}
                        </div>
                        <Rate disabled value={averageRating} allowHalf style={{ fontSize: '20px' }} />
                        <div style={{ marginTop: '8px' }}>
                            <Text type="secondary">{reviewCount} reviews</Text>
                        </div>
                    </div>

                    {/* Rating Distribution */}
                    {distribution && (
                        <div style={{ flex: 1, minWidth: '300px' }}>
                            {[5, 4, 3, 2, 1].map((rating) => (
                                <div key={rating} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                    <Text style={{ width: '60px' }}>{rating} <StarFilled style={{ color: '#faad14' }} /></Text>
                                    <Progress
                                        percent={getPercentage(distribution[rating as keyof RatingDistribution] || 0)}
                                        strokeColor="#faad14"
                                        showInfo={false}
                                        style={{ flex: 1 }}
                                    />
                                    <Text type="secondary" style={{ width: '40px', textAlign: 'right' }}>
                                        {distribution[rating as keyof RatingDistribution] || 0}
                                    </Text>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <Divider />

                {/* Write Review Button */}
                <div style={{ marginTop: '24px' }}>
                    <ReviewForm
                        itemType={itemType}
                        itemId={itemId}
                        itemTitle={itemTitle}
                        onSuccess={handleReviewSubmitted}
                    />
                </div>
            </Card>

            {/* Filters and Sort */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <Select
                    value={sortBy}
                    onChange={setSortBy}
                    style={{ width: 200 }}
                    placeholder="Sort by"
                >
                    <Option value="recent">Most Recent</Option>
                    <Option value="helpful">Most Helpful</Option>
                    <Option value="rating">Highest Rating</Option>
                </Select>

                <Select
                    value={filterRating}
                    onChange={setFilterRating}
                    style={{ width: 200 }}
                    placeholder="Filter by rating"
                    allowClear
                >
                    <Option value={5}>5 Stars</Option>
                    <Option value={4}>4 Stars</Option>
                    <Option value={3}>3 Stars</Option>
                    <Option value={2}>2 Stars</Option>
                    <Option value={1}>1 Star</Option>
                </Select>
            </div>

            {/* Reviews List */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '48px' }}>
                    <Spin size="large" />
                </div>
            ) : reviews.length === 0 ? (
                <Empty
                    description="No reviews yet"
                    style={{ padding: '48px' }}
                />
            ) : (
                <>
                    {reviews.map((review) => (
                        <ReviewCard
                            key={review._id}
                            review={review}
                            onUpdate={fetchReviews}
                        />
                    ))}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
                            <Pagination
                                current={currentPage}
                                total={totalPages * pageSize}
                                pageSize={pageSize}
                                onChange={(page) => setCurrentPage(page)}
                                showSizeChanger={false}
                            />
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
