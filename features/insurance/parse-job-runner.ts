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
}) {
  const job = await claimNextInsuranceParseJob(input.jobId);

  if (!job) {
    return {
      processed: false,
      job: null,
      extraction: null,
    };
  }

  try {
    const insuranceCase = await getInsuranceCaseForParsing(job.caseId);

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
    });
    const extraction = await parser.parseInsuranceDocuments({
      caseId: job.caseId,
      documents: parseableDocuments,
    });

    await completeInsuranceParseJob({
      jobId: job.id,
      caseId: job.caseId,
      extraction,
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
