'use client';

import { Alert, Button, Card, Empty, Tag, Typography } from 'antd';
import type { FormInstance } from 'antd';
import { FileSearchOutlined } from '@ant-design/icons';
import type { InsuranceExtraction } from '@/features/insurance/parser';
import {
  formatDateTime,
  insuranceCaseStatusColors,
  statusLabel,
} from '@/features/insurance/presentation';
import type { AdminCase } from '../_types';
import { CaseDocuments } from './CaseDocuments';
import { ExtractionReview } from './ExtractionReview';
import { ParseJobs } from './ParseJobs';

const { Text } = Typography;

export function CaseDetail(props: {
  confirmingCaseId: string | null;
  parsingCaseId: string | null;
  reviewForm: FormInstance;
  selectedCase: AdminCase | null;
  selectedExtraction: InsuranceExtraction | null;
  isWorkflowActive?: boolean;
  onConfirm: () => void;
  onParse: () => void;
}) {
  const {
    confirmingCaseId,
    parsingCaseId,
    reviewForm,
    selectedCase,
    selectedExtraction,
    isWorkflowActive,
    onConfirm,
    onParse,
  } = props;

  return (
    <Card
      className="insurance-admin-detail-card"
      title={selectedCase ? selectedCase.customerName || 'Unnamed customer' : 'Case detail'}
      extra={
        selectedCase ? (
          <Button
            type="primary"
            icon={<FileSearchOutlined />}
            disabled={isWorkflowActive}
            loading={parsingCaseId === selectedCase.id}
            onClick={onParse}
          >
            {isWorkflowActive ? 'Parse running' : 'Queue parse'}
          </Button>
        ) : null
      }
    >
      {selectedCase ? (
        <div className="insurance-case-detail">
          <div className="insurance-case-detail__meta">
            <div>
              <Text type="secondary">Case ID</Text>
              <Text copyable>{selectedCase.id}</Text>
            </div>
            <div>
              <Text type="secondary">Status</Text>
              <Tag color={insuranceCaseStatusColors[selectedCase.status]}>
                {statusLabel(selectedCase.status)}
              </Tag>
            </div>
            <div>
              <Text type="secondary">Created</Text>
              <Text>{formatDateTime(selectedCase.createdAt)}</Text>
            </div>
            <div>
              <Text type="secondary">Audit events</Text>
              <Text>{selectedCase.auditEventCount}</Text>
            </div>
          </div>

          {selectedCase.notes ? (
            <Alert type="info" showIcon message="Notes" description={selectedCase.notes} />
          ) : null}

          {selectedCase.parseError ? (
            <Alert
              type="error"
              showIcon
              message="Last parse failed"
              description={selectedCase.parseError}
            />
          ) : null}

          <ParseJobs jobs={selectedCase.parseJobs} />
          <CaseDocuments documents={selectedCase.documents} />
          <ExtractionReview
            confirmingCaseId={confirmingCaseId}
            form={reviewForm}
            insuranceCase={selectedCase}
            selectedExtraction={selectedExtraction}
            onConfirm={onConfirm}
          />
        </div>
      ) : (
        <Empty description="Select a case" />
      )}
    </Card>
  );
}
