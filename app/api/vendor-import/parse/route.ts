import {
  createPartFromUri,
  createUserContent,
  GoogleGenAI,
} from '@google/genai';
import { NextResponse } from 'next/server';
import { zodToJsonSchema } from 'zod-to-json-schema';
import {
  quotationIRExtractionSchema,
  vendorDocumentSchema,
} from '@/schemas';
import { normalizeExtractedQuotationIR } from '@/utils/quotation-ir';

export const runtime = 'nodejs';

const model = process.env.GEMINI_MODEL ?? 'gemini-flash-latest';
const geminiExtractionSchema = zodToJsonSchema(
  quotationIRExtractionSchema,
  'vendor_quotation_ir_extraction'
);

function buildPrompt(fileName: string) {
  return [
    'You are a careful travel-quotation extraction assistant.',
    'Read the uploaded vendor PDF and extract it into the provided schema.',
    'Return only fields present in the document.',
    'Use null for missing scalar fields and [] for missing lists.',
    'Preserve vendor wording for inclusions, exclusions, notes, terms, and itinerary descriptions.',
    'Do not invent customer details, pricing, dates, or hotel data.',
    `Vendor file name: ${fileName}`,
  ].join('\n');
}

function getGeminiResponseSchema() {
  if (
    'definitions' in geminiExtractionSchema &&
    geminiExtractionSchema.definitions
  ) {
    return geminiExtractionSchema.definitions.vendor_quotation_ir_extraction;
  }

  return geminiExtractionSchema;
}

export async function POST(request: Request) {
  let uploadedFileName: string | undefined;

  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Missing GEMINI_API_KEY on the server.' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: 'PDF file is required.' },
        { status: 400 }
      );
    }

    if (file.type && file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF uploads are supported.' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const uploadedFile = await ai.files.upload({
      file,
      config: {
        mimeType: file.type || 'application/pdf',
        displayName: file.name,
      },
    });

    uploadedFileName = uploadedFile.name ?? undefined;

    if (!uploadedFile.uri || !uploadedFile.mimeType) {
      throw new Error('Gemini file upload did not return a usable file reference.');
    }

    const response = await ai.models.generateContent({
      model,
      contents: createUserContent([
        createPartFromUri(uploadedFile.uri, uploadedFile.mimeType),
        buildPrompt(file.name),
      ]),
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: getGeminiResponseSchema(),
      },
    });

    const parsedText = response.text?.trim() || '';

    if (!parsedText) {
      return NextResponse.json(
        { error: 'Gemini did not return structured output for this document.' },
        { status: 422 }
      );
    }

    const extracted = quotationIRExtractionSchema.parse(JSON.parse(parsedText));

    const vendorDocument = vendorDocumentSchema.parse({
      id: crypto.randomUUID(),
      sourceType: 'pdf',
      fileName: file.name,
      mimeType: file.type || 'application/pdf',
      uploadedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    const ir = normalizeExtractedQuotationIR(extracted, {
      vendorDocumentId: vendorDocument.id,
    });

    return NextResponse.json({
      vendorDocument,
      ir,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to parse vendor PDF.';

    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    if (uploadedFileName && process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        await ai.files.delete({ name: uploadedFileName });
      } catch {
        // Best-effort cleanup. Temporary Gemini file expiry is acceptable.
      }
    }
  }
}
