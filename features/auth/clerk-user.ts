import { auth, clerkClient } from '@clerk/nextjs/server';

type ClerkUser = Awaited<
  ReturnType<Awaited<ReturnType<typeof clerkClient>>['users']['getUser']>
>;

export function getPrimaryEmail(user: ClerkUser) {
  const primaryEmail = user.emailAddresses.find(
    (email) => email.id === user.primaryEmailAddressId
  );

  return primaryEmail?.emailAddress.toLowerCase() ?? null;
}

export async function requireSignedInEmail() {
  const { isAuthenticated, redirectToSignIn, userId } = await auth();

  if (!isAuthenticated || !userId) {
    redirectToSignIn();
    throw new Error('Authentication required.');
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const email = getPrimaryEmail(user);

  if (!email) {
    throw new Error('Signed-in user does not have a primary email.');
  }

  return {
    email,
    userId,
  };
}
