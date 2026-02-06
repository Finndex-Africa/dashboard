'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { StreamChat } from 'stream-chat';
import {
    Chat,
    ChannelList,
    Channel,
    Window,
    ChannelHeader,
    MessageList,
    MessageInput,
    Thread,
    ChannelPreviewUIComponentProps,
    useChatContext,
} from 'stream-chat-react';
import 'stream-chat-react/dist/css/v2/index.css';
import Card from 'antd/es/card';
import Spin from 'antd/es/spin';
import Typography from 'antd/es/typography';
import Empty from 'antd/es/empty';
import Avatar from 'antd/es/avatar';
import Badge from 'antd/es/badge';
import { UserOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

// Custom channel preview component with better UI
const CustomChannelPreview = (props: ChannelPreviewUIComponentProps) => {
    const { channel, setActiveChannel, activeChannel } = props;
    const { client } = useChatContext();

    if (!channel) return null;
    if (!client) return null;

    const isActive = activeChannel?.id === channel.id;
    const members = Object.values(channel.state.members).filter(
        (member) => member.user?.id !== client.user?.id
    );

    const otherUser = members[0]?.user;
    const displayName = otherUser?.name || otherUser?.id || 'Unknown User';
    const lastMessage = channel.state.messages[channel.state.messages.length - 1];
    const lastMessageText = lastMessage?.text || 'No messages yet';
    const unreadCount = channel.countUnread();

    // Format timestamp
    const formatTime = (date?: Date | string) => {
        if (!date) return '';

        const messageDate = new Date(date);
        const now = new Date();
        const diff = now.getTime() - messageDate.getTime();
        const hours = diff / (1000 * 60 * 60);

        if (hours < 24) {
            return messageDate.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        }

        if (hours < 48) {
            return 'Yesterday';
        }

        return messageDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    };

    const handleClick = () => {
        console.log('🖱️ Channel clicked:', channel.id);
        setActiveChannel?.(channel);
    };

    return (
        <div
            onClick={handleClick}
            className={`
                p-4 cursor-pointer transition-all border-b border-gray-100
                ${isActive ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-gray-50'}
            `}
        >
            <div className="flex items-start gap-3">
                <Badge count={unreadCount} offset={[-5, 5]}>
                    <Avatar
                        size={48}
                        src={otherUser?.image}
                        icon={!otherUser?.image && <UserOutlined />}
                        style={{
                            backgroundColor: '#6366f1',
                            flexShrink: 0
                        }}
                    />
                </Badge>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <Text
                            strong
                            className="text-base"
                            style={{
                                color: isActive ? '#0000FF' : '#262626',
                                fontSize: '15px'
                            }}
                        >
                            {displayName}
                        </Text>
                        <Text
                            className="text-xs"
                            style={{ color: '#8c8c8c' }}
                        >
                            {formatTime(lastMessage?.created_at)}
                        </Text>
                    </div>

                    <Text
                        className="text-sm block truncate"
                        style={{
                            color: unreadCount > 0 ? '#262626' : '#8c8c8c',
                            fontWeight: unreadCount > 0 ? 500 : 400
                        }}
                    >
                        {lastMessageText}
                    </Text>
                </div>
            </div>
        </div>
    );
};

export default function MessagesPage() {
    const { user } = useAuth();
    const [client, setClient] = useState<StreamChat | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user?.id) {
            setLoading(false);
            setError('Please log in to view messages');
            return;
        }

        const initializeChat = async () => {
            try {
                setLoading(true);
                setError(null);

                // Get Stream API key from environment
                const apiKey = process.env.NEXT_PUBLIC_STREAM_KEY;
                if (!apiKey) {
                    throw new Error('Stream Chat API key not configured');
                }

                // Create Stream Chat client
                const chatClient = StreamChat.getInstance(apiKey);

                // Get auth token from backend
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/token`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ userId: user.id }),
                });

                if (!response.ok) {
                    throw new Error('Failed to get chat token');
                }

                const { token } = await response.json();

                // Connect user to Stream with name and avatar
                await chatClient.connectUser(
                    {
                        id: user.id,
                        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email?.split('@')[0] || 'User',
                        image: user.avatar || undefined,
                    },
                    token
                );

                setClient(chatClient);
            } catch (err) {
                console.error('Chat initialization error:', err);
                setError(err instanceof Error ? err.message : 'Failed to load chat');
            } finally {
                setLoading(false);
            }
        };

        initializeChat();

        // Cleanup on unmount
        return () => {
            if (client) {
                client.disconnectUser().catch(console.error);
            }
        };
    }, [user?.id]);

    if (loading) {
        return (
            <div className="space-y-6">
                <Title level={2} style={{ margin: 0, fontSize: '28px', fontWeight: 600 }}>
                    Messages
                </Title>
                <Card className="shadow-sm">
                    <div className="flex justify-center items-center min-h-[500px]">
                        <div className="text-center">
                            <Spin size="large" />
                            <p className="mt-4 text-gray-600">Loading messages...</p>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="space-y-6">
                <Title level={2} style={{ margin: 0, fontSize: '28px', fontWeight: 600 }}>
                    Messages
                </Title>
                <Card className="shadow-sm">
                    <Empty
                        description={error || 'Please log in to view messages'}
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                </Card>
            </div>
        );
    }

    if (!client) {
        return (
            <div className="space-y-6">
                <Title level={2} style={{ margin: 0, fontSize: '28px', fontWeight: 600 }}>
                    Messages
                </Title>
                <Card className="shadow-sm">
                    <Empty
                        description="Unable to connect to chat service"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                </Card>
            </div>
        );
    }

    // Filter channels where current user is a member
    // Exclude channels where user is chatting with themselves
    const filters = {
        type: 'messaging',
        members: { $in: [user.id] },
    };

    const sort = [{ last_message_at: -1 }] as const;

    return (
        <div className="space-y-6">
            <Title level={2} style={{ margin: 0, fontSize: '28px', fontWeight: 600 }}>
                Messages
            </Title>

            <Card
                className="shadow-sm"
                bodyStyle={{ padding: 0 }}
                style={{
                    borderRadius: '12px',
                    overflow: 'hidden',
                    height: 'calc(100vh - 200px)',
                    minHeight: '600px'
                }}
            >
                <Chat client={client} theme="str-chat__theme-light">
                    <div style={{ display: 'flex', height: '100%' }}>
                        {/* Left sidebar - Channel List */}
                        <div style={{
                            width: '360px',
                            borderRight: '1px solid #e8e8e8',
                            flexShrink: 0,
                            overflow: 'hidden'
                        }}>
                            <ChannelList
                                filters={filters}
                                sort={sort}
                                options={{ limit: 20 }}
                                Preview={CustomChannelPreview}
                                EmptyStateIndicator={() => (
                                    <div className="flex flex-col items-center justify-center py-16 px-4">
                                        <svg
                                            className="w-20 h-20 text-gray-300 mb-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={1.5}
                                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                            />
                                        </svg>
                                        <Text
                                            className="text-center"
                                            style={{ fontSize: '16px', color: '#8c8c8c' }}
                                        >
                                            No messages yet
                                        </Text>
                                        <Text
                                            className="text-center mt-1"
                                            style={{ fontSize: '14px', color: '#bfbfbf' }}
                                        >
                                            Your conversations will appear here
                                        </Text>
                                    </div>
                                )}
                            />
                        </div>

                        {/* Right side - Active Chat */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <Channel>
                                <Window>
                                    <ChannelHeader />
                                    <MessageList />
                                    <MessageInput />
                                </Window>
                                <Thread />
                            </Channel>
                        </div>
                    </div>
                </Chat>
            </Card>
        </div>
    );
}
