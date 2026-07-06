'use client';

import { Button, Typography } from 'antd';
import { CloudDownloadOutlined, FileProtectOutlined } from '@ant-design/icons';
import {
  formatBytes,
  formatDateTime,
  insuranceDocumentLabels,
} from '@/features/insurance/presentation';
import type { AdminDocument } from '../_types';

const { Text } = Typography;

export function CaseDocuments(props: { documents: AdminDocument[] }) {
  return (
    <div className="insurance-documents-panel">
      <Text strong>Documents</Text>
      <div className="insurance-admin-documents">
        {props.documents.map((document) => (
          <div className="insurance-admin-document" key={document.id}>
            <div className="insurance-admin-document__icon">
              <FileProtectOutlined />
            </div>
            <div className="insurance-admin-document__body">
              <div>
                <Text strong>{insuranceDocumentLabels[document.type]}</Text>
                <Text type="secondary">{document.fileName}</Text>
              </div>
              <Text type="secondary">
                {document.mimeType} · {formatBytes(document.sizeBytes)} ·{' '}
                {formatDateTime(document.createdAt)}
              </Text>
              <Text type="secondary" className="insurance-admin-document__path">
                {document.blobPathname}
              </Text>
            </div>
            {document.downloadUrl ? (
              <a href={document.downloadUrl} target="_blank" rel="noreferrer">
                <Button icon={<CloudDownloadOutlined />}>Open</Button>
              </a>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
