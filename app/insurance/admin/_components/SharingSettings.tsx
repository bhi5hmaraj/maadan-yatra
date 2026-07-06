'use client';

import React from 'react';
import { Alert, Button, Card, Checkbox, Input, Switch, Typography } from 'antd';
import { LinkOutlined, SaveOutlined } from '@ant-design/icons';
import {
  defaultInsuranceShareFieldPaths,
  insuranceShareFieldCatalog,
} from '@/features/insurance/share-view';
import type { AdminCase } from '../_types';

const { Text } = Typography;

function emailsToText(emails: string[]) {
  return emails.join('\n');
}

function textToEmails(value: string) {
  return Array.from(
    new Set(
      value
        .split(/[\n,]/)
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean)
    )
  );
}

export function SharingSettings(props: {
  insuranceCase: AdminCase;
  savingCaseId: string | null;
  onSave: (settings: {
    enabled: boolean;
    allowedEmails: string[];
    fieldPaths: string[];
  }) => void;
}) {
  const { insuranceCase, savingCaseId, onSave } = props;
  const canShare = Boolean(insuranceCase.confirmedExtraction);
  const [enabled, setEnabled] = React.useState(insuranceCase.shareEnabled);
  const [emails, setEmails] = React.useState(
    emailsToText(insuranceCase.shareAllowedEmails)
  );
  const [fieldPaths, setFieldPaths] = React.useState<string[]>(
    insuranceCase.shareFieldPaths.length
      ? insuranceCase.shareFieldPaths
      : defaultInsuranceShareFieldPaths
  );
  const shareUrl = `/insurance/share?caseId=${insuranceCase.id}`;

  React.useEffect(() => {
    setEnabled(insuranceCase.shareEnabled);
    setEmails(emailsToText(insuranceCase.shareAllowedEmails));
    setFieldPaths(
      insuranceCase.shareFieldPaths.length
        ? insuranceCase.shareFieldPaths
        : defaultInsuranceShareFieldPaths
    );
  }, [
    insuranceCase.id,
    insuranceCase.shareAllowedEmails,
    insuranceCase.shareEnabled,
    insuranceCase.shareFieldPaths,
  ]);

  return (
    <Card className="insurance-share-settings-card" title="Sharing settings">
      <div className="insurance-share-settings">
        {!canShare ? (
          <Alert
            type="info"
            showIcon
            message="Confirm the case before sharing"
            description="Only verified fields from the confirmed extraction can be shared."
          />
        ) : null}

        <div className="insurance-share-settings__row">
          <div>
            <Text strong>Enable provider access</Text>
            <Text type="secondary">Allowed emails can view this case after Clerk sign-in.</Text>
          </div>
          <Switch checked={enabled} disabled={!canShare} onChange={setEnabled} />
        </div>

        <label className="insurance-share-settings__field">
          <Text strong>Allowed emails</Text>
          <Input.TextArea
            rows={3}
            value={emails}
            disabled={!canShare}
            placeholder="provider@example.com"
            onChange={(event) => setEmails(event.target.value)}
          />
        </label>

        <div className="insurance-share-settings__field">
          <Text strong>Fields to expose</Text>
          <Checkbox.Group
            value={fieldPaths}
            disabled={!canShare}
            onChange={(values) => setFieldPaths(values.map(String))}
          >
            <div className="insurance-share-field-options">
              {insuranceShareFieldCatalog.map((field) => (
                <Checkbox key={field.path} value={field.path}>
                  {field.groupLabel}: {field.label}
                </Checkbox>
              ))}
            </div>
          </Checkbox.Group>
        </div>

        <div className="insurance-share-settings__actions">
          <Button
            icon={<SaveOutlined />}
            type="primary"
            disabled={!canShare}
            loading={savingCaseId === insuranceCase.id}
            onClick={() =>
              onSave({
                enabled,
                allowedEmails: textToEmails(emails),
                fieldPaths,
              })
            }
          >
            Save sharing
          </Button>
          <Button
            icon={<LinkOutlined />}
            disabled={!canShare || !insuranceCase.shareEnabled}
            href={shareUrl}
            target="_blank"
          >
            Open shared view
          </Button>
        </div>
      </div>
    </Card>
  );
}
