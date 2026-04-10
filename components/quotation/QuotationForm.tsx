'use client';

import React from 'react';
import {
  Form,
  Input,
  DatePicker,
  InputNumber,
  Button,
  Select,
  Checkbox,
  Slider,
  Row,
  Col,
  Card,
  Grid,
} from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd/es/form';
import type { Quotation, LineItem, ItineraryDay, HotelStay } from '@/types/quotation';
import { DEFAULT_EXCLUSIONS, DEFAULT_INCLUSIONS, DEFAULT_HOTELS } from '@/types/quotation';
import dayjs from 'dayjs';
import { normalizeStringList } from '@/utils/formatting';

const { TextArea } = Input;
const { useBreakpoint } = Grid;

interface QuotationFormProps {
  form: FormInstance;
  initialValues?: Partial<Quotation>;
  onValuesChange?: (changedValues: unknown, allValues: unknown) => void;
}

export function QuotationForm({
  form,
  initialValues,
  onValuesChange,
}: QuotationFormProps) {
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const pricingGridTemplate = isMobile ? '1fr' : 'minmax(0, 1.7fr) minmax(0, 1.6fr) 72px 96px 110px 32px';
  const cardSpacing = isMobile ? 12 : 10;
  const listRowTemplate = isMobile ? 'minmax(0, 1fr) 32px' : 'minmax(0, 1fr) 32px';

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={prepareQuotationFormValues(initialValues)}
      onValuesChange={onValuesChange}
      size="small"
      className="quotation-form"
    >
      {/* Quotation Details */}
      <Card
        size="small"
        title={<span style={{ color: '#C4622D', fontSize: '12px', letterSpacing: '0.1em' }}>QUOTATION</span>}
        style={{ marginBottom: cardSpacing }}
      >
        <Row gutter={12}>
          <Col xs={24} md={12}>
            <Form.Item label="Number" name="number" rules={[{ required: true }]}>
              <Input placeholder="QT-2025-001" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="Document text size" name="documentFontScale" rules={[{ required: true }]}>
              <Slider
                min={1}
                max={1.5}
                step={0.05}
                marks={{
                  1: 'Compact',
                  1.15: 'Std',
                  1.3: 'Large',
                  1.5: 'Max',
                }}
                tooltip={{ formatter: (value) => `${Math.round((value ?? 1) * 100)}%` }}
              />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item label="Status" name="status" rules={[{ required: true }]} style={{ marginBottom: 0 }}>
          <Select
            options={[
              { label: 'Draft', value: 'draft' },
              { label: 'Sent', value: 'sent' },
              { label: 'Confirmed', value: 'confirmed' },
              { label: 'Lost', value: 'lost' },
            ]}
          />
        </Form.Item>
      </Card>

      <Card
        size="small"
        title={<span style={{ color: '#C4622D', fontSize: '12px', letterSpacing: '0.1em' }}>KEY DATES</span>}
        style={{ marginBottom: cardSpacing }}
      >
        <Row gutter={12}>
          <Col xs={24} md={12}>
            <Form.Item label="Quotation date" name="date" rules={[{ required: true }]}>
              <DatePicker style={{ width: '100%' }} format="DD MMM YYYY" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="Valid until" name="validUntil" rules={[{ required: true }]}>
              <DatePicker style={{ width: '100%' }} format="DD MMM YYYY" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={12}>
          <Col xs={24} md={12}>
            <Form.Item label="Departure" name={['trip', 'departureDate']}>
              <DatePicker style={{ width: '100%' }} format="DD MMM YYYY" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="Return" name={['trip', 'returnDate']}>
              <DatePicker style={{ width: '100%' }} format="DD MMM YYYY" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item label="Balance due date" name={['payment', 'balanceDueDate']} style={{ marginBottom: 0 }}>
          <DatePicker style={{ width: '100%' }} format="DD MMM YYYY" />
        </Form.Item>
      </Card>

      {/* Customer */}
      <Card
        size="small"
        title={<span style={{ color: '#C4622D', fontSize: '12px', letterSpacing: '0.1em' }}>CUSTOMER</span>}
        style={{ marginBottom: cardSpacing }}
      >
        <Form.Item label="Full name" name={['customer', 'name']} rules={[{ required: true }]}>
          <Input placeholder="As on passport" />
        </Form.Item>
        <Row gutter={12}>
          <Col xs={24} md={12}>
            <Form.Item label="Email" name={['customer', 'email']}>
              <Input type="email" placeholder="email@example.com" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="Phone" name={['customer', 'phone']}>
              <Input placeholder="+91 98XXX XXXXX" />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* Trip */}
      <Card
        size="small"
        title={<span style={{ color: '#C4622D', fontSize: '12px', letterSpacing: '0.1em' }}>TRIP</span>}
        style={{ marginBottom: cardSpacing }}
      >
        <Form.Item label="Destination" name={['trip', 'destination']} rules={[{ required: true }]}>
          <Input placeholder="e.g. Santorini, Greece" />
        </Form.Item>
        <Row gutter={12}>
          <Col xs={24} sm={8}>
            <Form.Item label="Adults" name={['trip', 'adults']}>
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item label="Children" name={['trip', 'children']}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item label="Nights" name={['trip', 'nights']}>
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item label="Package type" name={['trip', 'packageType']}>
          <Input placeholder="e.g. Luxury Honeymoon" />
        </Form.Item>
        <Form.List name={['trip', 'batchDates']}>
          {(fields, { add, remove }) => (
            <Card
              size="small"
              type="inner"
              title="Batch date options"
              styles={{ body: { padding: 12 } }}
            >
              {fields.map(({ key, name, ...restField }) => (
                <div
                  key={key}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? 'minmax(0, 1fr) 32px' : '180px 32px',
                    gap: 8,
                    marginBottom: 8,
                    alignItems: 'start',
                  }}
                >
                  <Form.Item
                    {...restField}
                    name={name}
                    style={{ marginBottom: 0 }}
                  >
                    <DatePicker style={{ width: '100%' }} format="DD MMM YYYY" />
                  </Form.Item>
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => remove(name)}
                  />
                </div>
              ))}
              <Button type="dashed" onClick={() => add(undefined)} block icon={<PlusOutlined />} size="small">
                Add batch date
              </Button>
            </Card>
          )}
        </Form.List>
        <Form.Item label="Consultant name" name="consultant">
          <Input placeholder="Your name" />
        </Form.Item>
      </Card>

      {/* Pricing */}
      <Card
        size="small"
        title={<span style={{ color: '#C4622D', fontSize: '12px', letterSpacing: '0.1em' }}>PRICING</span>}
        style={{ marginBottom: cardSpacing }}
      >
        {!isMobile ? (
          <div style={{ marginBottom: 8, display: 'grid', gridTemplateColumns: pricingGridTemplate, gap: 8 }}>
            <span style={{ fontSize: 11, color: '#7A6E60', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Component</span>
            <span style={{ fontSize: 11, color: '#7A6E60', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Details</span>
            <span style={{ fontSize: 11, color: '#7A6E60', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'right' }}>Qty</span>
            <span style={{ fontSize: 11, color: '#7A6E60', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'right' }}>Rate</span>
            <span style={{ fontSize: 11, color: '#7A6E60', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Logic</span>
            <span></span>
          </div>
        ) : null}
        <Form.List name="lineItems">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <div
                  key={key}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: pricingGridTemplate,
                    gap: 8,
                    marginBottom: 8,
                    alignItems: 'start',
                    padding: isMobile ? 12 : 0,
                    background: isMobile ? '#F7F4EE' : 'transparent',
                    border: isMobile ? '1px solid #E0DDD5' : 'none',
                    borderRadius: isMobile ? 6 : 0,
                  }}
                >
                  <Form.Item
                    {...restField}
                    label={isMobile ? 'Component' : undefined}
                    name={[name, 'desc']}
                    style={{ marginBottom: 0 }}
                  >
                    <Input placeholder="Component" size="small" />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    label={isMobile ? 'Details' : undefined}
                    name={[name, 'detail']}
                    style={{ marginBottom: 0 }}
                  >
                    <Input placeholder="Details" size="small" />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    label={isMobile ? 'Qty' : undefined}
                    name={[name, 'qty']}
                    style={{ marginBottom: 0 }}
                  >
                    <InputNumber
                      placeholder="1"
                      min={0}
                      style={{ width: '100%', textAlign: 'right' }}
                      size="small"
                    />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    label={isMobile ? 'Rate' : undefined}
                    name={[name, 'amt']}
                    style={{ marginBottom: 0 }}
                  >
                    <InputNumber
                      placeholder="0"
                      min={0}
                      style={{ width: '100%', textAlign: 'right' }}
                      size="small"
                    />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    label={isMobile ? 'Logic' : undefined}
                    name={[name, 'mode']}
                    style={{ marginBottom: 0 }}
                  >
                    <Select
                      size="small"
                      options={[
                        { label: 'AND', value: 'and' },
                        { label: 'OR', value: 'or' },
                      ]}
                    />
                  </Form.Item>
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => remove(name)}
                    style={{
                      marginTop: isMobile ? 0 : 2,
                      justifySelf: isMobile ? 'end' : 'stretch',
                    }}
                  />
                  <div
                    style={{
                      gridColumn: '1 / -1',
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1fr) auto',
                      gap: 8,
                      alignItems: 'center',
                    }}
                  >
                    <Form.Item
                      {...restField}
                      label={isMobile ? 'Alternative group' : undefined}
                      name={[name, 'orGroup']}
                      style={{ marginBottom: 0 }}
                      extra={isMobile ? 'Use only for OR items, e.g. airport transfer or bike option' : undefined}
                    >
                      <Input placeholder="Alternative group for OR items" size="small" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'selected']}
                      valuePropName="checked"
                      style={{ marginBottom: 0 }}
                    >
                      <Checkbox>Use this option in total</Checkbox>
                    </Form.Item>
                  </div>
                </div>
              ))}
              <Button
                type="dashed"
                onClick={() => add({ desc: '', detail: '', qty: 1, amt: '', mode: 'and', selected: true, orGroup: '' })}
                block
                icon={<PlusOutlined />}
                size="small"
              >
                Add component
              </Button>
            </>
          )}
        </Form.List>
      </Card>

      {/* Inclusions */}
      <Card
        size="small"
        title={<span style={{ color: '#C4622D', fontSize: '12px', letterSpacing: '0.1em' }}>HOTELS</span>}
        style={{ marginBottom: cardSpacing }}
      >
        <Form.List name="hotels">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <div
                  key={key}
                  style={{
                    background: '#F7F4EE',
                    border: '1px solid #E0DDD5',
                    borderRadius: 6,
                    padding: 12,
                    marginBottom: 8,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#1B3A4B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Hotel option
                    </span>
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => remove(name)}
                    />
                  </div>
                  <Form.Item {...restField} name={[name, 'name']} style={{ marginBottom: 8 }}>
                    <Input placeholder="Hotel name" size="small" />
                  </Form.Item>
                  <Row gutter={8}>
                    <Col xs={24} md={10}>
                      <Form.Item {...restField} name={[name, 'location']} style={{ marginBottom: 8 }}>
                        <Input placeholder="Location / city" size="small" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={10}>
                      <Form.Item {...restField} name={[name, 'roomType']} style={{ marginBottom: 8 }}>
                        <Input placeholder="Room type / meal plan" size="small" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={4}>
                      <Form.Item {...restField} name={[name, 'nights']} style={{ marginBottom: 0 }}>
                        <InputNumber min={0} style={{ width: '100%' }} placeholder="Nts" size="small" />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              ))}
              <Button
                type="dashed"
                onClick={() => add({ name: '', location: '', roomType: '', nights: '' })}
                block
                icon={<PlusOutlined />}
                size="small"
              >
                Add hotel
              </Button>
            </>
          )}
        </Form.List>
      </Card>

      <Card
        size="small"
        title={<span style={{ color: '#C4622D', fontSize: '12px', letterSpacing: '0.1em' }}>INCLUSIONS</span>}
        style={{ marginBottom: cardSpacing }}
      >
        <Form.List name="inclusions">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <div
                  key={key}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: listRowTemplate,
                    gap: 8,
                    marginBottom: 8,
                    alignItems: 'start',
                  }}
                >
                  <Form.Item
                    {...restField}
                    name={name}
                    style={{ marginBottom: 0 }}
                  >
                    <Input placeholder="Included item" size="small" />
                  </Form.Item>
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => remove(name)}
                  />
                </div>
              ))}
              <Button
                type="dashed"
                onClick={() => add('')}
                block
                icon={<PlusOutlined />}
                size="small"
              >
                Add inclusion
              </Button>
            </>
          )}
        </Form.List>
      </Card>

      <Card
        size="small"
        title={<span style={{ color: '#C4622D', fontSize: '12px', letterSpacing: '0.1em' }}>EXCLUSIONS</span>}
        style={{ marginBottom: cardSpacing }}
      >
        <Form.List name="exclusions">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <div
                  key={key}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: listRowTemplate,
                    gap: 8,
                    marginBottom: 8,
                    alignItems: 'start',
                  }}
                >
                  <Form.Item
                    {...restField}
                    name={name}
                    style={{ marginBottom: 0 }}
                  >
                    <Input placeholder="Excluded item" size="small" />
                  </Form.Item>
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => remove(name)}
                  />
                </div>
              ))}
              <Button
                type="dashed"
                onClick={() => add('')}
                block
                icon={<PlusOutlined />}
                size="small"
              >
                Add exclusion
              </Button>
            </>
          )}
        </Form.List>
      </Card>

      {/* Itinerary */}
      <Card
        size="small"
        title={<span style={{ color: '#C4622D', fontSize: '12px', letterSpacing: '0.1em' }}>ITINERARY</span>}
        style={{ marginBottom: cardSpacing }}
      >
        <Form.List name="itinerary">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }, index) => (
                <div
                  key={key}
                  style={{
                    background: '#F5EFE0',
                    border: '1px solid #E0DDD5',
                    borderRadius: 4,
                    padding: 12,
                    marginBottom: 8,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 500, color: '#1B3A4B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Day {index + 1}
                    </span>
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => remove(name)}
                    />
                  </div>
                  <Form.Item {...restField} name={[name, 'title']} style={{ marginBottom: 8 }}>
                    <Input placeholder="Day title" size="small" />
                  </Form.Item>
                  <Form.Item {...restField} name={[name, 'desc']} style={{ marginBottom: 0 }}>
                    <TextArea
                      rows={2}
                      placeholder="Activities, meals, accommodation..."
                      size="small"
                    />
                  </Form.Item>
                </div>
              ))}
              <Button
                type="dashed"
                onClick={() => add({ title: '', desc: '' })}
                block
                icon={<PlusOutlined />}
                size="small"
              >
                Add day
              </Button>
            </>
          )}
        </Form.List>
      </Card>

      <Card
        size="small"
        title={<span style={{ color: '#C4622D', fontSize: '12px', letterSpacing: '0.1em' }}>SPECIAL NOTES</span>}
        style={{ marginBottom: cardSpacing }}
      >
        <Form.List name="notes">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <div
                  key={key}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: listRowTemplate,
                    gap: 8,
                    marginBottom: 8,
                    alignItems: 'start',
                  }}
                >
                  <Form.Item {...restField} name={name} style={{ marginBottom: 0 }}>
                    <Input placeholder="Important note" size="small" />
                  </Form.Item>
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => remove(name)}
                  />
                </div>
              ))}
              <Button type="dashed" onClick={() => add('')} block icon={<PlusOutlined />} size="small">
                Add note
              </Button>
            </>
          )}
        </Form.List>
      </Card>

      <Card
        size="small"
        title={<span style={{ color: '#C4622D', fontSize: '12px', letterSpacing: '0.1em' }}>TERMS & CONDITIONS</span>}
        style={{ marginBottom: cardSpacing }}
      >
        <Form.List name="terms">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <div
                  key={key}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: listRowTemplate,
                    gap: 8,
                    marginBottom: 8,
                    alignItems: 'start',
                  }}
                >
                  <Form.Item {...restField} name={name} style={{ marginBottom: 0 }}>
                    <TextArea rows={2} placeholder="Term or condition" size="small" />
                  </Form.Item>
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => remove(name)}
                  />
                </div>
              ))}
              <Button type="dashed" onClick={() => add('')} block icon={<PlusOutlined />} size="small">
                Add term
              </Button>
            </>
          )}
        </Form.List>
      </Card>
    </Form>
  );
}

