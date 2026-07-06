'use client';

import { Button, Card, Empty, Space, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { formatDateTime } from '@/features/insurance/presentation';
import type { AdminCaseListItem } from '../_types';

const { Text } = Typography;

export function SharedLinks(props: {
  cases: AdminCaseListItem[];
  isLoading: boolean;
}) {
  const { cases, isLoading } = props;
  const sharedCases = cases.filter((insuranceCase) => insuranceCase.shareEnabled);
  const columns: ColumnsType<AdminCaseListItem> = [
    {
      title: 'Case',
      dataIndex: 'customerName',
      render: (_, insuranceCase) => (
        <Space direction="vertical" size={0}>
          <Text strong>{insuranceCase.customerName || 'Unnamed customer'}</Text>
          <Text type="secondary">{insuranceCase.id.slice(0, 8)}</Text>
        </Space>
      ),
    },
    {
      title: 'Access',
      key: 'access',
      render: () => <Text type="secondary">Global settings</Text>,
    },
    {
      title: 'Updated',
      dataIndex: 'shareUpdatedAt',
      render: (value?: string | null) =>
        value ? formatDateTime(value) : <Text type="secondary">Not recorded</Text>,
      sorter: (a, b) =>
        new Date(a.shareUpdatedAt ?? 0).getTime() -
        new Date(b.shareUpdatedAt ?? 0).getTime(),
    },
    {
      title: '',
      key: 'actions',
      width: 120,
      render: (_, insuranceCase) => (
        <Button size="small" href={`/insurance/admin/cases/${insuranceCase.id}`}>
          Open case
        </Button>
      ),
    },
  ];

  return (
    <Card
      className="insurance-admin-list-card"
      title="Cases in shared view"
      extra={
        <Space>
          <Button href="/insurance/admin/share">Settings</Button>
          <Button href="/insurance/share" target="_blank" type="primary">
            Open single link
          </Button>
        </Space>
      }
    >
      <Table
        columns={columns}
        dataSource={sharedCases}
        loading={isLoading}
        locale={{
          emptyText: <Empty description="No cases added to the shared view yet" />,
        }}
        pagination={sharedCases.length > 5 ? { pageSize: 5 } : false}
        rowKey="id"
        size="middle"
      />
    </Card>
  );
}
