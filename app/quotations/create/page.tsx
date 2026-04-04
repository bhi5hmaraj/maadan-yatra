'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { message } from 'antd';
import { QuotationEditor } from '@/components/quotation/QuotationEditor';
import type { Quotation } from '@/types/quotation';
import { localStorageDataProvider } from '@/providers/localStorageDataProvider';

export default function CreateQuotationPage() {
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();
  const [isSaving, setIsSaving] = React.useState(false);

  const handleSave = async (quotation: Omit<Quotation, 'id' | 'createdAt' | 'updatedAt'>) => {
    setIsSaving(true);
    try {
      const result = await localStorageDataProvider.create<Quotation>({
        resource: 'quotations',
        variables: quotation,
      });

      messageApi.success('Quotation saved.');
      router.replace(`/quotations/${result.data.id}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {contextHolder}
      <QuotationEditor mode="create" onSave={handleSave} saving={isSaving} />
    </>
  );
}
