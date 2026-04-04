'use client';

import React from 'react';
import {
  Form,
  Input,
  DatePicker,
  InputNumber,
  Checkbox,
  Button,
  Select,
  Row,
  Col,
  Card,
} from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd/es/form';
import type { Quotation, LineItem, ItineraryDay } from '@/types/quotation';
import { DEFAULT_INCLUSIONS } from '@/types/quotation';
import dayjs from 'dayjs';

const { TextArea } = Input;

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
  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={prepareQuotationFormValues(initialValues)}
      onValuesChange={onValuesChange}
      size="small"
    >
      {/* Quotation Details */}
      <Card
        size="small"
        title={<span style={{ color: '#C4622D', fontSize: '12px', letterSpacing: '0.1em' }}>QUOTATION</span>}
        style={{ marginBottom: 16 }}
      >
        <Row gutter={12}>
          <Col span={12}>
            <Form.Item label="Number" name="number" rules={[{ required: true }]}>
              <Input placeholder="QT-2025-001" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Date" name="date" rules={[{ required: true }]}>
              <DatePicker style={{ width: '100%' }} format="DD MMM YYYY" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item label="Valid until" name="validUntil" rules={[{ required: true }]}>
          <DatePicker style={{ width: '100%' }} format="DD MMM YYYY" />
        </Form.Item>
        <Form.Item label="Status" name="status" rules={[{ required: true }]}>
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

      {/* Customer */}
      <Card
        size="small"
        title={<span style={{ color: '#C4622D', fontSize: '12px', letterSpacing: '0.1em' }}>CUSTOMER</span>}
        style={{ marginBottom: 16 }}
      >
        <Form.Item label="Full name" name={['customer', 'name']} rules={[{ required: true }]}>
          <Input placeholder="As on passport" />
        </Form.Item>
        <Row gutter={12}>
          <Col span={12}>
            <Form.Item label="Email" name={['customer', 'email']}>
              <Input type="email" placeholder="email@example.com" />
            </Form.Item>
          </Col>
          <Col span={12}>
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
        style={{ marginBottom: 16 }}
      >
        <Form.Item label="Destination" name={['trip', 'destination']} rules={[{ required: true }]}>
          <Input placeholder="e.g. Santorini, Greece" />
        </Form.Item>
        <Row gutter={12}>
          <Col span={12}>
            <Form.Item label="Departure" name={['trip', 'departureDate']}>
              <DatePicker style={{ width: '100%' }} format="DD MMM YYYY" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Return" name={['trip', 'returnDate']}>
              <DatePicker style={{ width: '100%' }} format="DD MMM YYYY" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={12}>
          <Col span={8}>
            <Form.Item label="Adults" name={['trip', 'adults']}>
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Children" name={['trip', 'children']}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Nights" name={['trip', 'nights']}>
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item label="Package type" name={['trip', 'packageType']}>
          <Input placeholder="e.g. Luxury Honeymoon" />
        </Form.Item>
        <Form.Item label="Consultant name" name="consultant">
          <Input placeholder="Your name" />
        </Form.Item>
      </Card>

      {/* Pricing */}
      <Card
        size="small"
        title={<span style={{ color: '#C4622D', fontSize: '12px', letterSpacing: '0.1em' }}>PRICING</span>}
        style={{ marginBottom: 16 }}
      >
        <div style={{ marginBottom: 8, display: 'grid', gridTemplateColumns: '1fr 100px 80px 32px', gap: 8 }}>
          <span style={{ fontSize: 11, color: '#7A6E60', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Component</span>
          <span style={{ fontSize: 11, color: '#7A6E60', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Details</span>
          <span style={{ fontSize: 11, color: '#7A6E60', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'right' }}>Amount</span>
          <span></span>
        </div>
        <Form.List name="lineItems">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <div
                  key={key}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 100px 80px 32px',
                    gap: 8,
                    marginBottom: 8,
                    alignItems: 'start',
                  }}
                >
                  <Form.Item {...restField} name={[name, 'desc']} style={{ marginBottom: 0 }}>
                    <Input placeholder="Component" size="small" />
                  </Form.Item>
                  <Form.Item {...restField} name={[name, 'detail']} style={{ marginBottom: 0 }}>
                    <Input placeholder="Details" size="small" />
                  </Form.Item>
                  <Form.Item {...restField} name={[name, 'amt']} style={{ marginBottom: 0 }}>
                    <InputNumber
                      placeholder="0"
                      min={0}
                      style={{ width: '100%', textAlign: 'right' }}
                      size="small"
                    />
                  </Form.Item>
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => remove(name)}
                    style={{ marginTop: 2 }}
                  />
                </div>
              ))}
              <Button
                type="dashed"
                onClick={() => add({ desc: '', detail: '', amt: '' })}
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
        title={<span style={{ color: '#C4622D', fontSize: '12px', letterSpacing: '0.1em' }}>INCLUSIONS</span>}
        style={{ marginBottom: 16 }}
      >
        <Form.Item name="inclusions">
          <Checkbox.Group style={{ width: '100%' }}>
            <Row gutter={[8, 8]}>
              {DEFAULT_INCLUSIONS.map((item) => (
                <Col span={12} key={item}>
                  <Checkbox value={item} style={{ fontSize: 13 }}>
                    {item}
                  </Checkbox>
                </Col>
              ))}
            </Row>
          </Checkbox.Group>
        </Form.Item>
        <Form.Item label="Not included (comma separated)" name="exclusions" style={{ marginBottom: 0 }}>
          <Input placeholder="Visa fees, personal meals, tips" />
        </Form.Item>
      </Card>

      {/* Itinerary */}
      <Card
        size="small"
        title={<span style={{ color: '#C4622D', fontSize: '12px', letterSpacing: '0.1em' }}>ITINERARY</span>}
        style={{ marginBottom: 16 }}
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

      {/* Payment */}
      <Card
        size="small"
        title={<span style={{ color: '#C4622D', fontSize: '12px', letterSpacing: '0.1em' }}>PAYMENT</span>}
        style={{ marginBottom: 16 }}
      >
        <Row gutter={12}>
          <Col span={12}>
            <Form.Item label="Non-refundable amount (₹)" name={['payment', 'nonRefundable']}>
              <InputNumber min={0} placeholder="e.g. 20000" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Balance due date" name={['payment', 'balanceDueDate']}>
              <DatePicker style={{ width: '100%' }} format="DD MMM YYYY" />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* Notes */}
      <Card
        size="small"
        title={<span style={{ color: '#C4622D', fontSize: '12px', letterSpacing: '0.1em' }}>SPECIAL NOTES</span>}
        style={{ marginBottom: 16 }}
      >
        <Form.Item name="notes" style={{ marginBottom: 0 }}>
          <TextArea rows={3} placeholder="Visa timeline, flight notes, special requests..." />
        </Form.Item>
      </Card>
    </Form>
  );
}

