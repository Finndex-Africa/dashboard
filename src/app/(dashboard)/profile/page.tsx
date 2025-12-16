'use client';

import React, { useState, useEffect } from 'react';
import Card from 'antd/es/card';
import Form from 'antd/es/form';
import Input from 'antd/es/input';
import Button from 'antd/es/button';
import Upload from 'antd/es/upload';
import Avatar from 'antd/es/avatar';
import Spin from 'antd/es/spin';
import Typography from 'antd/es/typography';
import message from 'antd/es/message';
import Divider from 'antd/es/divider';
import Modal from 'antd/es/modal';
import { UserOutlined, MailOutlined, PhoneOutlined, CameraOutlined, SaveOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '@/providers/AuthProvider';

const { Title, Text } = Typography;

export default function ProfilePage() {
    const { user, setUser } = useAuth();
    const [form] = Form.useForm();
    const [passwordForm] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState<string | undefined>(user?.avatar);
    const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);

    useEffect(() => {
        if (user) {
            console.log('🔍 Profile page - User data:', user);
            const formValues = {
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || '',
                phone: user.phone || '',
            };
            console.log('📝 Setting form values:', formValues);
            form.setFieldsValue(formValues);
            setAvatarUrl(user.avatar);
        }
    }, [user, form]);

    const handleAvatarUpload = async (file: File) => {
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('avatar', file);

            const token = localStorage.getItem('token') || localStorage.getItem('authToken');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/upload-avatar`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to upload avatar');
            }

            const result = await response.json();
            const avatarUrl = result.data?.avatarUrl || result.avatarUrl;

            setAvatarUrl(avatarUrl);

            // Update user in context and localStorage
            if (user) {
                const updatedUser = { ...user, avatar: avatarUrl };
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
            }

            message.success('Profile picture updated successfully');
        } catch (error) {
            console.error('Avatar upload error:', error);
            message.error('Failed to upload profile picture');
        } finally {
            setUploading(false);
        }
        return false;
    };

    const handleSubmit = async (values: any) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    firstName: values.firstName,
                    lastName: values.lastName,
                    phone: values.phone,
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update profile');
            }

            const result = await response.json();
            const updatedUserData = result.data || result;

            // Update user in context and localStorage
            if (user) {
                const updatedUser = {
                    ...user,
                    firstName: updatedUserData.firstName || values.firstName,
                    lastName: updatedUserData.lastName || values.lastName,
                    phone: updatedUserData.phone || values.phone,
                };
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
            }

            message.success('Profile updated successfully');
        } catch (error) {
            console.error('Profile update error:', error);
            message.error('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (values: any) => {
        setPasswordLoading(true);
        try {
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword: values.currentPassword,
                    newPassword: values.newPassword,
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to change password');
            }

            message.success('Password changed successfully');
            setIsPasswordModalVisible(false);
            passwordForm.resetFields();
        } catch (error: any) {
            console.error('Password change error:', error);
            message.error(error.message || 'Failed to change password');
        } finally {
            setPasswordLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl">
            <Title level={2} style={{ margin: 0, fontSize: '28px', fontWeight: 600 }}>
                Profile
            </Title>

            <Card className="shadow-sm" style={{ borderRadius: '12px' }}>
                {/* Profile Header */}
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
                    <div className="relative">
                        <Avatar
                            size={120}
                            src={avatarUrl}
                            icon={!avatarUrl && <UserOutlined />}
                            style={{
                                backgroundColor: '#1890ff',
                                fontSize: '48px'
                            }}
                        />
                        <Upload
                            accept="image/*"
                            showUploadList={false}
                            beforeUpload={handleAvatarUpload}
                        >
                            <Button
                                type="primary"
                                shape="circle"
                                icon={<CameraOutlined />}
                                loading={uploading}
                                style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    right: 0,
                                }}
                            />
                        </Upload>
                    </div>

                    <div className="flex-1 text-center md:text-left">
                        <Title level={3} style={{ margin: 0, marginBottom: '8px' }}>
                            {user.firstName} {user.lastName}
                        </Title>
                        <Text type="secondary" style={{ fontSize: '16px', display: 'block', marginBottom: '4px' }}>
                            {user.email}
                        </Text>
                        <Text
                            style={{
                                backgroundColor: '#f0f0f0',
                                padding: '4px 12px',
                                borderRadius: '12px',
                                fontSize: '14px',
                                display: 'inline-block',
                                marginTop: '8px'
                            }}
                        >
                            {user.role === 'landlord' ? 'Landlord' :
                                user.role === 'agent' ? 'Agent' :
                                    user.role === 'service_provider' ? 'Service Provider' :
                                        user.role === 'home_seeker' ? 'Home Seeker' : 'User'}
                        </Text>
                    </div>
                </div>

                <Divider />

                {/* Profile Form */}
                <div className="mt-6">
                    <Title level={4} style={{ marginBottom: '24px' }}>
                        Personal Information
                    </Title>

                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleSubmit}
                        autoComplete="off"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Form.Item
                                label="First Name"
                                name="firstName"
                                rules={[{ required: true, message: 'Please enter your first name' }]}
                            >
                                <Input
                                    prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
                                    placeholder="Enter first name"
                                    size="large"
                                />
                            </Form.Item>

                            <Form.Item
                                label="Last Name"
                                name="lastName"
                                rules={[{ required: true, message: 'Please enter your last name' }]}
                            >
                                <Input
                                    prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
                                    placeholder="Enter last name"
                                    size="large"
                                />
                            </Form.Item>

                            <Form.Item
                                label="Email Address"
                                name="email"
                            >
                                <Input
                                    prefix={<MailOutlined style={{ color: '#bfbfbf' }} />}
                                    placeholder="Email address"
                                    size="large"
                                    disabled
                                />
                            </Form.Item>

                            <Form.Item
                                label="Phone Number"
                                name="phone"
                            >
                                <Input
                                    prefix={<PhoneOutlined style={{ color: '#bfbfbf' }} />}
                                    placeholder="Enter phone number"
                                    size="large"
                                />
                            </Form.Item>
                        </div>

                        <Form.Item style={{ marginTop: '32px', marginBottom: 0 }}>
                            <Button
                                type="primary"
                                htmlType="submit"
                                size="large"
                                icon={<SaveOutlined />}
                                loading={loading}
                                style={{ minWidth: '150px' }}
                            >
                                Save Changes
                            </Button>
                        </Form.Item>
                    </Form>
                </div>
            </Card>

            {/* Account Security Card */}
            <Card className="shadow-sm" style={{ borderRadius: '12px' }}>
                <Title level={4} style={{ marginBottom: '24px' }}>
                    Account Security
                </Title>

                <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                        <div>
                            <Text strong style={{ display: 'block', marginBottom: '4px' }}>
                                Password
                            </Text>
                            <Text type="secondary" style={{ fontSize: '14px' }}>
                                ••••••••
                            </Text>
                        </div>
                        <Button type="link" onClick={() => setIsPasswordModalVisible(true)}>
                            Change Password
                        </Button>
                    </div>

                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                        <div>
                            <Text strong style={{ display: 'block', marginBottom: '4px' }}>
                                Email Verification
                            </Text>
                            <Text type="secondary" style={{ fontSize: '14px' }}>
                                {user.email}
                            </Text>
                        </div>
                        <Text type="success" style={{ fontSize: '14px' }}>
                            Verified ✓
                        </Text>
                    </div>
                </div>
            </Card>

            {/* Change Password Modal */}
            <Modal
                title="Change Password"
                open={isPasswordModalVisible}
                onCancel={() => {
                    setIsPasswordModalVisible(false);
                    passwordForm.resetFields();
                }}
                footer={null}
                width={500}
            >
                <Form
                    form={passwordForm}
                    layout="vertical"
                    onFinish={handleChangePassword}
                    autoComplete="off"
                    style={{ marginTop: '24px' }}
                >
                    <Form.Item
                        label="Current Password"
                        name="currentPassword"
                        rules={[
                            { required: true, message: 'Please enter your current password' },
                        ]}
                    >
                        <Input.Password
                            prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                            placeholder="Enter current password"
                            size="large"
                        />
                    </Form.Item>

                    <Form.Item
                        label="New Password"
                        name="newPassword"
                        rules={[
                            { required: true, message: 'Please enter your new password' },
                            { min: 6, message: 'Password must be at least 6 characters' },
                        ]}
                    >
                        <Input.Password
                            prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                            placeholder="Enter new password"
                            size="large"
                        />
                    </Form.Item>

                    <Form.Item
                        label="Confirm New Password"
                        name="confirmPassword"
                        dependencies={['newPassword']}
                        rules={[
                            { required: true, message: 'Please confirm your new password' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('newPassword') === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('The two passwords do not match'));
                                },
                            }),
                        ]}
                    >
                        <Input.Password
                            prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                            placeholder="Confirm new password"
                            size="large"
                        />
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 0, marginTop: '32px' }}>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <Button
                                onClick={() => {
                                    setIsPasswordModalVisible(false);
                                    passwordForm.resetFields();
                                }}
                                size="large"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                size="large"
                                loading={passwordLoading}
                                icon={<SaveOutlined />}
                            >
                                Change Password
                            </Button>
                        </div>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
