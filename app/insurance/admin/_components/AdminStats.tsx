'use client';

import { Card, Statistic } from 'antd';
import type { AdminCaseListItem } from '../_types';

export function AdminStats(props: { cases: AdminCaseListItem[] }) {
  const { cases } = props;

  return (
    <section className="insurance-admin-stats">
      <Card>
        <Statistic title="Cases" value={cases.length} />
      </Card>
      <Card>
        <Statistic
          title="Documents"
          value={cases.reduce((sum, insuranceCase) => sum + insuranceCase.documentCount, 0)}
        />
      </Card>
      <Card>
        <Statistic
          title="Needs review"
          value={cases.filter((insuranceCase) => insuranceCase.status === 'NEEDS_REVIEW').length}
        />
      </Card>
    </section>
  );
}
