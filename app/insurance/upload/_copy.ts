import type { InsuranceDocumentType } from '@/features/insurance/domain';
import { maxServerUploadBytes } from '@/features/insurance/domain';
import { formatBytes } from '@/features/insurance/presentation';
import type { Language } from './_types';

export const uploadCopy = {
  en: {
    title: 'Insurance Upload',
    language: 'Language',
    customerName: 'Customer name',
    optional: 'Optional',
    documentType: 'Document type',
    documentFile: 'Document',
    takePhoto: 'Take photo',
    chooseFile: 'Choose files',
    notes: 'Notes',
    currentCase: 'Current case',
    startNewCase: 'Start new case',
    documentsToUpload: 'Documents to upload',
    noDocuments: 'No documents added yet',
    uploadedDocuments: 'Uploaded documents',
    remove: 'Remove',
    sizeHint: `PDF, JPEG, PNG, WebP, HEIC, or HEIF up to ${formatBytes(maxServerUploadBytes)}`,
    requiredFile: 'Add at least one document before submitting.',
    tooLarge: 'Document must be 10 MB or smaller.',
    upload: 'Upload all documents',
    uploadProgress: (current: number, total: number, percent: number) =>
      `Uploading ${current} of ${total} - ${percent}%`,
    uploaded: 'Upload saved',
    uploadedDescription: (caseId: string, count: number) =>
      `Case ${caseId} has ${count} document${count === 1 ? '' : 's'} attached.`,
    uploadFailed: 'Upload failed.',
    uploadSuccess: 'Documents uploaded.',
    parseQueued: 'Documents uploaded. Parsing started.',
    parseFailed: 'Documents uploaded, but parsing failed. Check the workflow queue.',
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
    documentFile: 'ஆவணம்',
    takePhoto: 'புகைப்படம் எடு',
    chooseFile: 'கோப்புகளை தேர்வு செய்',
    notes: 'குறிப்புகள்',
    currentCase: 'தற்போதைய வழக்கு',
    startNewCase: 'புதிய வழக்கு',
    documentsToUpload: 'பதிவேற்ற வேண்டிய ஆவணங்கள்',
    noDocuments: 'இன்னும் ஆவணங்கள் சேர்க்கப்படவில்லை',
    uploadedDocuments: 'பதிவேற்றிய ஆவணங்கள்',
    remove: 'நீக்கு',
    sizeHint: `PDF, JPEG, PNG, WebP, HEIC, அல்லது HEIF ${formatBytes(maxServerUploadBytes)} வரை`,
    requiredFile: 'குறைந்தது ஒரு ஆவணத்தை சேர்க்கவும்.',
    tooLarge: 'ஆவணம் 10 MB அல்லது அதற்கு குறைவாக இருக்க வேண்டும்.',
    upload: 'அனைத்து ஆவணங்களையும் பதிவேற்று',
    uploadProgress: (current: number, total: number, percent: number) =>
      `${total} ஆவணங்களில் ${current} பதிவேற்றம் - ${percent}%`,
    uploaded: 'பதிவேற்றம் சேமிக்கப்பட்டது',
    uploadedDescription: (caseId: string, count: number) =>
      `வழக்கு ${caseId} - ${count} ஆவணம் இணைக்கப்பட்டது.`,
    uploadFailed: 'பதிவேற்றம் தோல்வியடைந்தது.',
    uploadSuccess: 'ஆவணங்கள் பதிவேற்றப்பட்டன.',
    parseQueued: 'ஆவணங்கள் பதிவேற்றப்பட்டன. பகுப்பாய்வு தொடங்கியது.',
    parseFailed: 'ஆவணங்கள் பதிவேற்றப்பட்டன, ஆனால் பகுப்பாய்வு தோல்வியடைந்தது. பணிப்பாய்வு வரிசையை பார்க்கவும்.',
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
  documentFile: string;
  takePhoto: string;
  chooseFile: string;
  notes: string;
  currentCase: string;
  startNewCase: string;
  documentsToUpload: string;
  noDocuments: string;
  uploadedDocuments: string;
  remove: string;
  sizeHint: string;
  requiredFile: string;
  tooLarge: string;
  upload: string;
  uploadProgress: (current: number, total: number, percent: number) => string;
  uploaded: string;
  uploadedDescription: (caseId: string, count: number) => string;
  uploadFailed: string;
  uploadSuccess: string;
  parseQueued: string;
  parseFailed: string;
  documents: Record<InsuranceDocumentType, string>;
}>;

export type UploadCopy = (typeof uploadCopy)[Language];
