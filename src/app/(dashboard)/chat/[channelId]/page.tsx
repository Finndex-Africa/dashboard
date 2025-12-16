'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { StreamChat, Channel as ChannelType } from 'stream-chat';
import {
    Chat,
    Channel,
    Window,
    ChannelHeader,
    MessageList,
    MessageInput,
    Thread,
} from 'stream-chat-react';
import 'stream-chat-react/dist/css/v2/index.css';
import Card from 'antd/es/card';
import Spin from 'antd/es/spin';
import Button from 'antd/es/button';
import { ArrowLeftOutlined } from '@ant-design/icons';

export default function ChatPage() {
    const params = useParams();
    const channelId = params?.channelId as string;
    const router = useRouter();
    const { user } = useAuth();
    const [client, setClient] = useState<StreamChat | null>(null);
    const [channel, setChannel] = useState<ChannelType | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user?.id) {
            setError('Please log in to view messages');
            setLoading(false);
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

                // Connect user to Stream
                await chatClient.connectUser(
                    {
                        id: user.id,
                        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
                        image: undefined,
                    },
                    token
                );

                // Get the channel
                const chatChannel = chatClient.channel('messaging', channelId);
                await chatChannel.watch();

                setClient(chatClient);
                setChannel(chatChannel);
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
            if (channel) {
                channel.stopWatching().catch(console.error);
            }
            if (client) {
                client.disconnectUser().catch(console.error);
            }
        };
    }, [channelId, user?.id]);

    const handleBackToMessages = () => {
        router.push('/messages');
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={handleBackToMessages}
                        type="text"
                    >
                        Back to Messages
                    </Button>
                </div>
                <Card>
                    <div className="flex justify-center items-center min-h-[500px]">
                        <Spin size="large" />
                        <span className="ml-3 text-gray-600">Loading conversation...</span>
                    </div>
                </Card>
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={handleBackToMessages}
                        type="text"
                    >
                        Back to Messages
                    </Button>
                </div>
                <Card>
                    <div className="text-center py-12">
                        <p className="text-red-500 mb-4">{error || 'Unable to load conversation'}</p>
                        <Button type="primary" onClick={handleBackToMessages}>
                            Back to Messages
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    if (!client || !channel) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={handleBackToMessages}
                        type="text"
                    >
                        Back to Messages
                    </Button>
                </div>
                <Card>
                    <div className="text-center py-12">
                        <p className="text-gray-500 mb-4">Unable to connect to chat</p>
                        <Button type="primary" onClick={handleBackToMessages}>
                            Back to Messages
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={handleBackToMessages}
                    type="text"
                >
                    Back to Messages
                </Button>
            </div>

            <Card className="overflow-hidden" bodyStyle={{ padding: 0 }}>
                <div style={{ height: '600px' }}>
                    <Chat client={client} theme="str-chat__theme-light">
                        <Channel channel={channel}>
                            <Window>
                                <ChannelHeader />
                                <MessageList />
                                <MessageInput />
                            </Window>
                            <Thread />
                        </Channel>
                    </Chat>
                </div>
            </Card>
        </div>
    );
}
