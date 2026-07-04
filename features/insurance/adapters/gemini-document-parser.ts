import {
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

  return new File([fileBody], document.fileName, {
    type: document.mimeType,
  });
}

export class GeminiDocumentParser implements DocumentParser {
  constructor(
    private readonly options: {
      apiKey: string;
      model?: string;
    }
  ) {}

  async parseInsuranceDocuments(input: InsuranceParserInput) {
    const ai = new GoogleGenAI({ apiKey: this.options.apiKey });
    const uploadedFileNames: string[] = [];

    try {
      const uploadedParts = [];

      for (const document of input.documents) {
        const file = await downloadParserDocument(document);
        let uploadedFile;

        try {
          uploadedFile = await ai.files.upload({
            file,
            config: {
              mimeType: document.mimeType,
              displayName: document.fileName,
            },
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
