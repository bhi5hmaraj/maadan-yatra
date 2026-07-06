'use client';

import React from 'react';
import { Alert, Button, Divider, Form, Input, InputNumber, Typography } from 'antd';
import type { FormInstance } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import {
  insuranceExtractionFormGroups,
  type InsuranceExtraction,
} from '@/features/insurance/parser';
import { formatDateTime } from '@/features/insurance/presentation';
import type { AdminCase } from '../_types';

const { Text } = Typography;

export function ExtractionReview(props: {
  confirmingCaseId: string | null;
  form: FormInstance;
  insuranceCase: AdminCase;
  selectedExtraction: InsuranceExtraction | null;
  onConfirm: () => void;
}) {
  const { confirmingCaseId, form, insuranceCase, selectedExtraction, onConfirm } = props;

  return (
    <div className="insurance-extraction-panel">
      <div className="insurance-extraction-panel__header">
        <div>
          <Text strong>Review extracted content</Text>
          <Text type="secondary">
            {insuranceCase.confirmedAt
              ? `Confirmed ${formatDateTime(insuranceCase.confirmedAt)}`
              : insuranceCase.parsedAt
                ? `Parsed ${formatDateTime(insuranceCase.parsedAt)}`
                : 'Run parse to prefill these fields'}
          </Text>
        </div>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          disabled={!selectedExtraction}
          loading={confirmingCaseId === insuranceCase.id}
          onClick={onConfirm}
        >
          Confirm
        </Button>
      </div>

      {!selectedExtraction ? (
        <Alert
          type="info"
          showIcon
          message="No parsed data yet"
          description="Queue parsing first, then review and confirm the extracted values."
        />
      ) : null}

      <Form
        form={form}
        layout="vertical"
        disabled={!selectedExtraction || confirmingCaseId === insuranceCase.id}
      >
        {insuranceExtractionFormGroups.map((group) => (
          <React.Fragment key={group.key}>
            <Divider orientation="left">{group.label}</Divider>
            <div className="insurance-review-grid">
              {group.fields.map(([key, label, inputType]) => (
                <Form.Item key={key} name={[group.key, key]} label={label}>
                  {inputType === 'number' ? (
                    <InputNumber min={0} style={{ width: '100%' }} />
                  ) : (
                    <Input />
                  )}
                </Form.Item>
              ))}
            </div>
          </React.Fragment>
        ))}

        <Form.Item name="missingFieldsText" label="Missing fields">
          <Input />
        </Form.Item>
        <Form.Item name="notes" label="Notes">
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
    </div>
  );
}
