import { GeminiDocumentParser } from './adapters/gemini-document-parser';
import {
  claimNextInsuranceParseJob,
  completeInsuranceParseJob,
  failInsuranceParseJob,
  getInsuranceCaseForParsing,
} from './adapters/prisma-case-repository';

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Failed to parse insurance case.';
}

export async function processNextInsuranceParseJob(input: {
  jobId?: string;
  apiKey: string;
  model?: string;
  onTiming?: (event: {
    phase: string;
    durationMs: number;
    jobId?: string;
    caseId?: string;
    documentId?: string;
    fileName?: string;
    mimeType?: string;
    sizeBytes?: number;
  }) => void | Promise<void>;
}) {
  const claimStartedAt = Date.now();
  const job = await claimNextInsuranceParseJob(input.jobId);

  if (!job) {
    return {
      processed: false,
      job: null,
      extraction: null,
    };
  }

  await input.onTiming?.({
    phase: 'claim_job',
    durationMs: Date.now() - claimStartedAt,
    jobId: job.id,
    caseId: job.caseId,
  });

  try {
    const loadCaseStartedAt = Date.now();
    const insuranceCase = await getInsuranceCaseForParsing(job.caseId);
    await input.onTiming?.({
      phase: 'load_case',
      durationMs: Date.now() - loadCaseStartedAt,
      jobId: job.id,
      caseId: job.caseId,
    });

    if (!insuranceCase) {
      throw new Error('Insurance case was not found.');
    }

    const parseableDocuments = insuranceCase.documents
      .filter((document) => document.blobPathname)
      .map((document) => ({
        id: document.id,
        type: document.type,
        fileName: document.fileName,
        mimeType: document.mimeType,
        sizeBytes: document.sizeBytes,
        blobPathname: document.blobPathname,
      }));

    if (parseableDocuments.length === 0) {
      throw new Error('No parseable documents found for this case.');
    }

    const parser = new GeminiDocumentParser({
      apiKey: input.apiKey,
      model: input.model,
      onTiming: (event) =>
        input.onTiming?.({
          ...event,
          jobId: job.id,
          caseId: job.caseId,
        }),
    });
    const parserStartedAt = Date.now();
    const extraction = await parser.parseInsuranceDocuments({
      caseId: job.caseId,
      documents: parseableDocuments,
    });
    await input.onTiming?.({
      phase: 'parser_total',
      durationMs: Date.now() - parserStartedAt,
      jobId: job.id,
      caseId: job.caseId,
    });

    const completeStartedAt = Date.now();
    await completeInsuranceParseJob({
      jobId: job.id,
      caseId: job.caseId,
      extraction,
    });
    await input.onTiming?.({
      phase: 'complete_job',
      durationMs: Date.now() - completeStartedAt,
      jobId: job.id,
      caseId: job.caseId,
    });

    return {
      processed: true,
      job: {
        id: job.id,
        caseId: job.caseId,
        status: 'COMPLETE',
      },
      extraction,
    };
  } catch (error) {
    const message = errorMessage(error);

    await failInsuranceParseJob({
      jobId: job.id,
      caseId: job.caseId,
      error: message,
    });

    throw new Error(message);
  }
}
