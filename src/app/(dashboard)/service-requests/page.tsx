'use client';

import { useTranslations } from "next-intl";
import { useState, useEffect, useCallback } from 'react';
import Card from 'antd/es/card';
import Table from 'antd/es/table';
import Tag from 'antd/es/tag';
import Typography from 'antd/es/typography';
import Row from 'antd/es/row';
import Col from 'antd/es/col';
import Statistic from 'antd/es/statistic';
import message from 'antd/es/message';
import Select from 'antd/es/select';
import Tooltip from 'antd/es/tooltip';
import Input from 'antd/es/input';
import Button from 'antd/es/button';
import Space from 'antd/es/space';
import {
    InboxOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    FileSearchOutlined,
} from '@ant-design/icons';
import {
    serviceRequestsApi,
    type ServiceRequestEntry,
    type ServiceRequestStats,
    type ServiceRequestStatus,
    type ServiceRequestCategory,
} from '@/services/api/service-requests.api';
import { useAuth } from '@/providers/AuthProvider';

const { Title, Text, Paragraph } = Typography;

const PAGE_SIZE = 20;

const STATUS_COLORS: Record<ServiceRequestStatus, string> = {
    new: 'blue',
    in_progress: 'gold',
    resolved: 'green',
    closed: 'default',
};

