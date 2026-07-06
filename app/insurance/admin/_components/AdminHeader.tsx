'use client';

import Link from 'next/link';
import { Button, Space, Typography } from 'antd';
import { ReloadOutlined, UploadOutlined } from '@ant-design/icons';
import { Show, UserButton } from '@clerk/nextjs';

const { Text, Title } = Typography;

export function AdminHeader(props: {
  isLoading: boolean;
  onRefresh: () => void;
  title?: string;
}) {
  return (
    <header className="insurance-admin-header">
      <div>
        <Text type="secondary">Insurance ops</Text>
        <Title level={2}>{props.title ?? 'Cases'}</Title>
      </div>
      <Space>
        <Link href="/insurance/admin">
          <Button>Cases</Button>
        </Link>
        <Link href="/insurance/admin/queue">
          <Button>Workflow</Button>
        </Link>
        <Link href="/insurance/admin/share">
          <Button>Share settings</Button>
        </Link>
        <Link href="/insurance/upload">
          <Button icon={<UploadOutlined />}>Upload</Button>
        </Link>
        <Button icon={<ReloadOutlined />} onClick={props.onRefresh} loading={props.isLoading}>
          Refresh
        </Button>
        <Show when="signed-in">
          <UserButton />
        </Show>
      </Space>
    </header>
  );
}
