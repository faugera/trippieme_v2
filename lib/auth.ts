import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { betterAuth } from 'better-auth/minimal';
import { getDb } from '@/lib/db';
import { schema } from '@/lib/db/schema';

function getBaseUrl() {
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

function createAuthInstance(db: NonNullable<ReturnType<typeof getDb>>, secret: string) {
  const trustedOrigins = (process.env.BETTER_AUTH_TRUSTED_ORIGINS ?? getBaseUrl())
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

  return betterAuth({
    database: drizzleAdapter(db, { provider: 'pg', schema }),
    baseURL: getBaseUrl(),
    trustedOrigins,
    secret,
    emailAndPassword: { enabled: true, minPasswordLength: 10 },
    socialProviders: googleClientId && googleClientSecret
      ? { google: { clientId: googleClientId, clientSecret: googleClientSecret } }
      : undefined,
  });
}

export function isGoogleAuthConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

let authInstance: ReturnType<typeof createAuthInstance> | undefined;

export function getAuth() {
  const db = getDb();
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!db || !secret) return null;

  if (!authInstance) authInstance = createAuthInstance(db, secret);
  return authInstance;
}
