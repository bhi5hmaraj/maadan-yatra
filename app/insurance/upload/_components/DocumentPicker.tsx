'use client';

import React from 'react';
import { Button, Form, Segmented, Typography } from 'antd';
import { CameraOutlined, FolderOpenOutlined } from '@ant-design/icons';
import {
  allowedInsuranceUploadMimeTypes,
  insurancePhotoUploadMimeTypes,
} from '@/features/insurance/domain';
import type { UploadCopy } from '../_copy';
import type { UploadMode } from '../_types';

const { Text } = Typography;

export function DocumentPicker(props: {
  fileInputRef: React.RefObject<HTMLInputElement>;
  text: UploadCopy;
  uploadMode: UploadMode;
  onFileChange: React.ChangeEventHandler<HTMLInputElement>;
  onModeChange: (mode: UploadMode) => void;
}) {
  const { fileInputRef, text, uploadMode, onFileChange, onModeChange } = props;

  return (
    <Form.Item label={text.documentFile} className="insurance-photo-field">
      <div className="insurance-photo-box">
        <Segmented<UploadMode>
          block
          className="insurance-upload-mode"
          value={uploadMode}
          onChange={onModeChange}
          options={[
            { label: text.takePhoto, value: 'camera', icon: <CameraOutlined /> },
            { label: text.chooseFile, value: 'library', icon: <FolderOpenOutlined /> },
          ]}
        />

        <Button
          className="insurance-photo-button"
          type="primary"
          icon={uploadMode === 'camera' ? <CameraOutlined /> : <FolderOpenOutlined />}
          onClick={() => fileInputRef.current?.click()}
          block
        >
          {uploadMode === 'camera' ? text.takePhoto : text.chooseFile}
        </Button>

        <Text type="secondary" className="insurance-file-hint">
          {text.sizeHint}
        </Text>
      </div>

      <input
        key={uploadMode}
        ref={fileInputRef}
        type="file"
        accept={
          uploadMode === 'camera'
            ? insurancePhotoUploadMimeTypes.join(',')
            : allowedInsuranceUploadMimeTypes.join(',')
        }
        capture={uploadMode === 'camera' ? 'environment' : undefined}
        multiple
        onChange={onFileChange}
        style={{ display: 'none' }}
      />
    </Form.Item>
  );
}
