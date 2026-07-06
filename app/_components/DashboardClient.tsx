'use client';

import Link from 'next/link';
import { Button, Card, Col, List, Row, Space, Statistic, Tag, Typography } from 'antd';
import { FileSearchOutlined, FileTextOutlined, PlusOutlined } from '@ant-design/icons';
import { useList } from '@refinedev/core';
import type { Quotation } from '@/types/quotation';
import { calculateTotal, formatAmountRaw, formatDate } from '@/utils/formatting';

const { Paragraph, Title } = Typography;

export function DashboardClient() {
  const { data, isLoading } = useList<Quotation>({
    resource: 'quotations',
    pagination: { mode: 'off' },
    sorters: [{ field: 'updatedAt', order: 'desc' }],
  });

  const quotations = data?.data ?? [];
  const recent = quotations.slice(0, 5);
  const confirmed = quotations.filter((item) => item.status === 'confirmed');
  const quotedValue = quotations.reduce((sum, quotation) => sum + calculateTotal(quotation.lineItems), 0);

  return (
    <div className="app-shell-page">
      <div>
        <Title level={2}>Dashboard</Title>
        <Paragraph type="secondary">
          Start a new quotation, revisit saved proposals, and keep track of the active pipeline.
        </Paragraph>
        <Space>
          <Link href="/quotations/create">
            <Button type="primary" icon={<PlusOutlined />}>
              New quotation
            </Button>
          </Link>
          <Link href="/quotations">
            <Button icon={<FileTextOutlined />}>View quotations</Button>
          </Link>
          <Link href="/vendor-import">
            <Button icon={<FileSearchOutlined />}>Import vendor PDF</Button>
          </Link>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic title="Total quotations" value={quotations.length} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic title="Confirmed trips" value={confirmed.length} />
          </Card>
        </Col>
        <Col xs={24} sm={24} lg={8}>
          <Card>
            <Statistic title="Quoted value" value={quotedValue} precision={0} prefix="₹" groupSeparator="," />
          </Card>
        </Col>
      </Row>

      <Card title="Recent quotations" loading={isLoading}>
        <List
          dataSource={recent}
          locale={{ emptyText: 'No quotations saved yet.' }}
          renderItem={(quotation) => (
            <List.Item
              actions={[
                <Link key="open" href={`/quotations/${quotation.id}`}>
                  Open
                </Link>,
              ]}
            >
              <List.Item.Meta
                title={
                  <Space size={8}>
                    <span>{quotation.number}</span>
                    <Tag>{quotation.status.toUpperCase()}</Tag>
                  </Space>
                }
                description={`${quotation.customer.name || 'Unnamed customer'} · ${quotation.trip.destination || 'Destination pending'} · Updated ${formatDate(quotation.updatedAt.slice(0, 10))}`}
              />
              <div>{formatAmountRaw(calculateTotal(quotation.lineItems))}</div>
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}
