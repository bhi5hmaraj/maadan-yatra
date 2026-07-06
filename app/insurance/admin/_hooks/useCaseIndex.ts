'use client';

import React from 'react';
import type { MessageInstance } from 'antd/es/message/interface';
import { getClientTraceId, logClientEvent } from '@/lib/logging/client';
import type { AdminCaseListItem } from '../_types';

export function useCaseIndex(messageApi: MessageInstance) {
  const [cases, setCases] = React.useState<AdminCaseListItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [sharingCaseId, setSharingCaseId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const loadCases = React.useCallback(async () => {
    const traceId = getClientTraceId();
    const startedAt = performance.now();
    setIsLoading(true);
    setError(null);
    logClientEvent('insurance_admin_cases_load_started', { traceId });

    try {
      const response = await fetch('/api/insurance/cases', {
        headers: { 'x-trace-id': traceId },
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to load insurance cases.');
      }

      setCases(payload.cases ?? []);
      logClientEvent('insurance_admin_cases_load_completed', {
        traceId,
        caseCount: payload.cases?.length ?? 0,
        durationMs: Math.round(performance.now() - startedAt),
      });
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : 'Failed to load insurance cases.';
      setError(message);
      messageApi.error(message);
      logClientEvent(
        'insurance_admin_cases_load_failed',
        { traceId, error: message, durationMs: Math.round(performance.now() - startedAt) },
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  }, [messageApi]);

  React.useEffect(() => {
    logClientEvent('insurance_admin_index_viewed');
    void loadCases();
  }, [loadCases]);

  const toggleCaseSharing = async (insuranceCase: AdminCaseListItem) => {
    const traceId = getClientTraceId();
    const startedAt = performance.now();
    const enabled = !insuranceCase.shareEnabled;
    setSharingCaseId(insuranceCase.id);

    try {
      const response = await fetch(`/api/insurance/cases/${insuranceCase.id}/share`, {
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
          'x-trace-id': traceId,
        },
        body: JSON.stringify({ enabled }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to update sharing.');
      }

      setCases((currentCases) =>
        currentCases.map((currentCase) =>
          currentCase.id === insuranceCase.id
            ? {
                ...currentCase,
                shareEnabled: payload.shareEnabled,
                shareUpdatedAt: payload.shareUpdatedAt,
              }
            : currentCase
        )
      );
      messageApi.success(enabled ? 'Case added to shared view.' : 'Case removed from shared view.');
      logClientEvent('insurance_admin_case_share_toggled', {
        traceId,
        caseId: insuranceCase.id,
        enabled,
        durationMs: Math.round(performance.now() - startedAt),
      });
    } catch (toggleError) {
      const message =
        toggleError instanceof Error ? toggleError.message : 'Failed to update sharing.';
      messageApi.error(message);
      logClientEvent(
        'insurance_admin_case_share_toggle_failed',
        {
          traceId,
          caseId: insuranceCase.id,
          enabled,
          error: message,
          durationMs: Math.round(performance.now() - startedAt),
        },
        'error'
      );
    } finally {
      setSharingCaseId(null);
    }
  };

  return {
    cases,
    error,
    isLoading,
    loadCases,
    sharingCaseId,
    toggleCaseSharing,
  };
}
