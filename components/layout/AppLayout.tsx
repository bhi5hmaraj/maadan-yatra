'use client';

import React from 'react';
import { Button, Drawer, Grid, Layout, Menu, theme } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import { useMenu, useNavigation, useResource } from '@refinedev/core';
import Link from 'next/link';

const { Header, Sider, Content } = Layout;
const { useBreakpoint } = Grid;

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { menuItems } = useMenu();
  const { push } = useNavigation();
  const { resource } = useResource();
  const { token } = theme.useToken();
  const screens = useBreakpoint();
  const isMobile = !screens.lg;

  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const menuItemsConfig = menuItems.map((item) => ({
    key: item.key ?? item.name,
    icon: item.icon,
    label: <Link href={item.route ?? '/'}>{item.label}</Link>,
    onClick: () => {
      if (item.route) {
        push(item.route);
      }
      setMobileMenuOpen(false);
    },
  }));

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          background: '#1B3A4B',
          padding: isMobile ? '0 14px' : '0 24px',
          height: isMobile ? 60 : 72,
          lineHeight: 'normal',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 6px 18px rgba(17, 31, 39, 0.18)',
        }}
      >
        <Link href="/" style={{ textDecoration: 'none', minWidth: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 2 }}>
            <span
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: isMobile ? '1.12rem' : '1.42rem',
                fontWeight: 600,
                color: '#fff',
                lineHeight: 1,
                whiteSpace: 'nowrap',
              }}
            >
              Sri Maadan{' '}
              <span style={{ color: '#E8835A', fontStyle: 'italic' }}>Yatra</span>
            </span>
            <span
              style={{
                fontSize: isMobile ? '0.55rem' : '0.62rem',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.52)',
                display: isMobile ? 'none' : 'block',
                lineHeight: 1.1,
              }}
            >
              Internal Tools
            </span>
          </div>
        </Link>
        {isMobile ? (
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={() => setMobileMenuOpen(true)}
            style={{ color: '#fff', width: 40, height: 40 }}
          />
        ) : null}
      </Header>

      <Layout>
        {!isMobile ? (
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
              items={menuItemsConfig}
            />
          </Sider>
        ) : null}

        <Content
          style={{
            padding: isMobile ? '14px' : '24px',
            background: '#EDEAE3',
            minHeight: isMobile ? 'calc(100vh - 60px)' : 'calc(100vh - 72px)',
            overflow: 'auto',
          }}
        >
          {children}
        </Content>
      </Layout>
      <Drawer
        title="Navigation"
        placement="left"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        styles={{ body: { padding: 0 } }}
      >
        <Menu
          mode="inline"
          selectedKeys={[resource?.name ?? '']}
          style={{ borderRight: 0 }}
          items={menuItemsConfig}
        />
      </Drawer>
    </Layout>
  );
}
