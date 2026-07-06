'use client';

import { Button, Typography } from 'antd';
import type { UploadCopy } from '../_copy';

const { Text } = Typography;

export function CurrentCaseStrip(props: {
  caseId: string | null;
  text: UploadCopy;
  onStartNewCase: () => void;
}) {
  if (!props.caseId) {
    return null;
  }

  return (
    <div className="insurance-case-strip">
      <div>
        <Text type="secondary">{props.text.currentCase}</Text>
        <Text strong>{props.caseId.slice(0, 8)}</Text>
      </div>
      <Button size="small" onClick={props.onStartNewCase}>
        {props.text.startNewCase}
      </Button>
    </div>
  );
}
