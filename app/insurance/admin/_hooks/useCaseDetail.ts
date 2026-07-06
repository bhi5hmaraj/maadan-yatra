'use client';

import React from 'react';
import type { FormInstance } from 'antd';
import type { MessageInstance } from 'antd/es/message/interface';
import {
  insuranceExtractionFromFormValues,
  insuranceExtractionToFormValues,
  type InsuranceExtraction,
} from '@/features/insurance/parser';
import { getClientTraceId, logClientEvent } from '@/lib/logging/client';
import type { AdminCase } from '../_types';

export function useCaseDetail(input: {
  caseId: string;
  messageApi: MessageInstance;
  reviewForm: FormInstance;
}) {
  const { caseId, messageApi, reviewForm } = input;
  const [insuranceCase, setInsuranceCase] = React.useState<AdminCase | null>(null);
  const [queuedExtraction, setQueuedExtraction] = React.useState<InsuranceExtraction | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [parsingCaseId, setParsingCaseId] = React.useState<string | null>(null);
  const [confirmingCaseId, setConfirmingCaseId] = React.useState<string | null>(null);
  const [savingShareCaseId, setSavingShareCaseId] = React.useState<string | null>(null);

  const selectedExtraction = insuranceCase
    ? insuranceCase.confirmedExtraction ?? queuedExtraction ?? insuranceCase.aiExtraction ?? null
    : null;
  const hasActiveWorkflow = Boolean(
    insuranceCase &&
      (insuranceCase.status === 'PARSING' ||
        insuranceCase.parseJobs.some(
          (job) => job.status === 'QUEUED' || job.status === 'RUNNING'
        ))
  );

  const loadCase = React.useCallback(async (options: { silent?: boolean } = {}) => {
    const traceId = getClientTraceId();
    const startedAt = performance.now();
    if (!options.silent) {
      setIsLoading(true);
      setError(null);
    }

    try {
      const response = await fetch(`/api/insurance/cases/${caseId}`, {
        headers: { 'x-trace-id': traceId },
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to load insurance case.');
      }

      setInsuranceCase(payload.case);
      if (!options.silent) {
        logClientEvent('insurance_admin_case_loaded', {
          traceId,
          caseId,
          durationMs: Math.round(performance.now() - startedAt),
        });
      }
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : 'Failed to load insurance case.';
      setError(message);
      messageApi.error(message);
      if (!options.silent) {
        logClientEvent(
          'insurance_admin_case_load_failed',
          {
            traceId,
            caseId,
            error: message,
            durationMs: Math.round(performance.now() - startedAt),
          },
          'error'
        );
      }
    } finally {
      if (!options.silent) {
        setIsLoading(false);
      }
    }
  }, [caseId, messageApi]);

  React.useEffect(() => {
    logClientEvent('insurance_admin_case_viewed', { caseId });
    void loadCase();
  }, [caseId, loadCase]);

  React.useEffect(() => {
    reviewForm.setFieldsValue(insuranceExtractionToFormValues(selectedExtraction));
  }, [reviewForm, insuranceCase?.id, selectedExtraction]);

  React.useEffect(() => {
    if (!hasActiveWorkflow) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void loadCase({ silent: true });
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [hasActiveWorkflow, loadCase]);

  const enqueueParse = async () => {
    if (!insuranceCase) return;

    if (hasActiveWorkflow) {
      messageApi.info('A parse job is already queued or running for this case.');
      return;
    }

    const traceId = getClientTraceId();
    const startedAt = performance.now();
    setParsingCaseId(insuranceCase.id);
    logClientEvent('insurance_admin_parse_enqueued_started', {
      traceId,
      caseId: insuranceCase.id,
      documentCount: insuranceCase.documentCount,
    });

    try {
      const response = await fetch(`/api/insurance/cases/${insuranceCase.id}/parse`, {
        method: 'POST',
        headers: { 'x-trace-id': traceId },
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to enqueue parse job.');
      }

      await loadCase();
      messageApi.success('Parse job added to queue.');
      logClientEvent('insurance_admin_parse_enqueued', {
        traceId,
        caseId: insuranceCase.id,
        jobId: payload.job?.id,
        durationMs: Math.round(performance.now() - startedAt),
      });
    } catch (parseError) {
      const message =
        parseError instanceof Error ? parseError.message : 'Failed to enqueue parse job.';
      messageApi.error(message);
      logClientEvent(
        'insurance_admin_parse_enqueue_failed',
        {
          traceId,
          caseId: insuranceCase.id,
          error: message,
          durationMs: Math.round(performance.now() - startedAt),
        },
        'error'
      );
    } finally {
      setParsingCaseId(null);
    }
  };

  const confirmCase = async () => {
    if (!insuranceCase) return;

    const traceId = getClientTraceId();
    const startedAt = performance.now();
    setConfirmingCaseId(insuranceCase.id);

    try {
      const values = await reviewForm.validateFields();
      const extraction = insuranceExtractionFromFormValues(values, selectedExtraction);
      const response = await fetch(`/api/insurance/cases/${insuranceCase.id}/review`, {
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
          'x-trace-id': traceId,
        },
        body: JSON.stringify({ extraction }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to confirm insurance case.');
      }

      setQueuedExtraction(extraction);
      await loadCase();
      messageApi.success('Confirmed case.');
      logClientEvent('insurance_admin_review_confirmed', {
        traceId,
        caseId: insuranceCase.id,
        durationMs: Math.round(performance.now() - startedAt),
      });
    } catch (confirmError) {
      const message =
        confirmError instanceof Error ? confirmError.message : 'Failed to confirm insurance case.';
      messageApi.error(message);
      logClientEvent(
        'insurance_admin_review_confirm_failed',
        {
          traceId,
          caseId: insuranceCase.id,
          error: message,
          durationMs: Math.round(performance.now() - startedAt),
        },
        'error'
      );
    } finally {
      setConfirmingCaseId(null);
    }
  };

  const saveShareSettings = async (settings: {
    enabled: boolean;
    allowedEmails: string[];
    fieldPaths: string[];
  }) => {
    if (!insuranceCase) return;

    const traceId = getClientTraceId();
    const startedAt = performance.now();
    setSavingShareCaseId(insuranceCase.id);

    try {
      const response = await fetch(`/api/insurance/cases/${insuranceCase.id}/share`, {
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
          'x-trace-id': traceId,
        },
        body: JSON.stringify(settings),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to save sharing settings.');
      }

      await loadCase();
      messageApi.success('Sharing settings saved.');
      logClientEvent('insurance_admin_share_settings_saved', {
        traceId,
        caseId: insuranceCase.id,
        enabled: settings.enabled,
        allowedEmailCount: settings.allowedEmails.length,
        fieldCount: settings.fieldPaths.length,
        durationMs: Math.round(performance.now() - startedAt),
      });
    } catch (shareError) {
      const message =
        shareError instanceof Error ? shareError.message : 'Failed to save sharing settings.';
      messageApi.error(message);
      logClientEvent(
        'insurance_admin_share_settings_save_failed',
        {
          traceId,
          caseId: insuranceCase.id,
          error: message,
          durationMs: Math.round(performance.now() - startedAt),
        },
        'error'
      );
    } finally {
      setSavingShareCaseId(null);
    }
  };

  return {
    confirmingCaseId,
    enqueueParse,
    error,
    insuranceCase,
    isLoading,
    hasActiveWorkflow,
    loadCase,
    parsingCaseId,
    reviewForm,
    savingShareCaseId,
    saveShareSettings,
    selectedExtraction,
    confirmCase,
  };
}