export function prepareQuotationFormValues(values?: Partial<Quotation>) {
  if (!values) return undefined;

  const parseDateInput = (value: unknown) => {
    if (!value) {
      return undefined;
    }

    if (dayjs.isDayjs(value)) {
      return value.isValid() ? value : undefined;
    }

    const parsed = dayjs(String(value));
    return parsed.isValid() ? parsed : undefined;
  };

  return {
    ...values,
    documentFontScale: values.documentFontScale ?? 1,
    lineItems: (values.lineItems ?? []).map((item) => ({
      ...item,
      qty: item.qty ?? 1,
      mode: item.mode ?? 'and',
      selected: item.mode === 'or' ? item.selected ?? true : true,
      orGroup: item.orGroup ?? '',
    })),
    hotels: (values.hotels as HotelStay[] | undefined)?.length
      ? (values.hotels as HotelStay[]).map((hotel) => ({
          ...hotel,
          nights: hotel.nights ?? '',
        }))
      : [...DEFAULT_HOTELS],
    notes: normalizeStringList(values.notes),
    terms: normalizeStringList(values.terms),
    inclusions: normalizeStringList(values.inclusions).length > 0
      ? normalizeStringList(values.inclusions)
      : [...DEFAULT_INCLUSIONS],
    exclusions: normalizeStringList(values.exclusions).length > 0
      ? normalizeStringList(values.exclusions)
      : [...DEFAULT_EXCLUSIONS],
    date: parseDateInput(values.date),
    validUntil: parseDateInput(values.validUntil),
    trip: values.trip
      ? {
          ...values.trip,
          batchDates: Array.isArray(values.trip.batchDates)
            ? values.trip.batchDates.map(parseDateInput).filter(Boolean)
            : [],
          departureDate: parseDateInput(values.trip.departureDate),
          returnDate: parseDateInput(values.trip.returnDate),
        }
      : undefined,
    payment: values.payment
      ? {
          ...values.payment,
          balanceDueDate: parseDateInput(values.payment.balanceDueDate),
        }
      : undefined,
  };
}

