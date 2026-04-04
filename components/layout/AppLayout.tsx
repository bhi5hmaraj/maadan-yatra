'use client';

import React from 'react';
import { Layout, Menu, theme } from 'antd';
import { useMenu, useNavigation, useResource } from '@refinedev/core';
import Link from 'next/link';

const { Header, Sider, Content } = Layout;

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { menuItems } = useMenu();
  const { push } = useNavigation();
  const { resource } = useResource();
  const { token } = theme.useToken();

  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          background: '#1B3A4B',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 1000,
        }}
      >
        <Link href="/" style={{ textDecoration: 'none' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: '1.25rem',
                fontWeight: 600,
                color: '#fff',
              }}
            >
              Sri Maadan{' '}
              <span style={{ color: '#E8835A', fontStyle: 'italic' }}>Yatra</span>
            </span>
            <span
              style={{
                fontSize: '0.6rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.4)',
              }}
            >
              Internal Tools
            </span>
          </div>
        </Link>
      </Header>

      <Layout>
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          style={{
            background: token.colorBgContainer,
            borderRight: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <Menu
            mode="inline"
            selectedKeys={[resource?.name ?? '']}
            style={{ borderRight: 0, height: '100%' }}
            items={menuItems.map((item) => ({
              key: item.key ?? item.name,
              icon: item.icon,
              label: (
                <Link href={item.route ?? '/'}>
                  {item.label}
                </Link>
              ),
              onClick: () => {
                if (item.route) {
                  push(item.route);
                }
              },
            }))}
          />
        </Sider>

        <Content
          style={{
            padding: '24px',
            background: '#EDEAE3',
            minHeight: 'calc(100vh - 64px)',
            overflow: 'auto',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
