'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { Button, Descriptions, Grid, Skeleton, Space, Tag, Typography, message } from 'antd';
import { ArrowLeftOutlined, DownloadOutlined, EditOutlined } from '@ant-design/icons';
import { useParams } from 'next/navigation';
import { useOne } from '@refinedev/core';
import { QuotationDocument } from '@/components/quotation/QuotationDocument';
import type { Quotation } from '@/types/quotation';
import { calculateTotal, formatAmountRaw, formatDate } from '@/utils/formatting';
import { generatePDF } from '@/utils/pdf';

const { Paragraph, Title } = Typography;
const { useBreakpoint } = Grid;

export default function ShowQuotationPage() {
  const params = useParams<{ id: string }>();
  const documentRef = useRef<HTMLDivElement>(null);
  const [messageApi, contextHolder] = message.useMessage();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const { data, isLoading, isError } = useOne<Quotation>({
    resource: 'quotations',
    id: params.id,
  });

  if (isError) {
    return <Typography.Text type="danger">Quotation not found.</Typography.Text>;
  }

  if (isLoading || !data?.data) {
    return <Skeleton active paragraph={{ rows: 14 }} />;
  }

  const quotation = data.data;

  const handleDownload = async () => {
    if (!documentRef.current) {
      messageApi.error('Document is not ready yet.');
      return;
    }

    await generatePDF(documentRef.current, quotation);
  };

  return (
    <>
      {contextHolder}
      <div className="app-shell-page">
        <div>
          <Link href="/quotations">
            <Button type="link" icon={<ArrowLeftOutlined />} style={{ paddingLeft: 0 }}>
              Back to quotations
            </Button>
          </Link>
          <Title level={2} style={{ marginBottom: 0 }}>
            {quotation.number}
          </Title>
          <Paragraph type="secondary">
            Review the generated quotation and export the PDF when ready to share with the customer.
          </Paragraph>
          <Space wrap direction={isMobile ? 'vertical' : 'horizontal'} style={isMobile ? { width: '100%' } : undefined}>
            <Button block={isMobile} type="primary" icon={<DownloadOutlined />} onClick={handleDownload}>
              Download PDF
            </Button>
            <Link href={`/quotations/edit/${quotation.id}`}>
              <Button block={isMobile} icon={<EditOutlined />}>Edit quotation</Button>
            </Link>
            <Tag>{quotation.status.toUpperCase()}</Tag>
          </Space>
        </div>

        <Descriptions bordered size="small" column={{ xs: 1, md: 2, lg: 4 }}>
          <Descriptions.Item label="Customer">{quotation.customer.name || '—'}</Descriptions.Item>
          <Descriptions.Item label="Destination">{quotation.trip.destination || '—'}</Descriptions.Item>
          <Descriptions.Item label="Quoted amount">{formatAmountRaw(calculateTotal(quotation.lineItems))}</Descriptions.Item>
          <Descriptions.Item label="Valid until">{formatDate(quotation.validUntil)}</Descriptions.Item>
        </Descriptions>

        <div className="document-page">
          <div className="document-page__frame">
            <div className="document-page__toolbar">
              <Button icon={<DownloadOutlined />} onClick={handleDownload}>
                Download PDF
              </Button>
            </div>
            <QuotationDocument ref={documentRef} quotation={quotation} />
          </div>
        </div>
      </div>
    </>
  );
}
