import { Alert } from 'antd';
import { requireAdminPageUser } from '@/features/auth/admin';
import { getInsuranceEnvironmentStatus } from '@/lib/insurance-env.mjs';

export default async function InsuranceAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminPageUser();
  const configuration = getInsuranceEnvironmentStatus(process.env);

  return (
    <>
      {!configuration.ok ? (
        <div className="insurance-config-banner">
          <Alert
            type="error"
            showIcon
            message="Insurance setup is incomplete"
            description={
              <ul className="insurance-config-issues">
                {configuration.issues.map((issue) => (
                  <li key={issue.key}>
                    <strong>{issue.key}</strong>: {issue.message}
                  </li>
                ))}
              </ul>
            }
          />
        </div>
      ) : null}
      {children}
    </>
  );
}
