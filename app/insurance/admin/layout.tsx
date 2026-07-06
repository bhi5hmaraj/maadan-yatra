import { requireAdminPageUser } from '@/features/auth/admin';

export default async function InsuranceAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminPageUser();

  return children;
}
