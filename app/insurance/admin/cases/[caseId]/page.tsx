'use client';

import React from 'react';
import Link from 'next/link';
import { Alert, Button, Card, Form, Skeleton, Spin, Timeline, Typography, message } from 'antd';
import { AdminHeader } from '../../_components/AdminHeader';
import { CaseDetail } from '../../_components/CaseDetail';
import { useCaseDetail } from '../../_hooks/useCaseDetail';
import { formatDateTime } from '@/features/insurance/presentation';

const { Text } = Typography;

export default function InsuranceAdminCasePage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = React.use(params);
  const [messageApi, contextHolder] = message.useMessage();
  const [reviewForm] = Form.useForm();
  const detail = useCaseDetail({
    caseId,
    messageApi,
    reviewForm,
  });

  return (
    <div className="insurance-admin-page">
      {contextHolder}
      <main className="insurance-admin-page__main">
        <AdminHeader title="Case detail" isLoading={detail.isLoading} onRefresh={() => detail.loadCase()} />

        {detail.hasActiveWorkflow ? (
          <Alert
            type="info"
            showIcon
            icon={<Spin size="small" />}
            message="Workflow is active"
            description="This case is being refreshed from the database while parsing is queued or running."
          />
        ) : null}

        {detail.error ? (
          <Alert type="error" showIcon message="Could not load case" description={detail.error} />
        ) : null}

        <div className="insurance-case-page-actions">
          <Link href="/insurance/admin">
            <Button>Back to cases</Button>
          </Link>
          <Link href="/insurance/admin/queue">
            <Button>Open queue</Button>
          </Link>
        </div>

        {detail.isLoading && !detail.insuranceCase ? (
          <Card>
            <Skeleton active paragraph={{ rows: 10 }} />
          </Card>
        ) : (
          <section className="insurance-case-detail-grid">
            <CaseDetail
              confirmingCaseId={detail.confirmingCaseId}
              parsingCaseId={detail.parsingCaseId}
              reviewForm={reviewForm}
              selectedCase={detail.insuranceCase}
              selectedExtraction={detail.selectedExtraction}
              isWorkflowActive={detail.hasActiveWorkflow}
              onConfirm={detail.confirmCase}
              onParse={detail.enqueueParse}
            />
            <Card title="Edit history" className="insurance-history-card">
              {detail.insuranceCase?.auditEvents.length ? (
                <Timeline
                  items={detail.insuranceCase.auditEvents.map((event) => ({
                    children: (
                      <div className="insurance-history-event">
                        <Text strong>{event.action}</Text>
                        <Text type="secondary">
                          {event.actorType} · {formatDateTime(event.createdAt)}
                        </Text>
                        {event.actorUserId ? (
                          <Text type="secondary">{event.actorUserId}</Text>
                        ) : null}
                      </div>
                    ),
                  }))}
                />
              ) : (
                <Text type="secondary">No history yet.</Text>
              )}
            </Card>
          </section>
        )}
      </main>
    </div>
  );
}
