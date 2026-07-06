'use client';

import { Alert, Button, Card, Space, Spin, Typography, message } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { AdminHeader } from '../_components/AdminHeader';
import { QueueTable } from '../_components/QueueTable';
import { useInsuranceQueue } from '../_hooks/useInsuranceQueue';

const { Text, Title } = Typography;

export default function InsuranceQueuePage() {
  const [messageApi, contextHolder] = message.useMessage();
  const queue = useInsuranceQueue(messageApi);

  return (
    <div className="insurance-admin-page">
      {contextHolder}
      <main className="insurance-admin-page__main">
        <AdminHeader title="Workflow" isLoading={queue.isLoading} onRefresh={() => queue.loadJobs()} />

        <header className="insurance-queue-header">
          <div>
            <Text type="secondary">Workflow</Text>
            <Title level={3}>Workflow Runs</Title>
            {queue.hasActiveJobs ? (
              <Text type="secondary">
                <Spin size="small" /> Live refresh while jobs are queued or running
              </Text>
            ) : null}
          </div>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => queue.loadJobs()} loading={queue.isLoading}>
              Refresh
            </Button>
          </Space>
        </header>

        {queue.error ? (
          <Alert type="error" showIcon message="Could not load queue" description={queue.error} />
        ) : null}

        <Card className="insurance-admin-detail-card">
          <QueueTable
            isLoading={queue.isLoading}
            jobs={queue.jobs}
            retryingJobId={queue.retryingJobId}
            onRetryJob={queue.retryJob}
          />
        </Card>
      </main>
    </div>
  );
}
