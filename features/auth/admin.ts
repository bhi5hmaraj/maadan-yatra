import { clerkClient, auth } from '@clerk/nextjs/server';
import { notFound } from 'next/navigation';
import { NextResponse } from 'next/server';
import { getPrimaryEmail } from './clerk-user';

const builtInAdminEmails = ['matib275@gmail.com'];

class AdminAccessError extends Error {
  constructor(
    message: string,
    readonly status: 401 | 403
  ) {
    super(message);
  }
}

export function getAdminEmailAllowlist() {
  const configuredEmails =
    process.env.CLERK_ADMIN_EMAILS?.split(',').map((email) => email.trim()) ?? [];

  return Array.from(
    new Set(
      [...builtInAdminEmails, ...configuredEmails]
        .map((email) => email.toLowerCase())
        .filter(Boolean)
    )
  );
}

export async function getAllowedAdminUser(options?: { redirectToSignIn?: boolean }) {
  const { isAuthenticated, redirectToSignIn, userId } = await auth();

  if (!isAuthenticated || !userId) {
    if (options?.redirectToSignIn) {
      redirectToSignIn();
    }

    throw new AdminAccessError('Authentication required.', 401);
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const email = getPrimaryEmail(user);

  if (!email || !getAdminEmailAllowlist().includes(email)) {
    throw new AdminAccessError('Admin access is not allowed for this account.', 403);
  }

  return {
    email,
    userId,
  };
}

export async function requireAdminPageUser() {
  try {
    return await getAllowedAdminUser({ redirectToSignIn: true });
  } catch (error) {
    if (!(error instanceof AdminAccessError)) {
      throw error;
    }

    notFound();
  }
}

export async function requireAdminApiUser(traceId: string) {
  try {
    const user = await getAllowedAdminUser();
    return { user, response: null };
  } catch (error) {
    const status = error instanceof AdminAccessError ? error.status : 403;

    return {
      user: null,
      response: NextResponse.json(
        {
          error: status === 401 ? 'Authentication required.' : 'Forbidden.',
          traceId,
        },
        {
          status,
          headers: {
            'x-trace-id': traceId,
          },
        }
      ),
    };
  }
}
