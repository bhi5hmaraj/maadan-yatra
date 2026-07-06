import { auth } from '@clerk/nextjs/server';
import { DashboardClient } from './_components/DashboardClient';

export default async function DashboardPage() {
  await auth.protect();

  return <DashboardClient />;
}