// Helper to transform form values back to Quotation shape
export function transformFormValues(values: Record<string, unknown>): Partial<Quotation> {
  const formatDateValue = (val: dayjs.Dayjs | undefined): string => {
    return val && val.isValid() ? val.format('YYYY-MM-DD') : '';
  };

  const lineItems = Array.isArray(values.lineItems)
    ? (values.lineItems as LineItem[]).map((item) => ({
        ...item,
        qty: typeof item.qty === 'number' ? item.qty : item.qty ? parseFloat(String(item.qty)) || 1 : 1,
        mode: item.mode ?? 'and',
        orGroup: item.orGroup?.trim() ?? '',
        selected: item.mode === 'or' ? item.selected !== false : true,
      }))
    : [];

  const formatDateList = (input: unknown): string[] =>
    Array.isArray(input)
      ? input
          .map((value) => value as dayjs.Dayjs | undefined)
          .map(formatDateValue)
          .filter(Boolean)
      : [];

  const hotels = Array.isArray(values.hotels)
    ? (values.hotels as HotelStay[]).map((hotel) => ({
        ...hotel,
        nights:
          typeof hotel.nights === 'number'
            ? hotel.nights
            : hotel.nights
              ? parseFloat(String(hotel.nights)) || ''
              : '',
      }))
    : [];

  return {
    ...values,
    documentFontScale:
      typeof values.documentFontScale === 'number'
        ? values.documentFontScale
        : parseFloat(String(values.documentFontScale ?? '1')) || 1,
    date: formatDateValue(values.date as dayjs.Dayjs | undefined),
    validUntil: formatDateValue(values.validUntil as dayjs.Dayjs | undefined),
    customer: values.customer as Quotation['customer'],
    trip: values.trip
      ? {
          ...values.trip,
          batchDates: formatDateList((values.trip as Quotation['trip']).batchDates),
          departureDate: formatDateValue((values.trip as Quotation['trip']).departureDate as unknown as dayjs.Dayjs | undefined),
          returnDate: formatDateValue((values.trip as Quotation['trip']).returnDate as unknown as dayjs.Dayjs | undefined),
        } as Quotation['trip']
      : undefined,
    payment: values.payment
      ? {
          ...(values.payment as Record<string, unknown>),
          balanceDueDate: formatDateValue((values.payment as Record<string, unknown>).balanceDueDate as dayjs.Dayjs | undefined),
        } as Quotation['payment']
      : undefined,
    lineItems,
    hotels,
    itinerary: values.itinerary as ItineraryDay[],
    inclusions: normalizeStringList(values.inclusions),
    exclusions: normalizeStringList(values.exclusions),
    consultant: values.consultant as string,
    notes: normalizeStringList(values.notes),
    terms: normalizeStringList(values.terms),
  } as Partial<Quotation>;
}
