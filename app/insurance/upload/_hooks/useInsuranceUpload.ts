'use client';

import React from 'react';
import type { FormInstance } from 'antd';
import type { MessageInstance } from 'antd/es/message/interface';
import type { InsuranceDocumentType } from '@/features/insurance/domain';
import { maxServerUploadBytes } from '@/features/insurance/domain';
import { getClientTraceId, logClientEvent, resetClientTraceId } from '@/lib/logging/client';
import { uploadCopy } from '../_copy';
import type {
  DraftDocument,
  Language,
  UploadFormValues,
  UploadMode,
  UploadProgressState,
  UploadedDocument,
  UploadResult,
} from '../_types';

async function postUploadWithProgress(input: {
  body: FormData;
  traceId: string;
  onProgress: (loaded: number, total: number) => void;
}) {
  return new Promise<{ status: number; payload: unknown }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open('POST', '/api/insurance/uploads');
    xhr.setRequestHeader('x-trace-id', input.traceId);
    xhr.responseType = 'text';

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        input.onProgress(event.loaded, event.total);
      }
    };

    xhr.onerror = () => reject(new Error('Network error while uploading document.'));
    xhr.onabort = () => reject(new Error('Upload cancelled.'));
    xhr.onload = () => {
      try {
        resolve({
          status: xhr.status,
          payload: xhr.responseText ? JSON.parse(xhr.responseText) : {},
        });
      } catch {
        reject(new Error('Upload returned an invalid response.'));
      }
    };

    xhr.send(input.body);
  });
}

