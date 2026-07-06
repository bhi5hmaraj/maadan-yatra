'use client';

import React from 'react';
import type { MessageInstance } from 'antd/es/message/interface';
import { getClientTraceId, logClientEvent } from '@/lib/logging/client';
import type { AdminQueueItem } from '../_types';

export function useInsuranceQueue(messageApi: MessageInstance) {
  const [jobs, setJobs] = React.useState<AdminQueueItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [retryingJobId, setRetryingJobId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const hasActiveJobs = jobs.some((job) => job.status === 'QUEUED' || job.status === 'RUNNING');

  const loadJobs = React.useCallback(async (options: { silent?: boolean } = {}) => {
    const traceId = getClientTraceId();
    const startedAt = performance.now();
    if (!options.silent) {
      setIsLoading(true);
      setError(null);
    }

    try {
      const response = await fetch('/api/insurance/parse-jobs', {
        headers: { 'x-trace-id': traceId },
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to load queue.');
      }

      setJobs(payload.jobs ?? []);
      if (!options.silent) {
        logClientEvent('insurance_queue_loaded', {
          traceId,
          jobCount: payload.jobs?.length ?? 0,
          durationMs: Math.round(performance.now() - startedAt),
        });
      }
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Failed to load queue.';
      setError(message);
      messageApi.error(message);
      if (!options.silent) {
        logClientEvent(
          'insurance_queue_load_failed',
          { traceId, error: message, durationMs: Math.round(performance.now() - startedAt) },
          'error'
        );
      }
    } finally {
      if (!options.silent) {
        setIsLoading(false);
      }
    }
  }, [messageApi]);

  React.useEffect(() => {
    logClientEvent('insurance_queue_viewed');
    void loadJobs();
  }, [loadJobs]);

  React.useEffect(() => {
    if (!hasActiveJobs && !retryingJobId) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void loadJobs({ silent: true });
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [hasActiveJobs, loadJobs, retryingJobId]);

  const startProcessor = async (jobId: string, traceId: string) => {
    const startedAt = performance.now();

    try {
      const response = await fetch('/api/insurance/parse-jobs/process', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-trace-id': traceId,
        },
        body: JSON.stringify({ jobId }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to run workflow retry.');
      }

      logClientEvent('insurance_workflow_retry_processed', {
        traceId,
        jobId: payload.job?.id ?? jobId,
        processed: payload.processed,
        durationMs: Math.round(performance.now() - startedAt),
      });
      await loadJobs({ silent: true });
    } catch (processError) {
      const message =
        processError instanceof Error ? processError.message : 'Failed to run workflow retry.';
      messageApi.error(message);
      logClientEvent(
        'insurance_workflow_retry_process_failed',
        { traceId, jobId, error: message, durationMs: Math.round(performance.now() - startedAt) },
        'error'
      );
      await loadJobs({ silent: true });
    }
  };

  const retryJob = async (job: AdminQueueItem) => {
    const traceId = getClientTraceId();
    const startedAt = performance.now();
    setRetryingJobId(job.id);

    try {
      const response = await fetch(`/api/insurance/cases/${job.case.id}/parse`, {
        method: 'POST',
        headers: {
          'x-trace-id': traceId,
        },
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to retry workflow job.');
      }

      messageApi.success('Retry queued.');
      await loadJobs();
      logClientEvent('insurance_workflow_job_retry_queued', {
        traceId,
        failedJobId: job.id,
        retryJobId: payload.job?.id,
        caseId: job.case.id,
        durationMs: Math.round(performance.now() - startedAt),
      });

      if (payload.job?.id) {
        void startProcessor(payload.job.id, traceId);
      }
    } catch (processError) {
      const message =
        processError instanceof Error ? processError.message : 'Failed to retry workflow job.';
      messageApi.error(message);
      logClientEvent(
        'insurance_workflow_job_retry_failed',
        {
          traceId,
          failedJobId: job.id,
          caseId: job.case.id,
          error: message,
          durationMs: Math.round(performance.now() - startedAt),
        },
        'error'
      );
    } finally {
      setRetryingJobId(null);
    }
  };

  return {
    error,
    isLoading,
    jobs,
    hasActiveJobs,
    loadJobs,
    retryingJobId,
    retryJob,
  };
}
