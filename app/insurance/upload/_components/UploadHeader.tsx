'use client';

import Link from 'next/link';
import { Button, Segmented, Typography } from 'antd';
import type { Language } from '../_types';
import type { UploadCopy } from '../_copy';

const { Title } = Typography;

export function UploadHeader(props: {
  language: Language;
  text: UploadCopy;
  onLanguageChange: (language: Language) => void;
}) {
  return (
    <div className="insurance-upload-page__header">
      <Title level={2}>{props.text.title}</Title>
      <div className="insurance-upload-page__header-actions">
        <Link href="/insurance/admin">
          <Button size="small">Admin</Button>
        </Link>
        <Segmented<Language>
          aria-label={props.text.language}
          value={props.language}
          onChange={props.onLanguageChange}
          options={[
            { label: 'English', value: 'en' },
            { label: 'தமிழ்', value: 'ta' },
          ]}
        />
      </div>
    </div>
  );
}
