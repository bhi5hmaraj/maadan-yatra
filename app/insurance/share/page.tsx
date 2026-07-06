import { notFound } from 'next/navigation';
import { requireSignedInEmail } from '@/features/auth/clerk-user';
import {
  getInsuranceCaseForShare,
  listInsuranceCasesForShare,
} from '@/features/insurance/adapters/prisma-case-repository';
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

type SharedCase = Awaited<ReturnType<typeof getInsuranceCaseForShare>>;

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function canViewSharedCase(allowedEmailValue: unknown, email: string) {
  return stringArray(allowedEmailValue)
    .map((item) => item.toLowerCase())
    .includes(email);
}

function buildSharedCaseView(insuranceCase: SharedCase) {
  if (!insuranceCase) return null;

  const confirmed = parseConfirmedInsuranceExtraction(
    insuranceCase.confirmedExtraction
  );

  if (!confirmed.success) return null;

  return {
    insuranceCase,
    rows: getInsuranceShareRows(
      confirmed.data,
      stringArray(insuranceCase.shareFieldPaths)
    ),
  };
}

async function renderShareTable(email: string) {
  const sharedCases = await listInsuranceCasesForShare();
  const visibleCases = sharedCases
    .filter((insuranceCase) =>
      canViewSharedCase(insuranceCase.shareAllowedEmails, email)
    )
    .map(buildSharedCaseView)
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const columns = Array.from(
    new Map(
      visibleCases.flatMap((item) => item.rows).map((row) => [row.path, row])
    ).values()
  );

  return (
    <div className="insurance-share-page">
      <main className="insurance-share-page__main insurance-share-page__main--wide">
        <header className="insurance-share-header">
          <div>
            <span className="insurance-share-eyebrow">Insurance provider view</span>
            <h1>Shared insurance cases</h1>
          </div>
          <span className="insurance-share-status">{visibleCases.length} cases</span>
        </header>

        <section className="insurance-share-card">
          {visibleCases.length === 0 ? (
            <div className="insurance-share-empty">
              No verified insurance cases are shared with {email}.
            </div>
          ) : (
            <div className="insurance-share-table-wrap">
              <table className="insurance-share-table">
                <thead>
                  <tr>
                    <th>Case</th>
                    <th>Status</th>
                    <th>Verified</th>
                    {columns.map((column) => (
                      <th key={column.path}>{column.label}</th>
                    ))}
                    <th>Open</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleCases.map(({ insuranceCase, rows }) => {
                    const rowValues = new Map(
                      rows.map((row) => [row.path, row.value])
                    );

                    return (
                      <tr key={insuranceCase.id}>
                        <td>
                          <strong>{insuranceCase.customerName || 'Unnamed case'}</strong>
                          <span>{insuranceCase.id}</span>
                        </td>
                        <td>{statusLabel(insuranceCase.status)}</td>
                        <td>
                          {insuranceCase.confirmedAt
                            ? formatDateTime(insuranceCase.confirmedAt.toISOString())
                            : 'Not recorded'}
                        </td>
                        {columns.map((column) => (
                          <td key={column.path}>
                            {rowValues.get(column.path) ?? '-'}
                          </td>
                        ))}
                        <td>
                          <a href={`/insurance/share?caseId=${insuranceCase.id}`}>
                            View
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

async function renderShareDetail(caseId: string, email: string) {
  const insuranceCase = await getInsuranceCaseForShare(caseId);

  if (
    !insuranceCase ||
    !insuranceCase.shareEnabled ||
    !canViewSharedCase(insuranceCase.shareAllowedEmails, email)
  ) {
    notFound();
  }

  const sharedCase = buildSharedCaseView(insuranceCase);

  if (!sharedCase) {
    notFound();
  }

  const groupedRows = new Map<string, typeof sharedCase.rows>();

  for (const row of sharedCase.rows) {
    groupedRows.set(row.groupLabel, [
      ...(groupedRows.get(row.groupLabel) ?? []),
      row,
    ]);
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

export default async function InsuranceSharePage({
  searchParams,
}: {
  searchParams: Promise<{ caseId?: string }>;
}) {
  const { email } = await requireSignedInEmail();
  const { caseId } = await searchParams;

  return caseId ? renderShareDetail(caseId, email) : renderShareTable(email);
}
