import { notFound } from 'next/navigation';
import { requireSignedInEmail } from '@/features/auth/clerk-user';
import {
  getInsuranceShareSettings,
  listInsuranceCasesForShare,
} from '@/features/insurance/adapters/prisma-case-repository';
import {
  getInsuranceShareRows,
  parseConfirmedInsuranceExtraction,
} from '@/features/insurance/share-view';
import { formatDateTime, statusLabel } from '@/features/insurance/presentation';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function isExpired(value: Date | null) {
  return Boolean(value && value.getTime() <= Date.now());
}

export default async function InsuranceSharePage() {
  const { email } = await requireSignedInEmail();
  const settings = await getInsuranceShareSettings();
  const allowedEmails = stringArray(settings.allowedEmails).map((item) =>
    item.toLowerCase()
  );
  const fieldPaths = stringArray(settings.fieldPaths);

  if (
    !settings.enabled ||
    isExpired(settings.expiresAt) ||
    !allowedEmails.includes(email) ||
    fieldPaths.length === 0
  ) {
    notFound();
  }

  const sharedCases = await listInsuranceCasesForShare();
  const visibleCases = sharedCases
    .map((insuranceCase) => {
      const confirmed = parseConfirmedInsuranceExtraction(
        insuranceCase.confirmedExtraction
      );

      if (!confirmed.success) return null;

      return {
        insuranceCase,
        rows: getInsuranceShareRows(confirmed.data, fieldPaths),
      };
    })
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
              No verified insurance cases are available in this share.
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
