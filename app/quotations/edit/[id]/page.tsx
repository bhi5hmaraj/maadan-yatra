'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Alert, Skeleton, message } from 'antd';
import { useOne } from '@refinedev/core';
import { QuotationEditor } from '@/components/quotation/QuotationEditor';
import type { Quotation } from '@/types/quotation';
import { localStorageDataProvider } from '@/providers/localStorageDataProvider';

export default function EditQuotationPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();
  const { data, isLoading, isError } = useOne<Quotation>({
    resource: 'quotations',
    id: params.id,
  });
  const [isSaving, setIsSaving] = React.useState(false);

  if (isError) {
    return <Alert type="error" message="Quotation not found" showIcon />;
  }

  if (isLoading || !data?.data) {
    return <Skeleton active paragraph={{ rows: 12 }} />;
  }

  const handleSave = async (quotation: Quotation | Omit<Quotation, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!('id' in quotation)) {
      throw new Error('Expected an existing quotation record while editing.');
    }

    setIsSaving(true);
    try {
      await localStorageDataProvider.update<Quotation>({
        resource: 'quotations',
        id: quotation.id,
        variables: quotation,
      });

      messageApi.success('Quotation updated.');
      router.replace(`/quotations/${quotation.id}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {contextHolder}
      <QuotationEditor
        mode="edit"
        initialQuotation={data.data}
        onSave={handleSave}
        saving={isSaving}
      />
    </>
  );
}
