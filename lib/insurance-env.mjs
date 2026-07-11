import { z } from 'zod';

const nonEmpty = (message) =>
  z
    .string({ required_error: message, invalid_type_error: message })
    .trim()
    .min(1, message);

const insuranceEnvironmentSchema = z
  .object({
    DATABASE_URL: nonEmpty('Required for Neon/Postgres access.').regex(
      /^postgres(?:ql)?:\/\//,
      'Must be a PostgreSQL connection URL.'
    ),
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: nonEmpty(
      'Required for Clerk authentication in the browser.'
    ).regex(/^pk_(?:test|live)_/, 'Must be a Clerk publishable key.'),
    CLERK_SECRET_KEY: nonEmpty(
      'Required for Clerk authentication on the server.'
    ).regex(/^sk_(?:test|live)_/, 'Must be a Clerk secret key.'),
    GEMINI_API_KEY: nonEmpty('Required for insurance document parsing.'),
    CLERK_ADMIN_EMAILS: nonEmpty(
      'Required to define which Clerk users can access insurance admin.'
    ).refine(
      (value) =>
        value
          .split(',')
          .map((email) => email.trim())
          .filter(Boolean)
          .every((email) => z.string().email().safeParse(email).success),
      'Must be a comma-separated list of valid email addresses.'
    ),
    BLOB_READ_WRITE_TOKEN: z.string().optional(),
    VERCEL_OIDC_TOKEN: z.string().optional(),
    BLOB_STORE_ID: z.string().optional(),
  })
  .passthrough()
  .superRefine((env, context) => {
    const hasBlobToken = Boolean(env.BLOB_READ_WRITE_TOKEN?.trim());
    const hasBlobOidc = Boolean(
      env.VERCEL_OIDC_TOKEN?.trim() && env.BLOB_STORE_ID?.trim()
    );

    if (!hasBlobToken && !hasBlobOidc) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['BLOB_READ_WRITE_TOKEN'],
        message:
          'Set BLOB_READ_WRITE_TOKEN, or both VERCEL_OIDC_TOKEN and BLOB_STORE_ID.',
      });
    }
  });

export function getInsuranceEnvironmentStatus(env = process.env) {
  const result = insuranceEnvironmentSchema.safeParse(env);
  const issues = result.success
    ? []
    : result.error.issues.map((issue) => ({
        key: issue.path.join('.') || 'environment',
        message: issue.message,
      }));

  return {
    ok: issues.length === 0,
    issues,
  };
}
