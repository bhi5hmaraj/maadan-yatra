'use client';

import { Button, Select, Typography } from 'antd';
import { DeleteOutlined, FileDoneOutlined } from '@ant-design/icons';
import type { InsuranceDocumentType } from '@/features/insurance/domain';
import { insuranceDocumentTypes } from '@/features/insurance/domain';
import { formatBytes } from '@/features/insurance/presentation';
import type { UploadCopy } from '../_copy';
import type { DraftDocument } from '../_types';

const { Text } = Typography;

export function DraftDocuments(props: {
  documents: DraftDocument[];
  text: UploadCopy;
  onRemove: (id: string) => void;
  onTypeChange: (id: string, type: InsuranceDocumentType) => void;
}) {
  const { documents, text, onRemove, onTypeChange } = props;
  const documentTypeOptions = insuranceDocumentTypes.map((type) => ({
    value: type,
    label: text.documents[type],
  }));

  return (
    <div className="insurance-draft-docs">
      <Text strong>{text.documentsToUpload}</Text>
      {documents.length === 0 ? (
        <div className="insurance-draft-empty">
          <Text type="secondary">{text.noDocuments}</Text>
        </div>
      ) : (
        <div className="insurance-draft-docs__list">
          {documents.map((document, index) => (
            <div className="insurance-draft-doc" key={document.id}>
              <div className="insurance-draft-doc__meta">
                <FileDoneOutlined />
                <div>
                  <Text strong>{document.file.name}</Text>
                  <Text type="secondary">{formatBytes(document.file.size)}</Text>
                </div>
              </div>
              <div className="insurance-draft-doc__controls">
                <Select
                  aria-label={`${text.documentType} ${index + 1}`}
                  value={document.type}
                  options={documentTypeOptions}
                  onChange={(value) => onTypeChange(document.id, value)}
                />
                <Button
                  aria-label={text.remove}
                  icon={<DeleteOutlined />}
                  onClick={() => onRemove(document.id)}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
