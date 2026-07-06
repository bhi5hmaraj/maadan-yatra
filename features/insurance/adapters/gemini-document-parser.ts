import {
  createPartFromBase64,
  createPartFromUri,
  createUserContent,
  GoogleGenAI,
} from '@google/genai';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { readPrivateInsuranceObject } from './vercel-blob-storage';
import {
  insuranceExtractionSchema,
  type DocumentParser,
  type InsuranceParserDocument,
  type InsuranceParserInput,
} from '../parser';

const geminiInsuranceSchema = zodToJsonSchema(
  insuranceExtractionSchema,
  'insurance_extraction'
);

function getGeminiResponseSchema() {
  if (
    'definitions' in geminiInsuranceSchema &&
    geminiInsuranceSchema.definitions
  ) {
    return geminiInsuranceSchema.definitions.insurance_extraction;
  }

  return geminiInsuranceSchema;
}

function buildPrompt(input: InsuranceParserInput) {
  const documents = input.documents
    .map((document) => `- ${document.type}: ${document.fileName} (${document.mimeType})`)
    .join('\n');

  return [
    'You are a careful insurance intake extraction assistant.',
    'Extract only information visible in the supplied Aadhaar, invoice, purchase slip, or supporting documents.',
    'Return JSON that exactly matches the response schema.',
    'Use null for missing scalar fields and [] for missing lists.',
    'Do not guess values that are not visible.',
    'If Aadhaar is present, extract the full number only if clearly visible; otherwise extract last 4 if visible.',
    'Use ISO-like dates when possible, but preserve visible date text if ambiguous.',
    `Case ID: ${input.caseId}`,
    'Documents:',
    documents,
  ].join('\n');
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

async function downloadParserDocument(document: InsuranceParserDocument) {
  let bytes: Uint8Array;

  try {
    ({ bytes } = await readPrivateInsuranceObject({
      pathname: document.blobPathname,
    }));
  } catch (error) {
    throw new Error(
      `Could not read ${document.fileName} from Blob for parsing: ${errorMessage(error)}`
    );
  }

  const fileBody = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  ) as ArrayBuffer;

  return {
    bytes,
    file: new File([fileBody], document.fileName, {
      type: document.mimeType,
    }),
  };
}

function canInlineDocument(document: InsuranceParserDocument) {
  return document.mimeType.startsWith('image/');
}

function toBase64(bytes: Uint8Array) {
  return Buffer.from(bytes).toString('base64');
}

export class GeminiDocumentParser implements DocumentParser {
  constructor(
    private readonly options: {
      apiKey: string;
      model?: string;
      onTiming?: (event: {
        phase: string;
        durationMs: number;
        documentId?: string;
        fileName?: string;
        mimeType?: string;
        sizeBytes?: number;
      }) => void | Promise<void>;
    }
  ) {}

  async parseInsuranceDocuments(input: InsuranceParserInput) {
    const ai = new GoogleGenAI({ apiKey: this.options.apiKey });
    const uploadedFileNames: string[] = [];

    try {
      const uploadedParts = [];

      for (const document of input.documents) {
        const blobReadStartedAt = Date.now();
        const { bytes, file } = await downloadParserDocument(document);
        await this.options.onTiming?.({
          phase: 'blob_read',
          durationMs: Date.now() - blobReadStartedAt,
          documentId: document.id,
          fileName: document.fileName,
          mimeType: document.mimeType,
          sizeBytes: document.sizeBytes,
        });

        if (canInlineDocument(document)) {
          const inlineStartedAt = Date.now();
          uploadedParts.push(createPartFromBase64(toBase64(bytes), document.mimeType));
          await this.options.onTiming?.({
            phase: 'gemini_inline_file',
            durationMs: Date.now() - inlineStartedAt,
            documentId: document.id,
            fileName: document.fileName,
            mimeType: document.mimeType,
            sizeBytes: document.sizeBytes,
          });
          continue;
        }

        let uploadedFile;

        try {
          const geminiUploadStartedAt = Date.now();
          uploadedFile = await ai.files.upload({
            file,
            config: {
              mimeType: document.mimeType,
              displayName: document.fileName,
            },
          });
          await this.options.onTiming?.({
            phase: 'gemini_file_upload',
            durationMs: Date.now() - geminiUploadStartedAt,
            documentId: document.id,
            fileName: document.fileName,
            mimeType: document.mimeType,
            sizeBytes: document.sizeBytes,
          });
        } catch (error) {
          throw new Error(
            `Could not upload ${document.fileName} to Gemini: ${errorMessage(error)}`
          );
        }

        if (!uploadedFile.uri || !uploadedFile.mimeType) {
          throw new Error(`Gemini file upload failed for ${document.fileName}.`);
        }

        if (uploadedFile.name) {
          uploadedFileNames.push(uploadedFile.name);
        }

        uploadedParts.push(createPartFromUri(uploadedFile.uri, uploadedFile.mimeType));
      }

      let response;

      try {
        const geminiGenerateStartedAt = Date.now();
        response = await ai.models.generateContent({
          model: this.options.model ?? 'gemini-flash-latest',
          contents: createUserContent([
            ...uploadedParts,
            buildPrompt(input),
          ]),
          config: {
            responseMimeType: 'application/json',
            responseJsonSchema: getGeminiResponseSchema(),
          },
        });
        await this.options.onTiming?.({
          phase: 'gemini_generate',
          durationMs: Date.now() - geminiGenerateStartedAt,
        });
      } catch (error) {
        throw new Error(`Gemini extraction failed: ${errorMessage(error)}`);
      }

      const parsedText = response.text?.trim() || '';

      if (!parsedText) {
        throw new Error('Gemini did not return structured output for this case.');
      }

      return insuranceExtractionSchema.parse(JSON.parse(parsedText));
    } finally {
      await Promise.allSettled(
        uploadedFileNames.map((name) => ai.files.delete({ name }))
      );
    }
  }
}