export function prepareQuotationFormValues(values?: Partial<Quotation>) {
  if (!values) return undefined;

  return {
    ...values,
    date: values.date ? dayjs(values.date) : undefined,
    validUntil: values.validUntil ? dayjs(values.validUntil) : undefined,
    trip: values.trip
      ? {
          ...values.trip,
          departureDate: values.trip.departureDate
            ? dayjs(values.trip.departureDate)
            : undefined,
          returnDate: values.trip.returnDate
            ? dayjs(values.trip.returnDate)
            : undefined,
        }
      : undefined,
    payment: values.payment
      ? {
          ...values.payment,
          balanceDueDate: values.payment.balanceDueDate
            ? dayjs(values.payment.balanceDueDate)
            : undefined,
        }
      : undefined,
  };
}

// Helper to transform form values back to Quotation shape
export function transformFormValues(values: Record<string, unknown>): Partial<Quotation> {
  const formatDateValue = (val: dayjs.Dayjs | undefined): string => {
    return val ? val.format('YYYY-MM-DD') : '';
  };

  return {
    ...values,
    date: formatDateValue(values.date as dayjs.Dayjs | undefined),
    validUntil: formatDateValue(values.validUntil as dayjs.Dayjs | undefined),
    customer: values.customer as Quotation['customer'],
    trip: values.trip
      ? {
          ...(values.trip as Record<string, unknown>),
          departureDate: formatDateValue((values.trip as Record<string, unknown>).departureDate as dayjs.Dayjs | undefined),
          returnDate: formatDateValue((values.trip as Record<string, unknown>).returnDate as dayjs.Dayjs | undefined),
        } as Quotation['trip']
      : undefined,
    payment: values.payment
      ? {
          ...(values.payment as Record<string, unknown>),
          balanceDueDate: formatDateValue((values.payment as Record<string, unknown>).balanceDueDate as dayjs.Dayjs | undefined),
        } as Quotation['payment']
      : undefined,
    lineItems: values.lineItems as LineItem[],
    itinerary: values.itinerary as ItineraryDay[],
    inclusions: values.inclusions as string[],
    exclusions: values.exclusions as string,
    consultant: values.consultant as string,
    notes: values.notes as string,
  } as Partial<Quotation>;
}
