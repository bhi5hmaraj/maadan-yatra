'use client';

import React from 'react';
import Link from 'next/link';
import {
  Alert,
  Button,
  Card,
  Divider,
  Empty,
  Form,
  Input,
  InputNumber,
  List,
  Skeleton,
  Space,
  Statistic,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  CloudDownloadOutlined,
  FileProtectOutlined,
  FileSearchOutlined,
  ReloadOutlined,
  SaveOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import type { InsuranceDocumentType } from '@/features/insurance/domain';
import {
  insuranceExtractionFormGroups,
  insuranceExtractionFromFormValues,
  insuranceExtractionToFormValues,
  type InsuranceExtraction,
} from '@/features/insurance/parser';
import { getClientTraceId, logClientEvent } from '@/lib/logging/client';

const { Text, Title } = Typography;

interface AdminDocument {
  id: string;
  type: InsuranceDocumentType;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  downloadUrl?: string | null;
  blobPathname: string;
  createdAt: string;
}

interface AdminCase {
  id: string;
  status: string;
  customerName?: string | null;
  notes?: string | null;
  aiExtraction?: InsuranceExtraction | null;
  confirmedExtraction?: InsuranceExtraction | null;
  parseError?: string | null;
  parsedAt?: string | null;
  confirmedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  documentCount: number;
  auditEventCount: number;
  parseJobs: AdminParseJob[];
  documents: AdminDocument[];
}

interface AdminParseJob {
  id: string;
  status: string;
  attempts: number;
  error?: string | null;
  createdAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
}

const documentLabels: Record<InsuranceDocumentType, string> = {
  AADHAAR_FRONT: 'Aadhaar front',
  AADHAAR_BACK: 'Aadhaar back',
  PURCHASE_SLIP: 'Purchase slip',
  OTHER: 'Other',
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function InsuranceAdminPage() {
  const [messageApi, contextHolder] = message.useMessage();
  const [reviewForm] = Form.useForm();
  const [cases, setCases] = React.useState<AdminCase[]>([]);
  const [selectedCaseId, setSelectedCaseId] = React.useState<string | null>(null);
  const [parseResults, setParseResults] = React.useState<Record<string, InsuranceExtraction>>({});
  const [parsingCaseId, setParsingCaseId] = React.useState<string | null>(null);
  const [confirmingCaseId, setConfirmingCaseId] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const selectedCase =
    cases.find((insuranceCase) => insuranceCase.id === selectedCaseId) ?? cases[0] ?? null;

  const loadCases = React.useCallback(async () => {
    const traceId = getClientTraceId();
    setIsLoading(true);
    setError(null);
    logClientEvent('insurance_admin_cases_load_started', { traceId });

    try {
      const response = await fetch('/api/insurance/cases', {
        headers: {
          'x-trace-id': traceId,
        },
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to load insurance cases.');
      }

      setCases(payload.cases ?? []);
      setSelectedCaseId((currentId) => currentId ?? payload.cases?.[0]?.id ?? null);
      logClientEvent('insurance_admin_cases_load_completed', {
        traceId,
        caseCount: payload.cases?.length ?? 0,
      });
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : 'Failed to load insurance cases.';
      setError(message);
      messageApi.error(message);
      logClientEvent(
        'insurance_admin_cases_load_failed',
        {
          traceId,
          error: message,
        },
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  }, [messageApi]);

  React.useEffect(() => {
    logClientEvent('insurance_admin_page_viewed');
    void loadCases();
  }, [loadCases]);

  const selectedExtraction = selectedCase
    ? selectedCase.confirmedExtraction ??
      parseResults[selectedCase.id] ??
      selectedCase.aiExtraction ??
      null
    : null;

  React.useEffect(() => {
    reviewForm.setFieldsValue(insuranceExtractionToFormValues(selectedExtraction));
  }, [reviewForm, selectedCase?.id, selectedExtraction]);

  const parseSelectedCase = async () => {
    if (!selectedCase) return;

    const traceId = getClientTraceId();
    setParsingCaseId(selectedCase.id);
    logClientEvent('insurance_admin_parse_started', {
      traceId,
      caseId: selectedCase.id,
      documentCount: selectedCase.documentCount,
    });

    try {
      const response = await fetch(`/api/insurance/cases/${selectedCase.id}/parse`, {
        method: 'POST',
        headers: {
          'x-trace-id': traceId,
        },
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to parse insurance case.');
      }

      const processResponse = await fetch('/api/insurance/parse-jobs/process', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-trace-id': traceId,
        },
        body: JSON.stringify({
          jobId: payload.job?.id,
        }),
      });
      const processPayload = await processResponse.json();

      if (!processResponse.ok) {
        throw new Error(processPayload.error ?? 'Failed to process parse job.');
      }

      if (processPayload.extraction) {
        setParseResults((results) => ({
          ...results,
          [selectedCase.id]: processPayload.extraction,
        }));
      }

      await loadCases();
      messageApi.success('Parsed case. Review the extracted fields.');
      logClientEvent('insurance_admin_parse_completed', {
        traceId,
        caseId: selectedCase.id,
        jobId: payload.job?.id,
        missingFieldCount: processPayload.extraction?.missingFields?.length ?? 0,
      });
    } catch (parseError) {
      const message =
        parseError instanceof Error ? parseError.message : 'Failed to parse insurance case.';
      messageApi.error(message);
      logClientEvent(
        'insurance_admin_parse_failed',
        {
          traceId,
          caseId: selectedCase.id,
          error: message,
        },
        'error'
      );
    } finally {
      setParsingCaseId(null);
    }
  };

  const confirmSelectedCase = async () => {
    if (!selectedCase) return;

    const traceId = getClientTraceId();
    setConfirmingCaseId(selectedCase.id);

    try {
      const values = await reviewForm.validateFields();
      const extraction = insuranceExtractionFromFormValues(values, selectedExtraction);
      const response = await fetch(`/api/insurance/cases/${selectedCase.id}/review`, {
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
          'x-trace-id': traceId,
        },
        body: JSON.stringify({
          extraction,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to confirm insurance case.');
      }

      await loadCases();
      messageApi.success('Confirmed case.');
      logClientEvent('insurance_admin_review_confirmed', {
        traceId,
        caseId: selectedCase.id,
      });
    } catch (confirmError) {
      const message =
        confirmError instanceof Error ? confirmError.message : 'Failed to confirm insurance case.';
      messageApi.error(message);
      logClientEvent(
        'insurance_admin_review_confirm_failed',
        {
          traceId,
          caseId: selectedCase.id,
          error: message,
        },
        'error'
      );
    } finally {
      setConfirmingCaseId(null);
    }
  };

  return (
    <div className="insurance-admin-page">
      {contextHolder}
      <main className="insurance-admin-page__main">
        <header className="insurance-admin-header">
          <div>
            <Text type="secondary">Insurance ops</Text>
            <Title level={2}>Admin Queue</Title>
          </div>
          <Space>
            <Link href="/insurance/upload">
              <Button icon={<UploadOutlined />}>Upload</Button>
            </Link>
            <Button icon={<ReloadOutlined />} onClick={loadCases} loading={isLoading}>
              Refresh
            </Button>
          </Space>
        </header>

        {error ? (
          <Alert type="error" showIcon message="Could not load cases" description={error} />
        ) : null}

        <section className="insurance-admin-stats">
          <Card>
            <Statistic title="Cases" value={cases.length} />
          </Card>
          <Card>
            <Statistic
              title="Documents"
              value={cases.reduce((sum, insuranceCase) => sum + insuranceCase.documentCount, 0)}
            />
          </Card>
          <Card>
            <Statistic
              title="Uploaded"
              value={cases.filter((insuranceCase) => insuranceCase.status === 'UPLOADED').length}
            />
          </Card>
        </section>

        <section className="insurance-admin-grid">
          <Card className="insurance-admin-list-card" title="Cases">
            {isLoading ? (
              <Skeleton active paragraph={{ rows: 8 }} />
            ) : cases.length === 0 ? (
              <Empty description="No insurance cases yet" />
            ) : (
              <List
                dataSource={cases}
                renderItem={(insuranceCase) => (
                  <button
                    className={
                      insuranceCase.id === selectedCase?.id
                        ? 'insurance-case-row insurance-case-row--selected'
                        : 'insurance-case-row'
                    }
                    type="button"
                    onClick={() => {
                      setSelectedCaseId(insuranceCase.id);
                      logClientEvent('insurance_admin_case_selected', {
                        caseId: insuranceCase.id,
                        documentCount: insuranceCase.documentCount,
                      });
                    }}
                  >
                    <span>
                      <strong>{insuranceCase.customerName || 'Unnamed customer'}</strong>
                      <Text type="secondary">{formatDateTime(insuranceCase.updatedAt)}</Text>
                    </span>
                    <span>
                      <Tag>{insuranceCase.status}</Tag>
                      <Text type="secondary">{insuranceCase.documentCount} docs</Text>
                    </span>
                  </button>
                )}
              />
            )}
          </Card>

          <Card
            className="insurance-admin-detail-card"
            title={selectedCase ? selectedCase.customerName || 'Unnamed customer' : 'Case detail'}
            extra={
              selectedCase ? (
                <Button
                  type="primary"
                  icon={<FileSearchOutlined />}
                  loading={parsingCaseId === selectedCase.id}
                  onClick={parseSelectedCase}
                >
                  Parse
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
                    <Tag>{selectedCase.status}</Tag>
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

                {selectedCase.parseJobs.length > 0 ? (
                  <div className="insurance-jobs-panel">
                    <Text strong>Parse jobs</Text>
                    <Space wrap>
                      {selectedCase.parseJobs.map((job) => (
                        <Tag key={job.id} color={job.status === 'FAILED' ? 'red' : undefined}>
                          {job.status} · {formatDateTime(job.createdAt)}
                        </Tag>
                      ))}
                    </Space>
                  </div>
                ) : null}

                <div className="insurance-documents-panel">
                  <Text strong>Documents</Text>
                  <div className="insurance-admin-documents">
                    {selectedCase.documents.map((document) => (
                      <div className="insurance-admin-document" key={document.id}>
                        <div className="insurance-admin-document__icon">
                          <FileProtectOutlined />
                        </div>
                        <div className="insurance-admin-document__body">
                          <div>
                            <Text strong>{documentLabels[document.type]}</Text>
                            <Text type="secondary">{document.fileName}</Text>
                          </div>
                          <Text type="secondary">
                            {document.mimeType} · {formatBytes(document.sizeBytes)} ·{' '}
                            {formatDateTime(document.createdAt)}
                          </Text>
                          <Text type="secondary" className="insurance-admin-document__path">
                            {document.blobPathname}
                          </Text>
                        </div>
                        {document.downloadUrl ? (
                          <a href={document.downloadUrl} target="_blank" rel="noreferrer">
                            <Button icon={<CloudDownloadOutlined />}>Open</Button>
                          </a>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="insurance-extraction-panel">
                  <div className="insurance-extraction-panel__header">
                    <div>
                      <Text strong>Review extracted content</Text>
                      <Text type="secondary">
                        {selectedCase.confirmedAt
                          ? `Confirmed ${formatDateTime(selectedCase.confirmedAt)}`
                          : selectedCase.parsedAt
                            ? `Parsed ${formatDateTime(selectedCase.parsedAt)}`
                            : 'Run parse to prefill these fields'}
                      </Text>
                    </div>
                    <Button
                      type="primary"
                      icon={<SaveOutlined />}
                      disabled={!selectedExtraction}
                      loading={confirmingCaseId === selectedCase.id}
                      onClick={confirmSelectedCase}
                    >
                      Confirm
                    </Button>
                  </div>

                  {!selectedExtraction ? (
                    <Alert
                      type="info"
                      showIcon
                      message="No parsed data yet"
                      description="Queue parsing first, then review and confirm the extracted values."
                    />
                  ) : null}

                  <Form
                    form={reviewForm}
                    layout="vertical"
                    disabled={!selectedExtraction || confirmingCaseId === selectedCase.id}
                  >
                    {insuranceExtractionFormGroups.map((group) => (
                      <React.Fragment key={group.key}>
                        <Divider orientation="left">{group.label}</Divider>
                        <div className="insurance-review-grid">
                          {group.fields.map(([key, label, inputType]) => (
                            <Form.Item key={key} name={[group.key, key]} label={label}>
                              {inputType === 'number' ? (
                                <InputNumber min={0} style={{ width: '100%' }} />
                              ) : (
                                <Input />
                              )}
                            </Form.Item>
                          ))}
                        </div>
                      </React.Fragment>
                    ))}

                    <Form.Item name="missingFieldsText" label="Missing fields">
                      <Input />
                    </Form.Item>
                    <Form.Item name="notes" label="Notes">
                      <Input.TextArea rows={3} />
                    </Form.Item>
                  </Form>
                </div>
              </div>
            ) : (
              <Empty description="Select a case" />
            )}
          </Card>
        </section>
      </main>
    </div>
  );
}
