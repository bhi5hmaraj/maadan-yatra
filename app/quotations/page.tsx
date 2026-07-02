'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Popconfirm, Space, Table, Tag, Typography } from 'antd';
import { CopyOutlined, DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';
import { useDelete, useList } from '@refinedev/core';
import { localStorageDataProvider } from '@/providers/localStorageDataProvider';
import type { Quotation } from '@/types/quotation';
import { calculateTotal, formatAmountRaw, formatDate } from '@/utils/formatting';
import { createQuotationDuplicate } from '@/utils/quotation-duplication';

const { Paragraph, Title } = Typography;

const statusColors: Record<Quotation['status'], string> = {
  draft: 'default',
  sent: 'processing',
  confirmed: 'success',
  lost: 'error',
};

export default function QuotationsListPage() {
  const router = useRouter();
  const { data, isLoading } = useList<Quotation>({
    resource: 'quotations',
    sorters: [{ field: 'updatedAt', order: 'desc' }],
  });
  const { mutate: deleteQuotation, isLoading: deleting } = useDelete();
  const [duplicatingId, setDuplicatingId] = React.useState<string | null>(null);
  const quotations = data?.data ?? [];

  const handleDuplicate = async (quotation: Quotation) => {
    const existingNumbers = quotations.map((item) => item.number);
    const duplicate = createQuotationDuplicate(quotation, existingNumbers);

    setDuplicatingId(quotation.id);
    try {
      const result = await localStorageDataProvider.create<Quotation>({
        resource: 'quotations',
        variables: duplicate,
      });

      router.push(`/quotations/edit/${result.data.id}`);
    } finally {
      setDuplicatingId(null);
    }
  };

  return (
    <div className="app-shell-page">
      <div>
        <Title level={2}>Quotations</Title>
        <Paragraph type="secondary">
          Manage saved quotations, review their current status, and reopen any proposal for changes or PDF export.
        </Paragraph>
        <Link href="/quotations/create">
          <Button type="primary" icon={<PlusOutlined />}>
            Create quotation
          </Button>
        </Link>
      </div>

      <Table
        dataSource={quotations}
        loading={isLoading}
        rowKey="id"
        scroll={{ x: 960 }}
        pagination={{ pageSize: 10 }}
        columns={[
          {
            title: 'Quotation',
            dataIndex: 'number',
            key: 'number',
            render: (value: string, record: Quotation) => (
              <Space direction="vertical" size={2}>
                <Link href={`/quotations/${record.id}`}>{value}</Link>
                <span style={{ color: 'rgba(0,0,0,0.45)', fontSize: 12 }}>
                  {formatDate(record.date)}
                </span>
              </Space>
            ),
          },
          {
            title: 'Customer',
            key: 'customer',
            render: (_value: unknown, record: Quotation) => (
              <Space direction="vertical" size={2}>
                <span>{record.customer.name || 'Unnamed customer'}</span>
                <span style={{ color: 'rgba(0,0,0,0.45)', fontSize: 12 }}>
                  {record.customer.phone || record.customer.email || 'No contact added'}
                </span>
              </Space>
            ),
          },
          {
            title: 'Destination',
            key: 'destination',
            render: (_value: unknown, record: Quotation) => (
              <Space direction="vertical" size={2}>
                <span>{record.trip.destination || 'Pending destination'}</span>
                <span style={{ color: 'rgba(0,0,0,0.45)', fontSize: 12 }}>
                  {record.trip.packageType || 'Package type pending'}
                </span>
              </Space>
            ),
          },
          {
            title: 'Amount',
            key: 'amount',
            align: 'right',
            render: (_value: unknown, record: Quotation) => formatAmountRaw(calculateTotal(record.lineItems)),
          },
          {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (value: Quotation['status']) => (
              <Tag color={statusColors[value]}>{value.toUpperCase()}</Tag>
            ),
          },
          {
            title: 'Actions',
            key: 'actions',
            fixed: 'right',
            render: (_value: unknown, record: Quotation) => (
              <Space>
                <Link href={`/quotations/${record.id}`}>
                  <Button icon={<EyeOutlined />} />
                </Link>
                <Link href={`/quotations/edit/${record.id}`}>
                  <Button icon={<EditOutlined />} />
                </Link>
                <Button
                  icon={<CopyOutlined />}
                  loading={duplicatingId === record.id}
                  onClick={() => void handleDuplicate(record)}
                />
                <Popconfirm
                  title="Delete quotation?"
                  description="This removes the saved quotation from local storage."
                  onConfirm={() =>
                    deleteQuotation({
                      resource: 'quotations',
                      id: record.id,
                    })
                  }
                  okButtonProps={{ loading: deleting }}
                >
                  <Button danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />
    </div>
  );
}
