'use client';

import React, { useState, useEffect } from 'react';
import Form from 'antd/es/form';
import Input from 'antd/es/input';
import Button from 'antd/es/button';
import Checkbox from 'antd/es/checkbox';
import Space from 'antd/es/space';
import message from 'antd/es/message';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthService } from '@/services/auth.service';
import { getRoleRedirectPath, getUserRoleFromToken } from '@/lib/role-redirects';

export function LoginForm() {
    const [loading, setLoading] = useState(false);
    const [rememberedEmail, setRememberedEmail] = useState('');
    const [form] = Form.useForm();
    const router = useRouter();
    const auth = AuthService.getInstance();

    useEffect(() => {
        // Only access localStorage after component mounts (client-side)
        const email = typeof window !== 'undefined' ? window.localStorage.getItem('remembered_email') : '';
        if (email) {
            setRememberedEmail(email);
            form.setFieldsValue({ email });
        }
    }, [form]);

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            await auth.login({
                email: values.email,
                password: values.password
            });

            message.success('Login successful');
            if (typeof window !== 'undefined') {
                if (values.remember) {
                    window.localStorage.setItem('remembered_email', values.email);
                } else {
                    window.localStorage.removeItem('remembered_email');
                }
            }

            // Initialize axios interceptors
            auth.setupAxiosInterceptors();

            // Get token and determine role-based redirect
            const token = auth.getToken();
            if (!token) {
                router.push('/properties');
                router.refresh();
                return;
            }

            const userRole = getUserRoleFromToken(token);
            const redirectPath = getRoleRedirectPath(userRole);
            router.push(redirectPath);
            router.refresh(); // Force a refresh of the page
        } catch (error: any) {
            // Error is already handled in auth.service
            console.error('Login failed:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Form
            name="login"
            form={form}
            initialValues={{
                remember: true,
                email: rememberedEmail,
            }}
            onFinish={onFinish}
            layout="vertical"
            size="large"
        >
            <Form.Item
                name="email"
                rules={[
                    { required: true, message: 'Please input your email!' },
                    { type: 'email', message: 'Please enter a valid email!' },
                ]}
            >
                <Input
                    prefix={<UserOutlined className="text-gray-400" />}
                    placeholder="Email"
                />
            </Form.Item>

            <Form.Item
                name="password"
                rules={[{ required: true, message: 'Please input your password!' }]}
            >
                <Input.Password
                    prefix={<LockOutlined className="text-gray-400" />}
                    placeholder="Password"
                />
            </Form.Item>

            <Form.Item>
                <div className="flex justify-between items-center">
                    <Form.Item name="remember" valuePropName="checked" noStyle>
                        <Checkbox>Remember me</Checkbox>
                    </Form.Item>

                    <Link
                        href="/forgot-password"
                        className="text-sm text-blue-600 hover:text-blue-800"
                    >
                        Forgot password?
                    </Link>
                </div>
            </Form.Item>

            <Form.Item>
                <Button
                    type="primary"
                    htmlType="submit"
                    className="w-full"
                    loading={loading}
                >
                    {loading ? 'Signing in...' : 'Sign in'}
                </Button>
            </Form.Item>

            <div className="text-center">
                <Space>
                    <span className="text-gray-600">Don't have an account?</span>
                    <Link
                        href="/register"
                        className="text-blue-600 hover:text-blue-800"
                    >
                        Sign up
                    </Link>
                </Space>
            </div>
        </Form>
    );
}