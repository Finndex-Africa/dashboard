'use client';

import { useState, useEffect } from 'react';
import Form from 'antd/es/form';
import Input from 'antd/es/input';
import InputNumber from 'antd/es/input-number';
import Select from 'antd/es/select';
import Switch from 'antd/es/switch';
import Button from 'antd/es/button';
import Row from 'antd/es/row';
import Col from 'antd/es/col';
import Divider from 'antd/es/divider';
import Typography from 'antd/es/typography';
import Upload from 'antd/es/upload';
import Tag from 'antd/es/tag';
import { PlusOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { showToast } from '@/lib/toast';
import {
    LAND_SUBCATEGORY_OPTIONS,
    HOUSEHOLD_SUBCATEGORY_OPTIONS,
    LAND_UNIT_OPTIONS,
    ITEM_CONDITION_OPTIONS,
} from '@/lib/buy-sell-categories';
import { getBuySellCategoryLabel, getStatusColor, getStatusLabel } from '@/lib/buy-sell-utils';
import type { BuySellCategory, BuySellListing } from '@/types/buy-sell';

const { TextArea } = Input;
const { Text } = Typography;

// ─── Property type options (replaces houseSubcategory) ───────────────────────
const PROPERTY_TYPE_OPTIONS = [
    { value: 'apartment',  label: 'Apartment' },
    { value: 'duplex',     label: 'Duplex' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'villa',      label: 'Villa' },
    { value: 'bungalow',   label: 'Bungalow' },
    { value: 'penthouse',  label: 'Penthouse' },
    { value: 'townhouse',  label: 'Townhouse' },
    { value: 'studio',     label: 'Studio' },
    { value: 'other',      label: 'Other' },
];

// ─── Category options for create mode ────────────────────────────────────────
const CATEGORY_OPTIONS: { value: BuySellCategory; label: string }[] = [
    { value: 'land',           label: 'Land' },
    { value: 'house',          label: 'House' },
    { value: 'household_item', label: 'Household Item' },
];

// ─── Amenity options (same set as PropertyForm) ───────────────────────────────
const AMENITY_OPTIONS = [
    { value: 'Water',            icon: '💧' },
    { value: 'Electricity',      icon: '⚡' },
    { value: 'WiFi',             icon: '📶' },
    { value: 'Parking',          icon: '🚗' },
    { value: 'Security',         icon: '🔒' },
    { value: 'Swimming Pool',    icon: '🏊' },
    { value: 'Gym',              icon: '💪' },
    { value: 'Living Room',      icon: '🛋️' },
    { value: 'Porch',            icon: '🌿' },
    { value: 'Air Conditioning', icon: '❄️' },
    { value: 'Dining Room',      icon: '🍽️' },
    { value: 'Laundry',          icon: '🧺' },
    { value: 'Kitchen',          icon: '🍳' },
    { value: 'Generator',        icon: '⚙️' },
    { value: 'CCTV',             icon: '📹' },
    { value: 'Gate',             icon: '🚪' },
] as const;

// ─── Props ────────────────────────────────────────────────────────────────────
export interface BuySellFormSubmitPayload {
    values: Record<string, any>;
    files: File[];
    keptImages: string[];
}

interface BuySellFormProps {
    /**
     * Listing being edited — drives initial values and category.
     * Omit (or pass undefined) for create mode.
     */
    listing?: BuySellListing;
    onSubmit: (payload: BuySellFormSubmitPayload) => void;
    onCancel: () => void;
    loading?: boolean;
}

// ─── Section header matching PropertyForm style ───────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <Text
            strong
            style={{ fontSize: 15, color: '#667eea', display: 'block', marginBottom: 16 }}
        >
            {children}
        </Text>
    );
}

