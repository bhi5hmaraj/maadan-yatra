'use client';

import React from 'react';
import Link from 'next/link';
import { Button, Card, Segmented, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  formatDateTime,
  insuranceCaseStatusColors,
  insuranceParseJobStatusColors,
  statusLabel,
} from '@/features/insurance/presentation';
import type { AdminCaseListItem } from '../_types';

const { Text } = Typography;

export function CaseList(props: {
  cases: AdminCaseListItem[];
  isLoading: boolean;
  sharingCaseId: string | null;
  onToggleShare: (insuranceCase: AdminCaseListItem) => void;
}) {
  const { cases, isLoading, sharingCaseId, onToggleShare } = props;
  const [groupBy, setGroupBy] = React.useState<'none' | 'status'>('none');
  const caseStatuses = Array.from(new Set(cases.map((insuranceCase) => insuranceCase.status)));
  const jobStatuses = Array.from(
    new Set(cases.map((insuranceCase) => insuranceCase.latestParseJob?.status).filter(Boolean))
  ) as string[];
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
      sorter: (a, b) => (a.customerName || '').localeCompare(b.customerName || ''),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      filters: caseStatuses.map((status) => ({ text: statusLabel(status), value: status })),
      onFilter: (value, record) => record.status === value,
      render: (status: string) => (
        <Tag color={insuranceCaseStatusColors[status]}>{statusLabel(status)}</Tag>
      ),
    },
    {
      title: 'Workflow',
      dataIndex: ['latestParseJob', 'status'],
      filters: jobStatuses.map((status) => ({ text: statusLabel(status), value: status })),
      onFilter: (value, record) => record.latestParseJob?.status === value,
      render: (_, insuranceCase) =>
        insuranceCase.latestParseJob ? (
          <Tag color={insuranceParseJobStatusColors[insuranceCase.latestParseJob.status]}>
            {statusLabel(insuranceCase.latestParseJob.status)}
          </Tag>
        ) : (
          <Text type="secondary">No job</Text>
        ),
    },
    {
      title: 'Docs',
      dataIndex: 'documentCount',
      width: 90,
      sorter: (a, b) => a.documentCount - b.documentCount,
    },
    {
      title: 'Updated',
      dataIndex: 'updatedAt',
      sorter: (a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
      render: (value: string) => formatDateTime(value),
    },
    {
      title: 'Shared',
      dataIndex: 'shareEnabled',
      width: 120,
      filters: [
        { text: 'Shared', value: true },
        { text: 'Not shared', value: false },
      ],
      onFilter: (value, record) => record.shareEnabled === value,
      render: (isShared: boolean, insuranceCase) => (
        <Space direction="vertical" size={0}>
          <Tag color={isShared ? 'green' : 'default'}>
            {isShared ? 'Shared' : 'Not shared'}
          </Tag>
          {isShared && insuranceCase.shareUpdatedAt ? (
            <Text type="secondary">{formatDateTime(insuranceCase.shareUpdatedAt)}</Text>
          ) : null}
        </Space>
      ),
    },
    {
      title: '',
      key: 'action',
      width: 220,
      render: (_, insuranceCase) => (
        <Space>
          <Button
            size="small"
            loading={sharingCaseId === insuranceCase.id}
            disabled={!insuranceCase.confirmedAt}
            onClick={() => onToggleShare(insuranceCase)}
          >
            {insuranceCase.shareEnabled ? 'Unshare' : 'Share'}
          </Button>
          <Link href={`/insurance/admin/cases/${insuranceCase.id}`}>
            <Button size="small">Open</Button>
          </Link>
        </Space>
      ),
    },
  ];

  const renderTable = (dataSource: AdminCaseListItem[]) => (
    <Table
      columns={columns}
      dataSource={dataSource}
      loading={isLoading}
      pagination={dataSource.length > 10 ? { pageSize: 10 } : false}
      rowKey="id"
      size="middle"
    />
  );

  const groupedCases = caseStatuses.map((status) => ({
    status,
    cases: cases.filter((insuranceCase) => insuranceCase.status === status),
  }));

  return (
    <Card
      className="insurance-admin-list-card"
      title="Cases"
      extra={
        <Segmented
          value={groupBy}
          onChange={setGroupBy}
          options={[
            { label: 'Table', value: 'none' },
            { label: 'Group by status', value: 'status' },
          ]}
        />
      }
    >
      {groupBy === 'status' && cases.length > 0
        ? groupedCases.map((group) => (
            <div className="insurance-table-group" key={group.status}>
              <Text strong>
                {statusLabel(group.status)} ({group.cases.length})
              </Text>
              {renderTable(group.cases)}
            </div>
          ))
        : renderTable(cases)}
    </Card>
  );
}
