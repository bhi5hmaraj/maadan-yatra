'use client';

import { Refine } from '@refinedev/core';
import { RefineThemes, useNotificationProvider } from '@refinedev/antd';
import routerProvider from '@refinedev/nextjs-router';
import { ConfigProvider, App as AntdApp } from 'antd';
import { FileTextOutlined, HomeOutlined } from '@ant-design/icons';
import { localStorageDataProvider } from './localStorageDataProvider';

const customTheme = {
  ...RefineThemes.Blue,
  token: {
    ...RefineThemes.Blue.token,
    colorPrimary: '#1B3A4B',
    colorInfo: '#1B3A4B',
    colorSuccess: '#0F6E56',
    colorWarning: '#C4622D',
    colorError: '#A32D2D',
    fontFamily: "'DM Sans', system-ui, sans-serif",
  },
};

export function RefineProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider theme={customTheme}>
      <AntdApp>
        <Refine
          dataProvider={localStorageDataProvider}
          routerProvider={routerProvider}
          notificationProvider={useNotificationProvider}
          resources={[
            {
              name: 'dashboard',
              list: '/',
              meta: {
                label: 'Dashboard',
                icon: <HomeOutlined />,
              },
            },
            {
              name: 'quotations',
              list: '/quotations',
              create: '/quotations/create',
              edit: '/quotations/edit/:id',
              show: '/quotations/:id',
              meta: {
                label: 'Quotations',
                icon: <FileTextOutlined />,
              },
            },
          ]}
          options={{
            disableTelemetry: true,
            syncWithLocation: true,
            warnWhenUnsavedChanges: true,
          }}
        >
          {children}
        </Refine>
      </AntdApp>
    </ConfigProvider>
  );
}