// ─── Component ────────────────────────────────────────────────────────────────
export function BuySellForm({ listing, onSubmit, onCancel, loading }: BuySellFormProps) {
    const isCreate = !listing;

    const [form]                                    = Form.useForm();
    const [fileList, setFileList]                   = useState<UploadFile[]>([]);
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
    const [activeCategory, setActiveCategory]       = useState<BuySellCategory | null>(
        listing?.category ?? null,
    );

    const category = activeCategory;

    // ── Initialise form + file list (edit mode only) ──────────────────────────
    useEffect(() => {
        if (!listing) return;

        form.setFieldsValue({
            title:             listing.title,
            description:       listing.description,
            price:             listing.price,
            location:          listing.location,
            isPremium:         listing.isPremium ?? false,
            agentFee:          listing.agentFee,
            // Land
            landSubcategory:   listing.landSubcategory,
            landSize:          listing.landSize,
            unit:              listing.unit,
            ownershipStatus:   listing.ownershipStatus,
            sellerPhone:       listing.sellerPhone,
            whatsappNumber:    listing.whatsappNumber,
            // House
            bedrooms:          listing.bedrooms,
            bathrooms:         listing.bathrooms,
            propertyType:      listing.propertyType,
            // Household
            itemSubcategory:   listing.itemSubcategory,
            condition:         listing.condition,
            warranty:          listing.warranty          ?? false,
            deliveryAvailable: listing.deliveryAvailable ?? false,
        });

        // Pre-load existing images as UploadFile entries
        if (listing.images?.length) {
            setFileList(
                listing.images.map((url, i) => ({
                    uid:    `-existing-${i}`,
                    name:   `image-${i + 1}.jpg`,
                    status: 'done' as const,
                    url,
                })),
            );
        }

        // Pre-select amenities that are already saved (house category)
        if (listing.category === 'house' && listing.amenities?.length) {
            setSelectedAmenities(listing.amenities.map((a) => a.label));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [listing]);

    // ── Amenity toggle ────────────────────────────────────────────────────────
    const toggleAmenity = (value: string) => {
        setSelectedAmenities((prev) =>
            prev.includes(value) ? prev.filter((a) => a !== value) : [...prev, value],
        );
    };

    // ── Upload helpers ────────────────────────────────────────────────────────
    const beforeUpload = (file: File) => {
        if (!file.type.startsWith('image/')) {
            showToast.error('You can only upload image files!');
            return Upload.LIST_IGNORE;
        }
        if (file.size / 1024 / 1024 > 10) {
            showToast.error('Image must be smaller than 10MB!');
            return Upload.LIST_IGNORE;
        }
        return false;
    };

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleFinish = (values: any) => {
        const amenitiesPayload =
            category === 'house' && selectedAmenities.length > 0
                ? selectedAmenities.map((label) => {
                    const opt = AMENITY_OPTIONS.find((a) => a.value === label);
                    return { icon: opt?.icon ?? '•', label };
                })
                : undefined;

        const files = fileList
            .filter((f) => f.originFileObj)
            .map((f) => f.originFileObj as File);

        const keptImages = fileList
            .filter((f) => !f.originFileObj && f.url)
            .map((f) => f.url as string);

        onSubmit({
            values: { ...values, amenities: amenitiesPayload },
            files,
            keptImages,
        });
    };

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={handleFinish}
            style={{ marginTop: 20 }}
        >
            {/* ── Edit-mode status context ──────────────────────────────────── */}
            {!isCreate && listing && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                    <Tag color="blue">{getBuySellCategoryLabel(listing.category)}</Tag>
                    <Tag color={getStatusColor(listing.status)}>{getStatusLabel(listing.status)}</Tag>
                    {listing.isPremium && <Tag color="gold">Featured</Tag>}
                </div>
            )}

            {/* ── Create-mode: Category selector ───────────────────────────── */}
            {isCreate && (
                <>
                    <SectionTitle>What are you selling?</SectionTitle>
                    <Form.Item
                        name="category"
                        label="Category"
                        rules={[{ required: true, message: 'Please select a category' }]}
                    >
                        <Select
                            size="large"
                            placeholder="Select category"
                            style={{ borderRadius: 8 }}
                            onChange={(v: BuySellCategory) => {
                                setActiveCategory(v);
                                // Reset category-specific fields when switching
                                setSelectedAmenities([]);
                            }}
                        >
                            {CATEGORY_OPTIONS.map((o) => (
                                <Select.Option key={o.value} value={o.value}>{o.label}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Divider style={{ margin: '20px 0' }} />
                </>
            )}

            {/* ── Basic Information ─────────────────────────────────────────── */}
            <SectionTitle>Basic Information</SectionTitle>
            <Row gutter={16}>
                <Col xs={24}>
                    <Form.Item
                        name="title"
                        label="Title"
                        rules={[{ required: true, message: 'Title is required' }]}
                    >
                        <Input size="large" placeholder="Listing title" style={{ borderRadius: 8 }} />
                    </Form.Item>
                </Col>
                <Col xs={24}>
                    <Form.Item
                        name="description"
                        label="Description"
                        rules={[{ required: true, message: 'Description is required' }]}
                    >
                        <TextArea rows={4} placeholder="Describe the listing…" style={{ borderRadius: 8 }} />
                    </Form.Item>
                </Col>
            </Row>

            <Divider style={{ margin: '20px 0' }} />

            {/* ── Location & Price ──────────────────────────────────────────── */}
            <SectionTitle>Location &amp; Price</SectionTitle>
            <Row gutter={16}>
                <Col xs={24} sm={14}>
                    <Form.Item
                        name="location"
                        label="Location"
                        rules={[{ required: true, message: 'Location is required' }]}
                    >
                        <Input size="large" placeholder="e.g. Kibagabaga, Kigali" style={{ borderRadius: 8 }} />
                    </Form.Item>
                </Col>
                <Col xs={24} sm={10}>
                    <Form.Item
                        name="price"
                        label="Price ($)"
                        rules={[{ required: true, message: 'Price is required' }]}
                    >
                        <InputNumber
                            size="large"
                            min={0}
                            style={{ width: '100%', borderRadius: 8 }}
                            formatter={(v) => `$ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={(v) => v?.replace(/\$\s?|(,*)/g, '') as any}
                            placeholder="0"
                        />
                    </Form.Item>
                </Col>
                <Col xs={24} sm={10}>
                    <Form.Item name="agentFee" label="Agent Fee ($)">
                        <InputNumber
                            size="large"
                            min={0}
                            style={{ width: '100%', borderRadius: 8 }}
                            formatter={(v) => (v ? `$ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '')}
                            parser={(v) => v?.replace(/\$\s?|(,*)/g, '') as any}
                            placeholder="Optional"
                        />
                    </Form.Item>
                </Col>
            </Row>

            <Divider style={{ margin: '20px 0' }} />

            {/* ── Land Details ──────────────────────────────────────────────── */}
            {category === 'land' && (
                <>
                    <SectionTitle>Land Details</SectionTitle>
                    <Row gutter={16}>
                        <Col xs={24} sm={12}>
                            <Form.Item label="Land Subcategory" name="landSubcategory">
                                <Select size="large" placeholder="Select subcategory" allowClear style={{ borderRadius: 8 }}>
                                    {LAND_SUBCATEGORY_OPTIONS.map((o) => (
                                        <Select.Option key={o.value} value={o.value}>{o.label}</Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item label="Ownership Status" name="ownershipStatus">
                                <Input size="large" placeholder="e.g. C of O, Survey Plan" style={{ borderRadius: 8 }} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item label="Land Size" name="landSize">
                                <InputNumber size="large" min={0} style={{ width: '100%' }} placeholder="e.g. 5" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item label="Unit" name="unit">
                                <Select size="large" placeholder="Select unit" allowClear style={{ borderRadius: 8 }}>
                                    {LAND_UNIT_OPTIONS.map((o) => (
                                        <Select.Option key={o.value} value={o.value}>{o.label}</Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item label="Seller Phone" name="sellerPhone">
                                <Input size="large" placeholder="Direct phone number" style={{ borderRadius: 8 }} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item label="WhatsApp Number" name="whatsappNumber">
                                <Input size="large" placeholder="WhatsApp contact" style={{ borderRadius: 8 }} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Divider style={{ margin: '20px 0' }} />
                </>
            )}

            {/* ── House Details ─────────────────────────────────────────────── */}
            {category === 'house' && (
                <>
                    <SectionTitle>House Details</SectionTitle>
                    <Row gutter={16}>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                label="Property Type"
                                name="propertyType"
                                rules={[{ required: true, message: 'Property type is required' }]}
                            >
                                <Select size="large" placeholder="Select property type" allowClear style={{ borderRadius: 8 }}>
                                    {PROPERTY_TYPE_OPTIONS.map((o) => (
                                        <Select.Option key={o.value} value={o.value}>{o.label}</Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            {/* spacer */}
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                label="Bedrooms"
                                name="bedrooms"
                                rules={[{ required: true, message: 'Bedrooms required' }]}
                            >
                                <InputNumber size="large" min={0} style={{ width: '100%' }} placeholder="0" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                label="Bathrooms"
                                name="bathrooms"
                                rules={[{ required: true, message: 'Bathrooms required' }]}
                            >
                                <InputNumber size="large" min={0} style={{ width: '100%' }} placeholder="0" step={0.5} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Divider style={{ margin: '20px 0' }} />

                    {/* Amenities chip grid */}
                    <SectionTitle>Amenities</SectionTitle>
                    <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 16 }}>
                        Select all amenities available in this house
                    </Text>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                            gap: 12,
                            marginBottom: 8,
                        }}
                    >
                        {AMENITY_OPTIONS.map((amenity) => {
                            const active = selectedAmenities.includes(amenity.value);
                            return (
                                <button
                                    key={amenity.value}
                                    type="button"
                                    onClick={() => toggleAmenity(amenity.value)}
                                    style={{
                                        padding: '14px 16px',
                                        borderRadius: 10,
                                        border: `1.5px solid ${active ? '#667eea' : '#e5e7eb'}`,
                                        background: active ? 'rgba(102, 126, 234, 0.08)' : '#fff',
                                        color: active ? '#667eea' : '#374151',
                                        textAlign: 'left',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 10,
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease',
                                        fontWeight: active ? 600 : 400,
                                    }}
                                >
                                    <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>{amenity.icon}</span>
                                    <span style={{ fontSize: 13 }}>{amenity.value}</span>
                                </button>
                            );
                        })}
                    </div>
                    <Divider style={{ margin: '20px 0' }} />
                </>
            )}

            {/* ── Household Item Details ────────────────────────────────────── */}
            {category === 'household_item' && (
                <>
                    <SectionTitle>Item Details</SectionTitle>
                    <Row gutter={16}>
                        <Col xs={24} sm={12}>
                            <Form.Item label="Item Subcategory" name="itemSubcategory">
                                <Select size="large" placeholder="Select subcategory" allowClear style={{ borderRadius: 8 }}>
                                    {HOUSEHOLD_SUBCATEGORY_OPTIONS.map((o) => (
                                        <Select.Option key={o.value} value={o.value}>{o.label}</Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item label="Condition" name="condition">
                                <Select size="large" placeholder="Select condition" allowClear style={{ borderRadius: 8 }}>
                                    {ITEM_CONDITION_OPTIONS.map((o) => (
                                        <Select.Option key={o.value} value={o.value}>{o.label}</Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={6}>
                            <Form.Item label="Warranty" name="warranty" valuePropName="checked">
                                <Switch checkedChildren="Yes" unCheckedChildren="No" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={6}>
                            <Form.Item label="Delivery Available" name="deliveryAvailable" valuePropName="checked">
                                <Switch checkedChildren="Yes" unCheckedChildren="No" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Divider style={{ margin: '20px 0' }} />
                </>
            )}

            {/* ── Featured ──────────────────────────────────────────────────── */}
            <div
                style={{
                    marginBottom: 24,
                    padding: '16px 20px',
                    borderRadius: 10,
                    border: '1px solid #e5e7eb',
                    background: '#fafafa',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                }}
            >
                <div>
                    <Text strong style={{ display: 'block' }}>Featured Listing</Text>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                        Featured listings are highlighted on the platform. Admin-controlled.
                    </Text>
                </div>
                <Form.Item name="isPremium" valuePropName="checked" noStyle style={{ marginBottom: 0 }}>
                    <Switch checkedChildren="Featured" unCheckedChildren="Not featured" />
                </Form.Item>
            </div>

            <Divider style={{ margin: '20px 0' }} />

            {/* ── Images ────────────────────────────────────────────────────── */}
            <SectionTitle>Images</SectionTitle>
            <Upload
                listType="picture-card"
                fileList={fileList}
                onChange={({ fileList: next }) => setFileList(next)}
                beforeUpload={beforeUpload}
                customRequest={({ onSuccess }) => { setTimeout(() => onSuccess?.('ok'), 0); }}
                multiple
                maxCount={20}
            >
                {fileList.length < 20 && (
                    <div>
                        <PlusOutlined />
                        <div style={{ marginTop: 8 }}>Upload</div>
                    </div>
                )}
            </Upload>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
                Minimum 4 images recommended. Max 10MB per image.
            </Text>

            {/* ── Action buttons ────────────────────────────────────────────── */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 12,
                    paddingTop: 16,
                    borderTop: '1px solid #f0f0f0',
                    marginTop: 24,
                }}
            >
                <Button size="large" onClick={onCancel} style={{ borderRadius: 8, minWidth: 100 }}>
                    Cancel
                </Button>
                <Button
                    type="primary"
                    size="large"
                    htmlType="submit"
                    loading={loading}
                    style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        border: 'none',
                        borderRadius: 8,
                        minWidth: 160,
                    }}
                >
                    {isCreate ? 'Post Listing' : 'Save Changes'}
                </Button>
            </div>
        </Form>
    );
}