export function useInsuranceUpload(input: {
  form: FormInstance<UploadFormValues>;
  messageApi: MessageInstance;
}) {
  const { form, messageApi } = input;
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [language, setLanguage] = React.useState<Language>('en');
  const [uploadMode, setUploadMode] = React.useState<UploadMode>('camera');
  const [currentCaseId, setCurrentCaseId] = React.useState<string | null>(null);
  const [draftDocuments, setDraftDocuments] = React.useState<DraftDocument[]>([]);
  const [uploadedDocuments, setUploadedDocuments] = React.useState<UploadedDocument[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState<UploadProgressState | null>(null);
  const [result, setResult] = React.useState<UploadResult | null>(null);
  const text = uploadCopy[language];

  const now = () => Math.round(performance.now());

  React.useEffect(() => {
    logClientEvent('insurance_upload_page_viewed');
  }, []);

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
    setUploadProgress(null);
    setResult(null);
    form.resetFields();

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    logClientEvent('insurance_case_draft_reset', { traceId });
  };

  const setMode = (mode: UploadMode) => {
    setUploadMode(mode);
    clearFileInput();
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
      documents.map((document) => (document.id === id ? { ...document, type } : document))
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

  const startParseWorkflow = async (caseId: string, traceId: string) => {
    const workflowStartedAt = now();
    logClientEvent('insurance_upload_auto_parse_started', { traceId, caseId });

    const enqueueStartedAt = now();
    const enqueueResponse = await fetch(`/api/insurance/cases/${caseId}/parse`, {
      method: 'POST',
      headers: { 'x-trace-id': traceId },
    });
    const enqueuePayload = await enqueueResponse.json();
    logClientEvent('insurance_upload_parse_enqueue_completed', {
      traceId,
      caseId,
      jobId: enqueuePayload.job?.id,
      durationMs: now() - enqueueStartedAt,
      status: enqueueResponse.status,
    });

    if (!enqueueResponse.ok) {
      throw new Error(enqueuePayload.error ?? 'Failed to queue parsing.');
    }

    const processStartedAt = now();
    const processResponse = await fetch('/api/insurance/parse-jobs/process', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-trace-id': traceId,
      },
      body: JSON.stringify({ jobId: enqueuePayload.job?.id }),
    });
    const processPayload = await processResponse.json();
    logClientEvent('insurance_upload_parse_process_completed', {
      traceId,
      caseId,
      jobId: enqueuePayload.job?.id,
      durationMs: now() - processStartedAt,
      status: processResponse.status,
      processed: processPayload.processed,
    });

    if (!processResponse.ok) {
      throw new Error(processPayload.error ?? 'Failed to process parsing.');
    }

    logClientEvent('insurance_upload_auto_parse_completed', {
      traceId,
      caseId,
      jobId: enqueuePayload.job?.id,
      processed: processPayload.processed,
      durationMs: now() - workflowStartedAt,
      missingFieldCount: processPayload.extraction?.missingFields?.length ?? 0,
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
    const batchStartedAt = now();
    const totalBytes = draftDocuments.reduce((sum, document) => sum + document.file.size, 0);
    let completedBytes = 0;

    logClientEvent('insurance_upload_batch_started', {
      traceId,
      caseId,
      documentCount: draftDocuments.length,
      totalBytes,
    });

    try {
      for (let index = 0; index < draftDocuments.length; index += 1) {
        const document = draftDocuments[index];
        const documentUploadStartedAt = now();
        const body = new FormData();
        body.append('file', document.file);
        body.append('documentType', document.type);

        if (caseId) body.append('caseId', caseId);
        if (values.customerName) body.append('customerName', values.customerName);
        if (values.notes) body.append('notes', values.notes);

        setUploadProgress({
          current: index + 1,
          total: draftDocuments.length,
          fileName: document.file.name,
          percent: totalBytes > 0 ? Math.round((completedBytes / totalBytes) * 100) : 0,
        });

        const response = await postUploadWithProgress({
          body,
          traceId,
          onProgress: (loaded, total) => {
            const currentFileBytes = total > 0 ? (loaded / total) * document.file.size : 0;
            const percent =
              totalBytes > 0
                ? Math.min(99, Math.round(((completedBytes + currentFileBytes) / totalBytes) * 100))
                : 0;

            setUploadProgress({
              current: index + 1,
              total: draftDocuments.length,
              fileName: document.file.name,
              percent,
            });
          },
        });
        const payload = response.payload as Partial<UploadResult> & { error?: string };

        if (response.status < 200 || response.status >= 300) {
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
              durationMs: now() - documentUploadStartedAt,
              error: payload.error,
            },
            'error'
          );
          throw new Error(payload.error ?? text.uploadFailed);
        }

        if (!payload.caseId || !payload.documentId || !payload.document) {
          throw new Error('Upload returned an incomplete response.');
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
          durationMs: now() - documentUploadStartedAt,
        });
        completedBytes += document.file.size;
        setUploadProgress({
          current: index + 1,
          total: draftDocuments.length,
          fileName: document.file.name,
          percent: totalBytes > 0 ? Math.round((completedBytes / totalBytes) * 100) : 100,
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
      logClientEvent('insurance_upload_batch_completed', {
        traceId,
        caseId,
        uploadedCount: uploaded.length,
        durationMs: now() - batchStartedAt,
      });

      if (caseId) {
        messageApi.loading({ content: text.parseQueued, key: 'insurance-upload-parse' });

        void startParseWorkflow(caseId, traceId)
          .then(() => {
            messageApi.success({
              content: text.parseQueued,
              key: 'insurance-upload-parse',
            });
          })
          .catch((parseError) => {
            const errorMessage =
              parseError instanceof Error ? parseError.message : text.parseFailed;
            messageApi.warning({
              content: text.parseFailed,
              key: 'insurance-upload-parse',
            });
            logClientEvent(
              'insurance_upload_auto_parse_failed',
              {
                traceId,
                caseId,
                error: errorMessage,
              },
              'error'
            );
          });
      } else {
        messageApi.success(text.uploadSuccess);
      }
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
          durationMs: now() - batchStartedAt,
          error: error instanceof Error ? error.message : text.uploadFailed,
        },
        'error'
      );
      messageApi.error(error instanceof Error ? error.message : text.uploadFailed);
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  return {
    currentCaseId,
    draftDocuments,
    fileInputRef,
    form,
    handleFileChange,
    handleFinish,
    isSubmitting,
    language,
    removeDraftDocument,
    result,
    setLanguage,
    setMode,
    startNewCase,
    text,
    updateDraftDocumentType,
    uploadedDocuments,
    uploadProgress,
    uploadMode,
  };
}
