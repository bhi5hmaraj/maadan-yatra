'use client';

import { Alert, message } from 'antd';
import { AdminHeader } from './_components/AdminHeader';
import { AdminStats } from './_components/AdminStats';
import { CaseList } from './_components/CaseList';
import { useCaseIndex } from './_hooks/useCaseIndex';

export default function InsuranceAdminPage() {
  const [messageApi, contextHolder] = message.useMessage();
  const admin = useCaseIndex(messageApi);

  return (
    <div className="insurance-admin-page">
      {contextHolder}
      <main className="insurance-admin-page__main">
        <AdminHeader isLoading={admin.isLoading} onRefresh={admin.loadCases} />

        {admin.error ? (
          <Alert type="error" showIcon message="Could not load cases" description={admin.error} />
        ) : null}

        <AdminStats cases={admin.cases} />

        <section className="insurance-admin-index-grid">
          <CaseList
            cases={admin.cases}
            isLoading={admin.isLoading}
          />
        </section>
      </main>
    </div>
  );
}
