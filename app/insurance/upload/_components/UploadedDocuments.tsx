'use client';

import { Typography } from 'antd';
import { formatBytes } from '@/features/insurance/presentation';
import type { UploadCopy } from '../_copy';
import type { UploadedDocument } from '../_types';

const { Text } = Typography;

export function UploadedDocuments(props: {
  documents: UploadedDocument[];
  text: UploadCopy;
}) {
  if (props.documents.length === 0) {
    return null;
  }

  return (
    <div className="insurance-uploaded-docs">
      <Text strong>{props.text.uploadedDocuments}</Text>
      <div className="insurance-uploaded-docs__list">
        {props.documents.map((document) => (
          <div className="insurance-uploaded-doc" key={document.documentId}>
            <span>{props.text.documents[document.type]}</span>
            <Text type="secondary">
              {document.fileName} ({formatBytes(document.sizeBytes)})
            </Text>
          </div>
        ))}
      </div>
    </div>
  );
}