export default function ServiceRequestsPage() {
    const t = useTranslations("serviceRequests");
    const t_errors2 = useTranslations("errors2");
    const t_misc = useTranslations("misc");
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [entries, setEntries] = useState<ServiceRequestEntry[]>([]);
    const [statusFilter, setStatusFilter] = useState<ServiceRequestStatus | 'all'>('all');
    const [categoryFilter, setCategoryFilter] = useState<ServiceRequestCategory | 'all'>('all');
    const [savingId, setSavingId] = useState<string | null>(null);
    const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: PAGE_SIZE,
        total: 0,
    });
    const [stats, setStats] = useState<ServiceRequestStats>({
        total: 0,
        new: 0,
        inProgress: 0,
        resolved: 0,
        closed: 0,
        byCategory: {},
    });

    const isAdmin = user?.role === 'admin';

    const statusLabel = useCallback(
        (status: ServiceRequestStatus) =>
            ({
                new: t("new"),
                in_progress: t("inProgress"),
                resolved: t("resolved"),
                closed: t("closed"),
            })[status],
        [t],
    );

    const categoryLabel = useCallback(
        (category: ServiceRequestCategory) =>
            ({
                property: t("categoryProperty"),
                service: t("categoryService"),
                buy_and_sell: t("categoryBuyAndSell"),
            })[category],
        [t],
    );

    const fetchData = useCallback(
        async (page = 1) => {
            setLoading(true);
            try {
                const result = await serviceRequestsApi.getAll({
                    page,
                    limit: PAGE_SIZE,
                    ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
                    ...(categoryFilter !== 'all' ? { category: categoryFilter } : {}),
                });
                setEntries(result.data);
                setPagination({
                    current: result.pagination?.currentPage ?? page,
                    pageSize: result.pagination?.itemsPerPage ?? PAGE_SIZE,
                    total: result.pagination?.totalItems ?? result.data.length,
                });
            } catch {
                message.error(t_errors2("loadServiceRequests"));
            } finally {
                setLoading(false);
            }
        },
        [statusFilter, categoryFilter, t_errors2],
    );

    const fetchStats = useCallback(async () => {
        try {
            const result = await serviceRequestsApi.getStats();
            if (result) setStats(result);
        } catch {
            // Non-blocking: the table is still usable without the counters.
        }
    }, []);

    useEffect(() => {
        if (isAdmin) {
            fetchData(1);
            fetchStats();
        }
    }, [isAdmin, fetchData, fetchStats]);

    const applyUpdate = async (
        id: string,
        payload: { status?: ServiceRequestStatus; adminNotes?: string },
    ) => {
        setSavingId(id);
        try {
            await serviceRequestsApi.update(id, payload);
            message.success(t("updated"));
            await Promise.all([fetchData(pagination.current), fetchStats()]);
        } catch {
            message.error(t_errors2("updateServiceRequest"));
        } finally {
            setSavingId(null);
        }
    };

    const columns = [
        {
            title: t("name"),
            dataIndex: 'fullName',
            key: 'fullName',
            render: (name: string) => <span className="font-medium">{name}</span>,
        },
        {
            title: t("contact"),
            key: 'contact',
            render: (_: unknown, row: ServiceRequestEntry) => (
                <div className="flex flex-col">
                    <a href={`mailto:${row.email}`}>{row.email}</a>
                    {row.phone ? (
                        <a href={`tel:${row.phone}`} className="text-xs">
                            {row.phone}
                        </a>
                    ) : null}
                </div>
            ),
        },
        {
            title: t("category"),
            dataIndex: 'category',
            key: 'category',
            render: (category: ServiceRequestCategory) => (
                <Tag color="purple">{categoryLabel(category)}</Tag>
            ),
        },
        {
            title: t("details"),
            dataIndex: 'details',
            key: 'details',
            render: (details: string, row: ServiceRequestEntry) => (
                <div style={{ maxWidth: 320 }}>
                    <Paragraph
                        ellipsis={{ rows: 3, expandable: true }}
                        style={{ marginBottom: 4 }}
                    >
                        {details}
                    </Paragraph>
                    {row.location ? (
                        <Text type="secondary" className="text-xs">
                            {t("location")}: {row.location}
                        </Text>
                    ) : null}
                    {row.budget ? (
                        <>
                            <br />
                            <Text type="secondary" className="text-xs">
                                {t("budget")}: {row.budget}
                            </Text>
                        </>
                    ) : null}
                </div>
            ),
        },
        {
            title: t("status"),
            dataIndex: 'status',
            key: 'status',
            render: (status: ServiceRequestStatus, row: ServiceRequestEntry) => (
                <Select
                    value={status}
                    size="small"
                    style={{ width: 140 }}
                    loading={savingId === row._id}
                    onChange={(value: ServiceRequestStatus) =>
                        applyUpdate(row._id, { status: value })
                    }
                    options={(
                        ['new', 'in_progress', 'resolved', 'closed'] as ServiceRequestStatus[]
                    ).map((s) => ({
                        value: s,
                        label: <Tag color={STATUS_COLORS[s]}>{statusLabel(s)}</Tag>,
                    }))}
                />
            ),
        },
        {
            title: t("adminNotes"),
            key: 'adminNotes',
            render: (_: unknown, row: ServiceRequestEntry) => (
                <Space.Compact style={{ width: 240 }}>
                    <Input
                        size="small"
                        placeholder={t("notesPlaceholder")}
                        value={noteDrafts[row._id] ?? row.adminNotes ?? ''}
                        onChange={(e) =>
                            setNoteDrafts((prev) => ({ ...prev, [row._id]: e.target.value }))
                        }
                    />
                    <Button
                        size="small"
                        type="primary"
                        loading={savingId === row._id}
                        onClick={() =>
                            applyUpdate(row._id, {
                                adminNotes: noteDrafts[row._id] ?? row.adminNotes ?? '',
                            })
                        }
                    >
                        {t("save")}
                    </Button>
                </Space.Compact>
            ),
        },
        {
            title: t("submittedAt"),
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (d: string) => (
                <Tooltip title={new Date(d).toLocaleString()}>
                    {new Date(d).toLocaleDateString()}
                </Tooltip>
            ),
        },
    ];

    if (!isAdmin) {
        return (
            <Card>
                <Title level={4}>{t("accessDenied")}</Title>
                <Text type="secondary">{t("accessDeniedBody")}</Text>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <Title
                    level={2}
                    style={{
                        background: 'linear-gradient(135deg, #0000FF 0%, #0000CC 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}
                >
                    {t_misc("serviceRequests")}
                </Title>
                <Text type="secondary">{t_misc("serviceRequestsIntro")}</Text>
            </div>

            <Row gutter={[16, 16]}>
                {[
                    { title: t("total"), value: stats.total, color: '#0000FF', icon: <InboxOutlined /> },
                    { title: t("new"), value: stats.new, color: '#1890ff', icon: <FileSearchOutlined /> },
                    { title: t("inProgress"), value: stats.inProgress, color: '#faad14', icon: <ClockCircleOutlined /> },
                    { title: t("resolved"), value: stats.resolved, color: '#52c41a', icon: <CheckCircleOutlined /> },
                ].map((s) => (
                    <Col xs={12} lg={6} key={s.title}>
                        <Card style={{ borderRadius: 12 }} styles={{ body: { padding: 20 } }}>
                            <Statistic
                                title={s.title}
                                value={s.value}
                                valueStyle={{ color: s.color, fontWeight: 700 }}
                                prefix={s.icon}
                            />
                        </Card>
                    </Col>
                ))}
            </Row>

            <Card style={{ borderRadius: 12 }}>
                <div className="flex flex-wrap items-center gap-4 mb-4">
                    <Select
                        value={statusFilter}
                        onChange={setStatusFilter}
                        style={{ width: 180 }}
                        options={[
                            { label: t("allStatuses"), value: 'all' },
                            { label: t("new"), value: 'new' },
                            { label: t("inProgress"), value: 'in_progress' },
                            { label: t("resolved"), value: 'resolved' },
                            { label: t("closed"), value: 'closed' },
                        ]}
                    />
                    <Select
                        value={categoryFilter}
                        onChange={setCategoryFilter}
                        style={{ width: 180 }}
                        options={[
                            { label: t("allCategories"), value: 'all' },
                            { label: t("categoryProperty"), value: 'property' },
                            { label: t("categoryService"), value: 'service' },
                            { label: t("categoryBuyAndSell"), value: 'buy_and_sell' },
                        ]}
                    />
                </div>
                <Table
                    loading={loading}
                    dataSource={entries}
                    columns={columns}
                    rowKey="_id"
                    scroll={{ x: 'max-content' }}
                    pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        total: pagination.total,
                        showSizeChanger: false,
                        showTotal: (total) => t("totalRequests", { total }),
                        onChange: (page) => fetchData(page),
                    }}
                    locale={{ emptyText: t("empty") }}
                />
            </Card>
        </div>
    );
}
