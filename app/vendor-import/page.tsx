'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Input,
  Modal,
  Row,
  Space,
  Tabs,
  Tag,
  Typography,
  Upload,
  message,
} from 'antd';
import {
  ArrowLeftOutlined,
  EyeOutlined,
  InboxOutlined,
  SaveOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { QuotationPreview } from '@/components/quotation/QuotationPreview';
import { mapIRToQuotation } from '@/utils/quotation-ir';
import {
  quotationIRSchema,
  type QuotationIR,
  type VendorDocument,
} from '@/schemas';
import type { Quotation } from '@/types/quotation';
import { localStorageDataProvider } from '@/providers/localStorageDataProvider';
import { generateQuotationNumber } from '@/utils/formatting';

const { Dragger } = Upload;
const { TextArea } = Input;
const { Paragraph, Text, Title } = Typography;

interface ParseResponse {
  vendorDocument: VendorDocument;
  ir: QuotationIR;
  rawText?: string;
}

export default function VendorImportPage() {
  const router = useRouter();
  const [fileList, setFileList] = React.useState<UploadFile[]>([]);
  const [isParsing, setIsParsing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [parseResult, setParseResult] = React.useState<ParseResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);
  const [irText, setIrText] = React.useState('');
  const [currentIr, setCurrentIr] = React.useState<QuotationIR | null>(null);
  const [irError, setIrError] = React.useState<string | null>(null);
  const [messageApi, contextHolder] = message.useMessage();

  const previewQuotation = React.useMemo<Quotation | null>(() => {
    if (!currentIr) return null;
    return mapIRToQuotation(currentIr);
  }, [currentIr]);

  const selectedFile = fileList[0]?.originFileObj ?? null;

  const existingQuotationNumbers = React.useMemo(() => {
    if (typeof window === 'undefined') {
      return [];
    }

    try {
      const stored = localStorage.getItem('maadan_yatra_quotations');
      if (!stored) {
        return [];
      }

      const quotations = JSON.parse(stored) as Array<{ number?: string }>;
      return quotations
        .map((quotation) => quotation.number)
        .filter((value): value is string => Boolean(value));
    } catch {
      return [];
    }
  }, [isSaving]);

  const handleParse = async () => {
    if (!selectedFile) {
      messageApi.error('Choose a vendor PDF first.');
      return;
    }

    setIsParsing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/vendor-import/parse', {
        method: 'POST',
        body: formData,
      });

      const payload = (await response.json()) as ParseResponse | { error: string };

      if (!response.ok || 'error' in payload) {
        throw new Error('error' in payload ? payload.error : 'Failed to parse vendor PDF.');
      }

      setParseResult(payload);
      setCurrentIr(payload.ir);
      setIrText(JSON.stringify(payload.ir, null, 2));
      setIrError(null);
      messageApi.success('Vendor PDF parsed into IR.');
    } catch (parseError) {
      const messageText =
        parseError instanceof Error ? parseError.message : 'Failed to parse vendor PDF.';
      setError(messageText);
    } finally {
      setIsParsing(false);
    }
  };

  const handleSaveQuotation = async () => {
    if (!parseResult || !previewQuotation || !currentIr) {
      messageApi.error('Parse a vendor PDF before saving a quotation.');
      return;
    }

    setIsSaving(true);

    try {
      const nextNumber =
        currentIr.quotationNumber?.trim() ||
        generateQuotationNumber(existingQuotationNumbers);

      const result = await localStorageDataProvider.create<Quotation>({
        resource: 'quotations',
        variables: {
          ...previewQuotation,
          number: nextNumber,
          sourceIr: {
            ...currentIr,
            quotationNumber: nextNumber,
          },
          sourceVendorDocument: parseResult.vendorDocument,
        },
      });

      messageApi.success('Imported quotation saved.');
      router.push(`/quotations/edit/${result.data.id}`);
    } catch (saveError) {
      const messageText =
        saveError instanceof Error ? saveError.message : 'Failed to save quotation.';
      setError(messageText);
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyIrEdits = () => {
    if (!parseResult) {
      return;
    }

    try {
      const parsed = JSON.parse(irText) as unknown;
      const validated = quotationIRSchema.parse(parsed);
      setCurrentIr(validated);
      setIrText(JSON.stringify(validated, null, 2));
      setIrError(null);
      setError(null);
      messageApi.success('IR edits applied.');
    } catch (applyError) {
      const messageText =
        applyError instanceof Error ? applyError.message : 'IR JSON is invalid.';
      setIrError(messageText);
    }
  };

  const handleResetIrEdits = () => {
    if (!parseResult) {
      return;
    }

    setCurrentIr(parseResult.ir);
    setIrText(JSON.stringify(parseResult.ir, null, 2));
    setIrError(null);
    messageApi.success('IR reset to parsed result.');
  };

  return (
    <>
      {contextHolder}
      <div className="app-shell-page">
        <div>
          <Link href="/">
            <Button type="link" icon={<ArrowLeftOutlined />} style={{ paddingLeft: 0 }}>
              Back to dashboard
            </Button>
          </Link>
          <Title level={2} style={{ marginBottom: 0 }}>
            Vendor PDF Import
          </Title>
          <Paragraph type="secondary">
            Upload a vendor quotation PDF, extract it into the internal IR with an LLM, and review the normalized output before turning it into your house quote.
          </Paragraph>
        </div>

        <Card>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Dragger
              accept=".pdf,application/pdf"
              multiple={false}
              beforeUpload={() => false}
              fileList={fileList}
              onChange={({ fileList: nextFileList }) =>
                setFileList(nextFileList.slice(-1))
              }
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">Drop a vendor PDF here or click to upload</p>
              <p className="ant-upload-hint">
                Requires `GEMINI_API_KEY` on the server. The PDF is uploaded to Gemini Files API and parsed into the IR using Gemini structured JSON output.
              </p>
            </Dragger>

            <Space wrap>
              <Button
                type="primary"
                icon={<UploadOutlined />}
                onClick={handleParse}
                loading={isParsing}
                disabled={!selectedFile}
              >
                Parse PDF to IR
              </Button>
              {previewQuotation ? (
                <Button
                  icon={<SaveOutlined />}
                  onClick={handleSaveQuotation}
                  loading={isSaving}
                >
                  Save as quotation
                </Button>
              ) : null}
              {previewQuotation ? (
                <Button icon={<EyeOutlined />} onClick={() => setIsPreviewOpen(true)}>
                  Preview as quotation
                </Button>
              ) : null}
            </Space>

            {error ? <Alert type="error" showIcon message={error} /> : null}
          </Space>
        </Card>

        {parseResult ? (
          <Tabs
            items={[
              {
                key: 'overview',
                label: 'Overview',
                children: (
                  <Row gutter={[16, 16]}>
                    <Col xs={24} lg={12}>
                      <Card title="Source document">
                        <Descriptions size="small" column={1}>
                          <Descriptions.Item label="File">
                            {parseResult.vendorDocument.fileName}
                          </Descriptions.Item>
                          <Descriptions.Item label="Type">
                            <Tag>{parseResult.vendorDocument.sourceType.toUpperCase()}</Tag>
                          </Descriptions.Item>
                          <Descriptions.Item label="Pages">
                            {parseResult.vendorDocument.pageCount ?? '—'}
                          </Descriptions.Item>
                        </Descriptions>
                      </Card>
                    </Col>
                    <Col xs={24} lg={12}>
                      <Card title="IR summary">
                        <Descriptions size="small" column={1}>
                          <Descriptions.Item label="Customer">
                            {currentIr?.customer.name || '—'}
                          </Descriptions.Item>
                          <Descriptions.Item label="Destination">
                            {currentIr?.trip.destination || '—'}
                          </Descriptions.Item>
                          <Descriptions.Item label="Trip title">
                            {currentIr?.trip.title || '—'}
                          </Descriptions.Item>
                          <Descriptions.Item label="Pricing items">
                            {currentIr?.pricing.lineItems.length ?? 0}
                          </Descriptions.Item>
                        </Descriptions>
                      </Card>
                    </Col>
                  </Row>
                ),
              },
              {
                key: 'content',
                label: 'Parsed content',
                children: (
                  <Row gutter={[16, 16]}>
                    <Col xs={24} lg={12}>
                      <Card title="Inclusions">
                        <Space direction="vertical" size={8}>
                          {currentIr && currentIr.inclusions.length > 0 ? (
                            currentIr.inclusions.map((item, index) => (
                              <Text key={`${item.text}-${index}`}>• {item.text}</Text>
                            ))
                          ) : (
                            <Text type="secondary">No inclusions extracted</Text>
                          )}
                        </Space>
                      </Card>
                    </Col>
                    <Col xs={24} lg={12}>
                      <Card title="Exclusions">
                        <Space direction="vertical" size={8}>
                          {currentIr && currentIr.exclusions.length > 0 ? (
                            currentIr.exclusions.map((item, index) => (
                              <Text key={`${item.text}-${index}`}>• {item.text}</Text>
                            ))
                          ) : (
                            <Text type="secondary">No exclusions extracted</Text>
                          )}
                        </Space>
                      </Card>
                    </Col>
                    <Col span={24}>
                      <Card title="Itinerary">
                        <Space direction="vertical" size={10} style={{ width: '100%' }}>
                          {currentIr && currentIr.itinerary.length > 0 ? (
                            currentIr.itinerary.map((item, index) => (
                              <div key={`${item.title}-${index}`}>
                                <Text strong>
                                  {item.dayNumber ? `Day ${item.dayNumber}: ` : ''}
                                  {item.title}
                                </Text>
                                <br />
                                <Text type="secondary">{item.description || '—'}</Text>
                              </div>
                            ))
                          ) : (
                            <Text type="secondary">No itinerary extracted</Text>
                          )}
                        </Space>
                      </Card>
                    </Col>
                  </Row>
                ),
              },
              {
                key: 'json',
                label: 'IR JSON',
                children: (
                  <Card
                    extra={
                      <Space>
                        <Button onClick={handleResetIrEdits}>Reset to parsed</Button>
                        <Button type="primary" onClick={handleApplyIrEdits}>
                          Apply edits
                        </Button>
                      </Space>
                    }
                  >
                    <Space direction="vertical" size={12} style={{ width: '100%' }}>
                      <Alert
                        type="info"
                        showIcon
                        message="Preview and save use the last valid applied IR."
                      />
                      {irError ? <Alert type="error" showIcon message={irError} /> : null}
                      <TextArea
                        value={irText}
                        onChange={(event) => setIrText(event.target.value)}
                        autoSize={{ minRows: 18, maxRows: 28 }}
                        style={{
                          fontFamily:
                            'ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, monospace',
                          fontSize: 12,
                        }}
                      />
                    </Space>
                  </Card>
                ),
              },
              ...(parseResult.rawText
                ? [
                    {
                      key: 'raw',
                      label: 'Raw text',
                      children: (
                        <Card styles={{ body: { padding: 0 } }}>
                          <pre
                            style={{
                              margin: 0,
                              padding: 16,
                              whiteSpace: 'pre-wrap',
                              overflow: 'auto',
                              maxHeight: 480,
                              fontSize: 12,
                            }}
                          >
                            {parseResult.rawText}
                          </pre>
                        </Card>
                      ),
                    },
                  ]
                : [
                    {
                      key: 'raw',
                      label: 'Raw text',
                      children: (
                        <Alert
                          type="info"
                          showIcon
                          message="Raw text is not captured in this flow."
                          description="The PDF is sent directly to Gemini Files API for parsing, so this screen only shows the normalized IR output."
                        />
                      ),
                    },
                  ]),
            ]}
          />
        ) : (
          <Card>
            <Empty
              description="No vendor PDF parsed yet."
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </Card>
        )}
      </div>

      <Modal
        open={isPreviewOpen}
        onCancel={() => setIsPreviewOpen(false)}
        footer={null}
        width={1120}
        styles={{
          body: {
            padding: 16,
            background: '#b8b4ad',
          },
        }}
      >
        {previewQuotation ? <QuotationPreview quotation={previewQuotation} /> : null}
      </Modal>
    </>
  );
}
