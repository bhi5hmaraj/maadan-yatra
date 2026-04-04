'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Card, Flex, Form, Modal, Space, Typography, message } from 'antd';
import { ArrowLeftOutlined, EyeOutlined, DownloadOutlined, SaveOutlined } from '@ant-design/icons';
import { useGo, useList } from '@refinedev/core';
import {
  QuotationForm,
  prepareQuotationFormValues,
  transformFormValues,
} from '@/components/quotation/QuotationForm';
import { QuotationDocument } from '@/components/quotation/QuotationDocument';
import { QuotationPreview } from '@/components/quotation/QuotationPreview';
import type { Quotation } from '@/types/quotation';
import { createDefaultQuotation } from '@/types/quotation';
import { generateQuotationNumber } from '@/utils/formatting';
import { generatePDF } from '@/utils/pdf';

const { Paragraph, Title } = Typography;

interface QuotationEditorProps {
  mode: 'create' | 'edit';
  initialQuotation?: Quotation;
  onSave: (quotation: Quotation | Omit<Quotation, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  saving?: boolean;
}

export function QuotationEditor({
  mode,
  initialQuotation,
  onSave,
  saving = false,
}: QuotationEditorProps) {
  const [form] = Form.useForm();
  const go = useGo();
  const [previewData, setPreviewData] = useState<Partial<Quotation>>(initialQuotation ?? createDefaultQuotation());
  const documentRef = useRef<HTMLDivElement>(null);
  const modalDocumentRef = useRef<HTMLDivElement>(null);
  const [messageApi, contextHolder] = message.useMessage();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const { data: quotationsData } = useList<Quotation>({
    resource: 'quotations',
    pagination: { mode: 'off' },
    queryOptions: {
      enabled: mode === 'create',
    },
  });

  useEffect(() => {
    const base = initialQuotation ?? createDefaultQuotation();
    form.setFieldsValue(prepareQuotationFormValues(base));
    setPreviewData(base);
  }, [form, initialQuotation]);

  useEffect(() => {
    if (mode !== 'create' || initialQuotation) {
      return;
    }

    const currentNumber = form.getFieldValue('number');
    const existingNumbers = quotationsData?.data?.map((quotation) => quotation.number) ?? [];

    if (!currentNumber || /^QT-\d{4}-001$/.test(currentNumber)) {
      const nextNumber = generateQuotationNumber(existingNumbers);
      form.setFieldValue('number', nextNumber);
      setPreviewData((current) => ({ ...current, number: nextNumber }));
    }
  }, [form, initialQuotation, mode, quotationsData?.data]);

  const title = useMemo(
    () => (mode === 'create' ? 'Create Quotation' : `Edit ${initialQuotation?.number ?? 'Quotation'}`),
    [initialQuotation?.number, mode]
  );

  const description = mode === 'create'
    ? 'Compose the quotation on the left and review the generated document on the right before saving.'
    : 'Update the saved quotation and verify the document layout before saving changes.';

  const handleValuesChange = (_changedValues: unknown, allValues: unknown) => {
    setPreviewData(transformFormValues(allValues as Record<string, unknown>));
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const transformed = transformFormValues(values as Record<string, unknown>);
      const payload = {
        ...(initialQuotation ?? {}),
        ...transformed,
        status: (transformed.status ?? initialQuotation?.status ?? 'draft') as Quotation['status'],
      };

      await onSave(payload as Quotation);
    } catch (error) {
      if (error && typeof error === 'object' && 'errorFields' in error) {
        messageApi.error('Please complete the required quotation fields before saving.');
        return;
      }

      const description = error instanceof Error ? error.message : 'Unable to save quotation.';
      messageApi.error(description);
    }
  };

  const handleDownload = async () => {
    const values = form.getFieldsValue(true);
    const transformed = transformFormValues(values as Record<string, unknown>);
    const payload = {
      ...(initialQuotation ?? createDefaultQuotation()),
      ...transformed,
      id: initialQuotation?.id ?? 'preview',
      createdAt: initialQuotation?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: (transformed.status ?? initialQuotation?.status ?? 'draft') as Quotation['status'],
    } as Quotation;

    const target = isPreviewOpen ? modalDocumentRef.current : documentRef.current ?? modalDocumentRef.current;

    if (!target) {
      messageApi.error('Preview document is not ready yet.');
      return;
    }

    await generatePDF(target, payload);
  };

  return (
    <>
      {contextHolder}
      <div className="app-shell-page">
        <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
          <div>
            <Button
              type="link"
              icon={<ArrowLeftOutlined />}
              onClick={() => go({ to: '/quotations', type: 'replace' })}
              style={{ paddingLeft: 0 }}
            >
              Back to quotations
            </Button>
            <Title level={2} style={{ margin: 0 }}>
              {title}
            </Title>
            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
              {description}
            </Paragraph>
          </div>
          <Space>
            <Button icon={<EyeOutlined />} onClick={() => setIsPreviewOpen(true)}>
              Preview
            </Button>
            <Button icon={<DownloadOutlined />} onClick={handleDownload}>
              Download PDF
            </Button>
            <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>
              {mode === 'create' ? 'Save quotation' : 'Save changes'}
            </Button>
          </Space>
        </Flex>

        <Card bodyStyle={{ padding: 20 }}>
          <QuotationForm
            form={form}
            initialValues={initialQuotation ?? createDefaultQuotation()}
            onValuesChange={handleValuesChange}
          />
        </Card>
      </div>
      <div style={{ position: 'absolute', left: -99999, top: 0, pointerEvents: 'none' }}>
        <QuotationDocument ref={documentRef} quotation={previewData} />
      </div>
      <Modal
        open={isPreviewOpen}
        onCancel={() => setIsPreviewOpen(false)}
        footer={[
          <Button key="download" icon={<DownloadOutlined />} onClick={handleDownload}>
            Download PDF
          </Button>,
          <Button key="close" type="primary" onClick={() => setIsPreviewOpen(false)}>
            Close
          </Button>,
        ]}
        width="min(1120px, 96vw)"
        styles={{
          body: {
            padding: 16,
            background: '#b8b4ad',
          },
        }}
      >
        <QuotationPreview quotation={previewData} documentRef={modalDocumentRef} />
      </Modal>
    </>
  );
}
