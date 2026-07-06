'use client';

import React from 'react';
import Link from 'next/link';
import { Button, Segmented, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  formatDateTime,
  insuranceParseJobStatusColors,
  statusLabel,
} from '@/features/insurance/presentation';
import type { AdminQueueItem } from '../_types';

const { Text } = Typography;

export function QueueTable(props: {
  isLoading: boolean;
  jobs: AdminQueueItem[];
  retryingJobId: string | null;
  onRetryJob: (job: AdminQueueItem) => void;
}) {
  const { isLoading, jobs, retryingJobId, onRetryJob } = props;
  const [groupBy, setGroupBy] = React.useState<'none' | 'status'>('none');
  const jobStatuses = Array.from(new Set(jobs.map((job) => job.status)));
  const columns: ColumnsType<AdminQueueItem> = [
    {
      title: 'Case',
      key: 'case',
      render: (_, job) => (
        <Space direction="vertical" size={0}>
          <Text strong>{job.case.customerName || 'Unnamed customer'}</Text>
          <Text type="secondary">{job.case.id.slice(0, 8)}</Text>
        </Space>
      ),
      sorter: (a, b) => (a.case.customerName || '').localeCompare(b.case.customerName || ''),
    },
    {
      title: 'Workflow status',
      dataIndex: 'status',
      filters: jobStatuses.map((status) => ({ text: statusLabel(status), value: status })),
      onFilter: (value, record) => record.status === value,
      render: (status: string) => (
        <Tag color={insuranceParseJobStatusColors[status]}>{statusLabel(status)}</Tag>
      ),
    },
    {
      title: 'Attempts',
      dataIndex: 'attempts',
      width: 100,
      sorter: (a, b) => a.attempts - b.attempts,
    },
    {
      title: 'Docs',
      dataIndex: ['case', 'documentCount'],
      width: 90,
      sorter: (a, b) => a.case.documentCount - b.case.documentCount,
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      render: (value: string) => formatDateTime(value),
    },
    {
      title: 'Error',
      dataIndex: 'error',
      ellipsis: true,
      render: (value?: string | null) => value || <Text type="secondary">-</Text>,
    },
    {
      title: '',
      key: 'action',
      width: 180,
      render: (_, job) => (
        <Space>
          <Link href={`/insurance/admin/cases/${job.case.id}`}>
            <Button size="small">Case</Button>
          </Link>
          {job.status === 'FAILED' ? (
            <Button
              size="small"
              disabled={Boolean(retryingJobId && retryingJobId !== job.id)}
              loading={retryingJobId === job.id}
              onClick={() => onRetryJob(job)}
            >
              Retry
            </Button>
          ) : null}
        </Space>
      ),
    },
  ];

  const renderTable = (dataSource: AdminQueueItem[]) => (
    <Table
      columns={columns}
      dataSource={dataSource}
      loading={isLoading}
      pagination={dataSource.length > 10 ? { pageSize: 10 } : false}
      rowKey="id"
      size="middle"
    />
  );

  const groupedJobs = jobStatuses.map((status) => ({
    status,
    jobs: jobs.filter((job) => job.status === status),
  }));

  return (
    <div className="insurance-table-panel">
      <div className="insurance-table-toolbar">
        <Text strong>Workflow runs</Text>
        <Segmented
          value={groupBy}
          onChange={setGroupBy}
          options={[
            { label: 'Table', value: 'none' },
            { label: 'Group by status', value: 'status' },
          ]}
        />
      </div>
      {groupBy === 'status' && jobs.length > 0
        ? groupedJobs.map((group) => (
            <div className="insurance-table-group" key={group.status}>
              <Text strong>
                {statusLabel(group.status)} ({group.jobs.length})
              </Text>
              {renderTable(group.jobs)}
            </div>
          ))
        : renderTable(jobs)}
    </div>
  );
}
