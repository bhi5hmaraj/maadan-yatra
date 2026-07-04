'use client';

import React from 'react';
import Link from 'next/link';
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  Select,
  Segmented,
  Typography,
  message,
} from 'antd';
import {
  CameraOutlined,
  CloudUploadOutlined,
  DeleteOutlined,
  FileDoneOutlined,
  FolderOpenOutlined,
} from '@ant-design/icons';
import {
  allowedInsuranceUploadMimeTypes,
  insuranceDocumentTypes,
  insurancePhotoUploadMimeTypes,
  type InsuranceDocumentType,
  maxServerUploadBytes,
} from '@/features/insurance/domain';
import { getClientTraceId, logClientEvent, resetClientTraceId } from '@/lib/logging/client';

const { Text, Title } = Typography;
const { TextArea } = Input;

interface UploadResult {
  caseId: string;
  documentId: string;
  createdCase: boolean;
  document: {
    type: InsuranceDocumentType;
    fileName: string;
    sizeBytes: number;
  };
}

interface UploadedDocument {
  documentId: string;
  type: InsuranceDocumentType;
  fileName: string;
  sizeBytes: number;
}

interface DraftDocument {
  id: string;
  file: File;
  type: InsuranceDocumentType;
}

interface UploadFormValues {
  customerName?: string;
  notes?: string;
}

type Language = 'en' | 'ta';
type UploadMode = 'camera' | 'library';

