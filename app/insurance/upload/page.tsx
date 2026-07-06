'use client';

import { Alert, Button, Card, Form, Input, message, Progress, Typography } from 'antd';
import { CloudUploadOutlined } from '@ant-design/icons';
import { CurrentCaseStrip } from './_components/CurrentCaseStrip';
import { DocumentPicker } from './_components/DocumentPicker';
import { DraftDocuments } from './_components/DraftDocuments';
import { UploadedDocuments } from './_components/UploadedDocuments';
import { UploadHeader } from './_components/UploadHeader';
import { useInsuranceUpload } from './_hooks/useInsuranceUpload';
import type { UploadFormValues } from './_types';

const { TextArea } = Input;
const { Text } = Typography;

export default function InsuranceUploadPage() {
  const [form] = Form.useForm<UploadFormValues>();
  const [messageApi, contextHolder] = message.useMessage();
  const upload = useInsuranceUpload({ form, messageApi });

  return (
    <div className="insurance-upload-page" lang={upload.language}>
      {contextHolder}
      <main className="insurance-upload-page__main">
        <UploadHeader
          language={upload.language}
          text={upload.text}
          onLanguageChange={upload.setLanguage}
        />
        <CurrentCaseStrip
          caseId={upload.currentCaseId}
          text={upload.text}
          onStartNewCase={upload.startNewCase}
        />

        <Card className="insurance-upload-card" variant="borderless">
          <Form form={form} layout="vertical" onFinish={upload.handleFinish}>
            <Form.Item label={upload.text.customerName} name="customerName">
              <Input placeholder={upload.text.optional} autoComplete="name" />
            </Form.Item>

            <DocumentPicker
              fileInputRef={upload.fileInputRef}
              text={upload.text}
              uploadMode={upload.uploadMode}
              onFileChange={upload.handleFileChange}
              onModeChange={upload.setMode}
            />

            <DraftDocuments
              documents={upload.draftDocuments}
              text={upload.text}
              onRemove={upload.removeDraftDocument}
              onTypeChange={upload.updateDraftDocumentType}
            />

            <Form.Item label={upload.text.notes} name="notes">
              <TextArea rows={3} placeholder={upload.text.optional} />
            </Form.Item>

            <div className="insurance-upload-actions">
              <Button
                type="primary"
                htmlType="submit"
                icon={<CloudUploadOutlined />}
                loading={upload.isSubmitting}
                block
              >
                {upload.text.upload}
              </Button>
              {upload.uploadProgress ? (
                <div className="insurance-upload-progress">
                  <div className="insurance-upload-progress__meta">
                    <Text strong>
                      {upload.text.uploadProgress(
                        upload.uploadProgress.current,
                        upload.uploadProgress.total,
                        upload.uploadProgress.percent
                      )}
                    </Text>
                    <Text type="secondary" ellipsis>
                      {upload.uploadProgress.fileName}
                    </Text>
                  </div>
                  <Progress
                    percent={upload.uploadProgress.percent}
                    size="small"
                    status="active"
                    showInfo={false}
                  />
                </div>
              ) : null}
            </div>
          </Form>

          <UploadedDocuments documents={upload.uploadedDocuments} text={upload.text} />
        </Card>

        {upload.result ? (
          <Alert
            type="success"
            showIcon
            message={upload.text.uploaded}
            description={upload.text.uploadedDescription(
              upload.result.caseId,
              upload.uploadedDocuments.length
            )}
          />
        ) : null}
      </main>
    </div>
  );
}
