'use client';

import { useState, useEffect } from 'react';
import { Form, Input, Select, DatePicker, InputNumber, Button, Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import dayjs from 'dayjs';
import { advertisementsApi, type Advertisement, type CreateAdvertisementDto } from '@/services/api/advertisements.api';
import { mediaApi } from '@/services/api/media.api';

const { TextArea } = Input;
const { RangePicker } = DatePicker;

interface AdvertisementFormProps {
    advertisement?: Advertisement | null;
    onSuccess: () => void;
    onCancel: () => void;
}

export default function AdvertisementForm({ advertisement, onSuccess, onCancel }: AdvertisementFormProps) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [fileList, setFileList] = useState<UploadFile[]>([]);

    useEffect(() => {
        if (advertisement) {
            form.setFieldsValue({
                title: advertisement.title,
                description: advertisement.description,
                linkUrl: advertisement.linkUrl,
                placement: advertisement.placement,
                dateRange: [dayjs(advertisement.startDate), dayjs(advertisement.endDate)],
                budget: advertisement.budget,
            });

            if (advertisement.imageUrl) {
                setFileList([{
                    uid: '-1',
                    name: 'image',
                    status: 'done',
                    url: advertisement.imageUrl,
                }]);
            }
        }
    }, [advertisement, form]);

    const handleUpload = async (file: File) => {
        try {
            setUploading(true);
            const imageUrl = await mediaApi.upload(file, 'advertisements');
            message.success('Image uploaded successfully');
            return imageUrl;
        } catch (error) {
            message.error('Failed to upload image');
            throw error;
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (values: any) => {
        try {
            setLoading(true);

            let imageUrl = advertisement?.imageUrl;

            // Upload new image if file was added
            if (fileList.length > 0 && fileList[0].originFileObj) {
                imageUrl = await handleUpload(fileList[0].originFileObj as File);
            }

            const data: CreateAdvertisementDto = {
                title: values.title,
                description: values.description,
                imageUrl: imageUrl,
                linkUrl: values.linkUrl,
                placement: values.placement,
                startDate: values.dateRange[0].toISOString(),
                endDate: values.dateRange[1].toISOString(),
                budget: values.budget,
            };

            if (advertisement) {
                await advertisementsApi.update(advertisement._id, data);
                message.success('Advertisement updated successfully');
            } else {
                await advertisementsApi.create(data);
                message.success('Advertisement created successfully');
            }

            form.resetFields();
            setFileList([]);
            onSuccess();
        } catch (error: any) {
            console.error('Failed to save advertisement:', error);
            message.error(error.response?.data?.message || 'Failed to save advertisement');
        } finally {
            setLoading(false);
        }
    };

    const uploadProps = {
        beforeUpload: (file: File) => {
            const isImage = file.type.startsWith('image/');
            if (!isImage) {
                message.error('You can only upload image files!');
                return false;
            }
            const isLt5M = file.size / 1024 / 1024 < 5;
            if (!isLt5M) {
                message.error('Image must be smaller than 5MB!');
                return false;
            }
            return false; // Prevent auto upload
        },
        onChange: (info: any) => {
            setFileList(info.fileList.slice(-1)); // Keep only the last file
        },
        fileList,
    };

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            autoComplete="off"
        >
            <Form.Item
                label="Advertisement Title"
                name="title"
                rules={[{ required: true, message: 'Please enter advertisement title' }]}
            >
                <Input placeholder="Enter advertisement title" size="large" />
            </Form.Item>

            <Form.Item
                label="Description"
                name="description"
                rules={[{ required: true, message: 'Please enter description' }]}
            >
                <TextArea
                    placeholder="Enter advertisement description"
                    rows={4}
                    showCount
                    maxLength={500}
                />
            </Form.Item>

            <Form.Item
                label="Advertisement Image"
                name="image"
            >
                <Upload
                    {...uploadProps}
                    listType="picture-card"
                    maxCount={1}
                >
                    {fileList.length === 0 && (
                        <div>
                            <UploadOutlined />
                            <div style={{ marginTop: 8 }}>Upload Image</div>
                        </div>
                    )}
                </Upload>
            </Form.Item>

            <Form.Item
                label="Link URL"
                name="linkUrl"
                rules={[
                    { type: 'url', message: 'Please enter a valid URL' },
                ]}
            >
                <Input placeholder="https://example.com" size="large" />
            </Form.Item>

            <Form.Item
                label="Placement"
                name="placement"
                rules={[{ required: true, message: 'Please select placement' }]}
            >
                <Select placeholder="Select where this ad will appear" size="large">
                    <Select.Option value="home">Home Page</Select.Option>
                    <Select.Option value="properties">Properties Page</Select.Option>
                    <Select.Option value="services">Services Page</Select.Option>
                    <Select.Option value="sidebar">Sidebar</Select.Option>
                    <Select.Option value="banner">Banner</Select.Option>
                </Select>
            </Form.Item>

            <Form.Item
                label="Campaign Duration"
                name="dateRange"
                rules={[{ required: true, message: 'Please select campaign duration' }]}
            >
                <RangePicker
                    style={{ width: '100%' }}
                    size="large"
                    showTime
                    format="YYYY-MM-DD HH:mm"
                />
            </Form.Item>

            <Form.Item
                label="Budget (Optional)"
                name="budget"
            >
                <InputNumber
                    placeholder="Enter budget amount"
                    style={{ width: '100%' }}
                    size="large"
                    prefix="$"
                    min={0}
                    precision={2}
                />
            </Form.Item>

            <Form.Item className="mb-0 flex justify-end gap-2">
                <Button onClick={onCancel} size="large">
                    Cancel
                </Button>
                <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading || uploading}
                    size="large"
                >
                    {advertisement ? 'Update' : 'Create'} Advertisement
                </Button>
            </Form.Item>
        </Form>
    );
}
