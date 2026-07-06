import { notFound } from 'next/navigation';
import { requireSignedInEmail } from '@/features/auth/clerk-user';
import { getInsuranceCaseForShare } from '@/features/insurance/adapters/prisma-case-repository';
import {
  getInsuranceShareRows,
  parseConfirmedInsuranceExtraction,
} from '@/features/insurance/share-view';
import {
  formatDateTime,
  insuranceCaseStatusColors,
  statusLabel,
} from '@/features/insurance/presentation';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

export default async function InsuranceSharePage({
  searchParams,
}: {
  searchParams: Promise<{ caseId?: string }>;
}) {
  const { email } = await requireSignedInEmail();
  const { caseId } = await searchParams;

  if (!caseId) {
    notFound();
  }

  const insuranceCase = await getInsuranceCaseForShare(caseId);

  if (!insuranceCase || !insuranceCase.shareEnabled) {
    notFound();
  }

  const allowedEmails = stringArray(insuranceCase.shareAllowedEmails).map((item) =>
    item.toLowerCase()
  );

  if (!allowedEmails.includes(email)) {
    notFound();
  }

  const confirmed = parseConfirmedInsuranceExtraction(
    insuranceCase.confirmedExtraction
  );

  if (!confirmed.success) {
    notFound();
  }

  const shareRows = getInsuranceShareRows(
    confirmed.data,
    stringArray(insuranceCase.shareFieldPaths)
  );
  const groupedRows = new Map<string, typeof shareRows>();

  for (const row of shareRows) {
    groupedRows.set(row.groupLabel, [...(groupedRows.get(row.groupLabel) ?? []), row]);
  }

  return (
    <div className="insurance-share-page">
      <main className="insurance-share-page__main">
        <header className="insurance-share-header">
          <div>
            <span className="insurance-share-eyebrow">Insurance provider view</span>
            <h1>{insuranceCase.customerName || 'Insurance case'}</h1>
          </div>
          <span
            className={`insurance-share-status insurance-share-status--${insuranceCase.status.toLowerCase()}`}
            style={{
              borderColor: insuranceCaseStatusColors[insuranceCase.status],
            }}
          >
            {statusLabel(insuranceCase.status)}
          </span>
        </header>

        <section className="insurance-share-card">
          <div className="insurance-share-content">
            <div className="insurance-share-meta">
              <div>
                <span>Case ID</span>
                <strong>{insuranceCase.id}</strong>
              </div>
              <div>
                <span>Verified</span>
                <strong>
                  {insuranceCase.confirmedAt
                    ? formatDateTime(insuranceCase.confirmedAt.toISOString())
                    : 'Not recorded'}
                </strong>
              </div>
            </div>

            {[...groupedRows.entries()].map(([groupLabel, rows]) => (
              <section className="insurance-share-section" key={groupLabel}>
                <h2>{groupLabel}</h2>
                <div className="insurance-share-fields">
                  {rows.map((row) => (
                    <div className="insurance-share-field" key={row.path}>
                      <span>{row.label}</span>
                      <strong>{row.value}</strong>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