const copy = {
  en: {
    title: 'Insurance Upload',
    language: 'Language',
    customerName: 'Customer name',
    optional: 'Optional',
    documentType: 'Document type',
    selectDocumentType: 'Select a document type.',
    documentFile: 'Document',
    takePhoto: 'Take photo',
    chooseFile: 'Choose files',
    notes: 'Notes',
    currentCase: 'Current case',
    startNewCase: 'Start new case',
    documentsToUpload: 'Documents to upload',
    noDocuments: 'No documents added yet',
    uploadedDocuments: 'Uploaded documents',
    selected: 'Selected',
    remove: 'Remove',
    sizeHint: `PDF, JPEG, PNG, WebP, HEIC, or HEIF up to ${formatBytes(maxServerUploadBytes)}`,
    requiredFile: 'Add at least one document before submitting.',
    tooLarge: 'Document must be 10 MB or smaller.',
    upload: 'Upload all documents',
    uploaded: 'Upload saved',
    uploadedDescription: (caseId: string, count: number) =>
      `Case ${caseId} has ${count} document${count === 1 ? '' : 's'} attached.`,
    uploadFailed: 'Upload failed.',
    uploadSuccess: 'Documents uploaded.',
    documents: {
      AADHAAR_FRONT: 'Aadhaar front',
      AADHAAR_BACK: 'Aadhaar back',
      PURCHASE_SLIP: 'Purchase slip',
      OTHER: 'Other',
    },
  },
  ta: {
    title: 'காப்பீடு பதிவேற்றம்',
    language: 'மொழி',
    customerName: 'வாடிக்கையாளர் பெயர்',
    optional: 'விருப்பம்',
    documentType: 'ஆவண வகை',
    selectDocumentType: 'ஆவண வகையை தேர்வு செய்யவும்.',
    documentFile: 'ஆவணம்',
    takePhoto: 'புகைப்படம் எடு',
    chooseFile: 'கோப்புகளை தேர்வு செய்',
    notes: 'குறிப்புகள்',
    currentCase: 'தற்போதைய வழக்கு',
    startNewCase: 'புதிய வழக்கு',
    documentsToUpload: 'பதிவேற்ற வேண்டிய ஆவணங்கள்',
    noDocuments: 'இன்னும் ஆவணங்கள் சேர்க்கப்படவில்லை',
    uploadedDocuments: 'பதிவேற்றிய ஆவணங்கள்',
    selected: 'தேர்வு செய்யப்பட்டது',
    remove: 'நீக்கு',
    sizeHint: `PDF, JPEG, PNG, WebP, HEIC, அல்லது HEIF ${formatBytes(maxServerUploadBytes)} வரை`,
    requiredFile: 'குறைந்தது ஒரு ஆவணத்தை சேர்க்கவும்.',
    tooLarge: 'ஆவணம் 10 MB அல்லது அதற்கு குறைவாக இருக்க வேண்டும்.',
    upload: 'அனைத்து ஆவணங்களையும் பதிவேற்று',
    uploaded: 'பதிவேற்றம் சேமிக்கப்பட்டது',
    uploadedDescription: (caseId: string, count: number) =>
      `வழக்கு ${caseId} - ${count} ஆவணம் இணைக்கப்பட்டது.`,
    uploadFailed: 'பதிவேற்றம் தோல்வியடைந்தது.',
    uploadSuccess: 'ஆவணங்கள் பதிவேற்றப்பட்டன.',
    documents: {
      AADHAAR_FRONT: 'ஆதார் முன்பக்கம்',
      AADHAAR_BACK: 'ஆதார் பின்பக்கம்',
      PURCHASE_SLIP: 'வாங்கிய ரசீது',
      OTHER: 'மற்றவை',
    },
  },
} satisfies Record<Language, {
  title: string;
  language: string;
  customerName: string;
  optional: string;
  documentType: string;
  selectDocumentType: string;
  documentFile: string;
  takePhoto: string;
  chooseFile: string;
  notes: string;
  currentCase: string;
  startNewCase: string;
  documentsToUpload: string;
  noDocuments: string;
  uploadedDocuments: string;
  selected: string;
  remove: string;
  sizeHint: string;
  requiredFile: string;
  tooLarge: string;
  upload: string;
  uploaded: string;
  uploadedDescription: (caseId: string, count: number) => string;
  uploadFailed: string;
  uploadSuccess: string;
  documents: Record<InsuranceDocumentType, string>;
}>;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function InsuranceUploadPage() {
  const [form] = Form.useForm<UploadFormValues>();
  const [messageApi, contextHolder] = message.useMessage();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [language, setLanguage] = React.useState<Language>('en');
  const [uploadMode, setUploadMode] = React.useState<UploadMode>('camera');
  const [currentCaseId, setCurrentCaseId] = React.useState<string | null>(null);
  const [draftDocuments, setDraftDocuments] = React.useState<DraftDocument[]>([]);
  const [uploadedDocuments, setUploadedDocuments] = React.useState<UploadedDocument[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [result, setResult] = React.useState<UploadResult | null>(null);
  const text = copy[language];

  React.useEffect(() => {
    logClientEvent('insurance_upload_page_viewed');
  }, []);

  const documentTypeOptions = insuranceDocumentTypes.map((type) => ({
    value: type,
    label: text.documents[type],
  }));

  const clearFileInput = (clearResult = true) => {
    if (clearResult) {
      setResult(null);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const startNewCase = () => {
    const traceId = resetClientTraceId();
    setCurrentCaseId(null);
    setDraftDocuments([]);
    setUploadedDocuments([]);
    setResult(null);
    form.resetFields();

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    logClientEvent('insurance_case_draft_reset', { traceId });
  };

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const files = Array.from(event.currentTarget.files ?? []);
    const oversizedFile = files.find((file) => file.size > maxServerUploadBytes);

    if (oversizedFile) {
      messageApi.error(text.tooLarge);
      logClientEvent(
        'insurance_draft_file_rejected',
        {
          reason: 'file_too_large',
          sizeBytes: oversizedFile.size,
          mimeType: oversizedFile.type,
        },
        'warn'
      );
      event.currentTarget.value = '';
      setResult(null);
      return;
    }

    setDraftDocuments((documents) => [
      ...documents,
      ...files.map((file) => ({
        id: crypto.randomUUID(),
        file,
        type: 'PURCHASE_SLIP' as InsuranceDocumentType,
      })),
    ]);
    logClientEvent('insurance_draft_files_added', {
      count: files.length,
      mode: uploadMode,
      fileTypes: files.map((file) => file.type),
      totalBytes: files.reduce((sum, file) => sum + file.size, 0),
    });
    setResult(null);
    event.currentTarget.value = '';
  };

  const updateDraftDocumentType = (id: string, type: InsuranceDocumentType) => {
    setDraftDocuments((documents) =>
      documents.map((document) =>
        document.id === id ? { ...document, type } : document
      )
    );
    logClientEvent('insurance_draft_document_type_changed', { type });
  };

  const removeDraftDocument = (id: string) => {
    setDraftDocuments((documents) => {
      const removedDocument = documents.find((document) => document.id === id);
      logClientEvent('insurance_draft_document_removed', {
        mimeType: removedDocument?.file.type,
        sizeBytes: removedDocument?.file.size,
      });
      return documents.filter((document) => document.id !== id);
    });
  };

  const handleFinish = async (values: UploadFormValues) => {
    if (draftDocuments.length === 0) {
      messageApi.error(text.requiredFile);
      logClientEvent('insurance_upload_submit_rejected', { reason: 'empty_draft' }, 'warn');
      return;
    }

    setIsSubmitting(true);
    setResult(null);

    let caseId = currentCaseId;
    const uploaded: UploadedDocument[] = [];
    let lastPayload: UploadResult | null = null;
    const traceId = getClientTraceId();

    logClientEvent('insurance_upload_batch_started', {
      traceId,
      caseId,
      documentCount: draftDocuments.length,
      totalBytes: draftDocuments.reduce((sum, document) => sum + document.file.size, 0),
    });

    try {
      for (let index = 0; index < draftDocuments.length; index += 1) {
        const document = draftDocuments[index];
        const body = new FormData();
        body.append('file', document.file);
        body.append('documentType', document.type);

        if (caseId) {
          body.append('caseId', caseId);
        }

        if (values.customerName) {
          body.append('customerName', values.customerName);
        }

        if (values.notes) {
          body.append('notes', values.notes);
        }

        const response = await fetch('/api/insurance/uploads', {
          method: 'POST',
          headers: {
            'x-trace-id': traceId,
          },
          body,
        });
        const payload = await response.json();

        if (!response.ok) {
          logClientEvent(
            'insurance_upload_document_failed',
            {
              traceId,
              caseId,
              index,
              status: response.status,
              documentType: document.type,
              mimeType: document.file.type,
              sizeBytes: document.file.size,
              error: payload.error,
            },
            'error'
          );
          throw new Error(payload.error ?? text.uploadFailed);
        }

        caseId = payload.caseId;
        lastPayload = payload as UploadResult;
        uploaded.push({
          documentId: payload.documentId,
          type: payload.document.type,
          fileName: payload.document.fileName,
          sizeBytes: payload.document.sizeBytes,
        });
        logClientEvent('insurance_upload_document_completed', {
          traceId,
          caseId,
          index,
          documentId: payload.documentId,
          documentType: payload.document.type,
          mimeType: document.file.type,
          sizeBytes: document.file.size,
        });
      }

      if (caseId) {
        setCurrentCaseId(caseId);
      }
      setResult(lastPayload);
      setUploadedDocuments((documents) => [...documents, ...uploaded]);
      setDraftDocuments([]);
      clearFileInput(false);
      form.resetFields(['notes']);
      messageApi.success(text.uploadSuccess);
      logClientEvent('insurance_upload_batch_completed', {
        traceId,
        caseId,
        uploadedCount: uploaded.length,
      });
    } catch (error) {
      if (uploaded.length > 0) {
        if (caseId) {
          setCurrentCaseId(caseId);
        }
        setResult(lastPayload);
        setUploadedDocuments((documents) => [...documents, ...uploaded]);
        setDraftDocuments((documents) => documents.slice(uploaded.length));
        clearFileInput(false);
      }
      logClientEvent(
        'insurance_upload_batch_failed',
        {
          traceId,
          caseId,
          uploadedCount: uploaded.length,
          remainingCount: draftDocuments.length - uploaded.length,
          error: error instanceof Error ? error.message : text.uploadFailed,
        },
        'error'
      );
      messageApi.error(error instanceof Error ? error.message : text.uploadFailed);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="insurance-upload-page" lang={language}>
      {contextHolder}
      <main className="insurance-upload-page__main">
        <div className="insurance-upload-page__header">
          <Title level={2}>{text.title}</Title>
          <div className="insurance-upload-page__header-actions">
            <Link href="/insurance/admin">
              <Button size="small">Admin</Button>
            </Link>
            <Segmented<Language>
              aria-label={text.language}
              value={language}
              onChange={setLanguage}
              options={[
                { label: 'English', value: 'en' },
                { label: 'தமிழ்', value: 'ta' },
              ]}
            />
          </div>
        </div>

        {currentCaseId ? (
          <div className="insurance-case-strip">
            <div>
              <Text type="secondary">{text.currentCase}</Text>
              <Text strong>{currentCaseId.slice(0, 8)}</Text>
            </div>
            <Button size="small" onClick={startNewCase}>
              {text.startNewCase}
            </Button>
          </div>
        ) : null}

        <Card className="insurance-upload-card" variant="borderless">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleFinish}
          >
            <Form.Item label={text.customerName} name="customerName">
              <Input placeholder={text.optional} autoComplete="name" />
            </Form.Item>

            <Form.Item label={text.documentFile} className="insurance-photo-field">
              <div className="insurance-photo-box">
                <Segmented<UploadMode>
                  block
                  className="insurance-upload-mode"
                  value={uploadMode}
                  onChange={(value) => {
                    setUploadMode(value);
                    clearFileInput();
                  }}
                  options={[
                    { label: text.takePhoto, value: 'camera', icon: <CameraOutlined /> },
                    { label: text.chooseFile, value: 'library', icon: <FolderOpenOutlined /> },
                  ]}
                />

                <Button
                  className="insurance-photo-button"
                  type="primary"
                  icon={uploadMode === 'camera' ? <CameraOutlined /> : <FolderOpenOutlined />}
                  onClick={() => fileInputRef.current?.click()}
                  block
                >
                  {uploadMode === 'camera' ? text.takePhoto : text.chooseFile}
                </Button>

                <Text type="secondary" className="insurance-file-hint">
                  {text.sizeHint}
                </Text>
              </div>

              <input
                key={uploadMode}
                ref={fileInputRef}
                type="file"
                accept={
                  uploadMode === 'camera'
                    ? insurancePhotoUploadMimeTypes.join(',')
                    : allowedInsuranceUploadMimeTypes.join(',')
                }
                capture={uploadMode === 'camera' ? 'environment' : undefined}
                multiple
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </Form.Item>

            <div className="insurance-draft-docs">
              <Text strong>{text.documentsToUpload}</Text>
              {draftDocuments.length === 0 ? (
                <div className="insurance-draft-empty">
                  <Text type="secondary">{text.noDocuments}</Text>
                </div>
              ) : (
                <div className="insurance-draft-docs__list">
                  {draftDocuments.map((document, index) => (
                    <div className="insurance-draft-doc" key={document.id}>
                      <div className="insurance-draft-doc__meta">
                        <FileDoneOutlined />
                        <div>
                          <Text strong>{document.file.name}</Text>
                          <Text type="secondary">{formatBytes(document.file.size)}</Text>
                        </div>
                      </div>
                      <div className="insurance-draft-doc__controls">
                        <Select
                          aria-label={`${text.documentType} ${index + 1}`}
                          value={document.type}
                          options={documentTypeOptions}
                          onChange={(value) => updateDraftDocumentType(document.id, value)}
                        />
                        <Button
                          aria-label={text.remove}
                          icon={<DeleteOutlined />}
                          onClick={() => removeDraftDocument(document.id)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Form.Item label={text.notes} name="notes">
              <TextArea rows={3} placeholder={text.optional} />
            </Form.Item>

            <div className="insurance-upload-actions">
              <Button
                type="primary"
                htmlType="submit"
                icon={<CloudUploadOutlined />}
                loading={isSubmitting}
                block
              >
                {text.upload}
              </Button>
            </div>
          </Form>

          {uploadedDocuments.length > 0 ? (
            <div className="insurance-uploaded-docs">
              <Text strong>{text.uploadedDocuments}</Text>
              <div className="insurance-uploaded-docs__list">
                {uploadedDocuments.map((document) => (
                  <div className="insurance-uploaded-doc" key={document.documentId}>
                    <span>{text.documents[document.type]}</span>
                    <Text type="secondary">
                      {document.fileName} ({formatBytes(document.sizeBytes)})
                    </Text>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </Card>

        {result ? (
          <Alert
            type="success"
            showIcon
            message={text.uploaded}
            description={text.uploadedDescription(result.caseId, uploadedDocuments.length)}
          />
        ) : null}
      </main>
    </div>
  );
}
