'use client';

import React from 'react';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Empty,
  Input,
  Skeleton,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { AdminHeader } from '../_components/AdminHeader';
import {
  defaultInsuranceShareFieldPaths,
  insuranceShareFieldCatalog,
} from '@/features/insurance/share-view';
import { formatDateTime, statusLabel } from '@/features/insurance/presentation';
import { getClientTraceId, logClientEvent } from '@/lib/logging/client';

const { Text } = Typography;

interface ShareSettings {
  enabled: boolean;
  allowedEmails: string[];
  fieldPaths: string[];
  expiresAt: string | null;
  updatedAt?: string | null;
}

interface SharePreviewRow {
  path: string;
  groupLabel: string;
  label: string;
  value: string | null;
}

interface SharePreviewCase {
  id: string;
  customerName?: string | null;
  status: string;
  confirmedAt?: string | null;
  updatedAt: string;
  rows: SharePreviewRow[];
}

function emailsToText(emails: string[]) {
  return emails.join('\n');
}

function textToEmails(value: string) {
  return Array.from(
    new Set(
      value
        .split(/[\n,]/)
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean)
    )
  );
}

function isoToDatetimeLocal(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function datetimeLocalToIso(value: string) {
  return value ? new Date(value).toISOString() : null;
}

export default function InsuranceShareSettingsPage() {
  const [messageApi, contextHolder] = message.useMessage();
  const [settings, setSettings] = React.useState<ShareSettings | null>(null);
  const [previewCases, setPreviewCases] = React.useState<SharePreviewCase[]>([]);
  const [enabled, setEnabled] = React.useState(false);
  const [emails, setEmails] = React.useState('');
  const [fieldPaths, setFieldPaths] = React.useState<string[]>(defaultInsuranceShareFieldPaths);
  const [expiresAt, setExpiresAt] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadSettings = React.useCallback(async () => {
    const traceId = getClientTraceId();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/insurance/share-settings', {
        headers: { 'x-trace-id': traceId },
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to load share settings.');
      }

      const nextSettings = payload.settings as ShareSettings;
      setSettings(nextSettings);
      setPreviewCases(payload.preview?.sharedCases ?? []);
      setEnabled(nextSettings.enabled);
      setEmails(emailsToText(nextSettings.allowedEmails));
      setFieldPaths(
        nextSettings.fieldPaths.length
          ? nextSettings.fieldPaths
          : defaultInsuranceShareFieldPaths
      );
      setExpiresAt(isoToDatetimeLocal(nextSettings.expiresAt));
    } catch (loadError) {
      const messageText =
        loadError instanceof Error ? loadError.message : 'Failed to load share settings.';
      setError(messageText);
      messageApi.error(messageText);
    } finally {
      setIsLoading(false);
    }
  }, [messageApi]);

  React.useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const saveSettings = async () => {
    const traceId = getClientTraceId();
    const startedAt = performance.now();
    setIsSaving(true);

    try {
      const nextSettings = {
        enabled,
        allowedEmails: textToEmails(emails),
        fieldPaths,
        expiresAt: datetimeLocalToIso(expiresAt),
      };
      const response = await fetch('/api/insurance/share-settings', {
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
          'x-trace-id': traceId,
        },
        body: JSON.stringify(nextSettings),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to save share settings.');
      }

      setSettings(payload.settings);
      setPreviewCases(payload.preview?.sharedCases ?? []);
      messageApi.success('Share settings saved.');
      logClientEvent('insurance_admin_global_share_settings_saved', {
        traceId,
        enabled,
        allowedEmailCount: nextSettings.allowedEmails.length,
        fieldCount: fieldPaths.length,
        durationMs: Math.round(performance.now() - startedAt),
      });
    } catch (saveError) {
      const messageText =
        saveError instanceof Error ? saveError.message : 'Failed to save share settings.';
      messageApi.error(messageText);
    } finally {
      setIsSaving(false);
    }
  };

  const selectedFields = React.useMemo(
    () =>
      fieldPaths
        .map((fieldPath) =>
          insuranceShareFieldCatalog.find((field) => field.path === fieldPath)
        )
        .filter((field): field is NonNullable<typeof field> => Boolean(field)),
    [fieldPaths]
  );

  const previewColumns: ColumnsType<SharePreviewCase> = React.useMemo(
    () => [
      {
        title: 'Case',
        dataIndex: 'customerName',
        fixed: 'left',
        render: (_, insuranceCase) => (
          <Space direction="vertical" size={0}>
            <Text strong>{insuranceCase.customerName || 'Unnamed case'}</Text>
            <Text type="secondary">{insuranceCase.id.slice(0, 8)}</Text>
          </Space>
        ),
      },
      {
        title: 'Status',
        dataIndex: 'status',
        width: 120,
        render: (status: string) => <Tag>{statusLabel(status)}</Tag>,
      },
      {
        title: 'Verified',
        dataIndex: 'confirmedAt',
        width: 170,
        render: (value?: string | null) =>
          value ? formatDateTime(value) : <Text type="secondary">Not recorded</Text>,
      },
      ...selectedFields.map((field) => ({
        title: field.label,
        key: field.path,
        width: 180,
        render: (_: unknown, insuranceCase: SharePreviewCase) => {
          const row = insuranceCase.rows.find((item) => item.path === field.path);
          return row?.value ?? <Text type="secondary">-</Text>;
        },
      })),
    ],
    [selectedFields]
  );

  return (
    <div className="insurance-admin-page">
      {contextHolder}
      <main className="insurance-admin-page__main">
        <AdminHeader
          title="Share settings"
          isLoading={isLoading}
          onRefresh={loadSettings}
        />

        {error ? (
          <Alert type="error" showIcon message="Could not load settings" description={error} />
        ) : null}

        <Card className="insurance-admin-detail-card">
          {isLoading && !settings ? (
            <Skeleton active paragraph={{ rows: 10 }} />
          ) : (
            <div className="insurance-share-settings">
              <div className="insurance-share-settings__row">
                <div>
                  <Text strong>Enable single share link</Text>
                  <Text type="secondary">Partners use one link: /insurance/share</Text>
                </div>
                <Switch checked={enabled} onChange={setEnabled} />
              </div>

              <label className="insurance-share-settings__field">
                <Text strong>Allowed emails</Text>
                <Input.TextArea
                  rows={4}
                  value={emails}
                  placeholder="provider@example.com"
                  onChange={(event) => setEmails(event.target.value)}
                />
              </label>

              <label className="insurance-share-settings__field">
                <Text strong>Expires at</Text>
                <Input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(event) => setExpiresAt(event.target.value)}
                />
              </label>

              <div className="insurance-share-settings__field">
                <Text strong>Fields to expose</Text>
                <Checkbox.Group
                  value={fieldPaths}
                  onChange={(values) => setFieldPaths(values.map(String))}
                >
                  <div className="insurance-share-field-options">
                    {insuranceShareFieldCatalog.map((field) => (
                      <Checkbox key={field.path} value={field.path}>
                        {field.groupLabel}: {field.label}
                      </Checkbox>
                    ))}
                  </div>
                </Checkbox.Group>
              </div>

              <div className="insurance-share-settings__actions">
                <Button
                  type="primary"
                  loading={isSaving}
                  onClick={saveSettings}
                >
                  Save settings
                </Button>
                <Button href="/insurance/share" target="_blank">
                  Open single share link
                </Button>
              </div>
            </div>
          )}
        </Card>

        <Card
          className="insurance-admin-detail-card"
          title="Shared table preview"
          extra={
            <Space size={[6, 6]} wrap>
              {selectedFields.length ? (
                selectedFields.map((field) => (
                  <Tag key={field.path}>
                    {field.groupLabel}: {field.label}
                  </Tag>
                ))
              ) : (
                <Text type="secondary">No fields selected</Text>
              )}
            </Space>
          }
        >
          <Table
            columns={previewColumns}
            dataSource={previewCases}
            loading={isLoading || isSaving}
            locale={{
              emptyText: (
                <Empty description="No verified shared cases match these settings yet" />
              ),
            }}
            pagination={previewCases.length > 10 ? { pageSize: 10 } : false}
            rowKey="id"
            scroll={{ x: 'max-content' }}
            size="middle"
          />
        </Card>
      </main>
    </div>
  );
}
