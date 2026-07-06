'use client';

import { Space, Tag, Typography } from 'antd';
import {
  formatDateTime,
  insuranceParseJobStatusColors,
  statusLabel,
} from '@/features/insurance/presentation';
import type { AdminParseJob } from '../_types';

const { Text } = Typography;

export function ParseJobs(props: { jobs: AdminParseJob[] }) {
  if (props.jobs.length === 0) {
    return null;
  }

  return (
    <div className="insurance-jobs-panel">
      <Text strong>Parse jobs</Text>
      <Space wrap>
        {props.jobs.map((job) => (
          <Tag key={job.id} color={insuranceParseJobStatusColors[job.status]}>
            {statusLabel(job.status)} · {formatDateTime(job.createdAt)}
          </Tag>
        ))}
      </Space>
    </div>
  );
}
