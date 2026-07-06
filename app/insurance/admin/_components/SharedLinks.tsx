'use client';

import Link from 'next/link';
import { Button, Card, Empty, Space, Table, Tag, Typography } from 'antd';
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
      title: 'Allowed emails',
      dataIndex: 'shareAllowedEmails',
      render: (emails: string[]) =>
        emails.length ? (
          <Space size={[4, 4]} wrap>
            {emails.map((email) => (
              <Tag key={email}>{email}</Tag>
            ))}
          </Space>
        ) : (
          <Text type="secondary">None</Text>
        ),
    },
    {
      title: 'Fields',
      dataIndex: 'shareFieldPaths',
      width: 90,
      render: (fields: string[]) => fields.length,
      sorter: (a, b) => a.shareFieldPaths.length - b.shareFieldPaths.length,
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
      width: 220,
      render: (_, insuranceCase) => (
        <Space>
          <Link href={`/insurance/share?caseId=${insuranceCase.id}`} target="_blank">
            <Button size="small">Open link</Button>
          </Link>
          <Link href={`/insurance/admin/cases/${insuranceCase.id}`}>
            <Button size="small">Settings</Button>
          </Link>
        </Space>
      ),
    },
  ];

  return (
    <Card className="insurance-admin-list-card" title="Shared links">
      <Table
        columns={columns}
        dataSource={sharedCases}
        loading={isLoading}
        locale={{
          emptyText: <Empty description="No shared links yet" />,
        }}
        pagination={sharedCases.length > 5 ? { pageSize: 5 } : false}
        rowKey="id"
        size="middle"
      />
    </Card>
  );
}
