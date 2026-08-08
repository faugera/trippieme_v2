import { toNextJsHandler } from 'better-auth/next-js';
import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function unavailable() {
  return NextResponse.json({ error: 'Authentification indisponible : configure DATABASE_URL et BETTER_AUTH_SECRET côté serveur.' }, { status: 503 });
}

export async function GET(request: Request) {
  const auth = getAuth();
  if (!auth) return unavailable();
  return toNextJsHandler(auth).GET(request);
}

export async function POST(request: Request) {
  const auth = getAuth();
  if (!auth) return unavailable();
  return toNextJsHandler(auth).POST(request);
}
