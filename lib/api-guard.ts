import { NextRequest, NextResponse } from 'next/server';

const requests = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 5;
const MAX_BODY_BYTES = 30_000;

function clientKey(request: NextRequest) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip')
    ?? 'unknown';
}

/** Best-effort protection. Replace with a distributed store when authentication is added. */
export function guardApiRequest(request: NextRequest) {
  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Demande trop volumineuse.' }, { status: 413 });
  }

  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) {
        return NextResponse.json({ error: 'Origine de la demande non autorisée.' }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: 'Origine de la demande invalide.' }, { status: 403 });
    }
  }

  const key = clientKey(request);
  const now = Date.now();
  const recent = (requests.get(key) ?? []).filter((timestamp) => now - timestamp < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS) {
    return NextResponse.json({ error: 'Trop de demandes. Réessaie dans une minute.' }, { status: 429 });
  }
  requests.set(key, [...recent, now]);
}

/** Enforces the limit for chunked requests that omit Content-Length. */
export async function readJsonBody(request: NextRequest): Promise<{ body?: unknown; error?: NextResponse }> {
  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.toLocaleLowerCase().includes('application/json')) {
    return { error: NextResponse.json({ error: 'Le corps de la demande doit être du JSON.' }, { status: 415 }) };
  }
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
    return { error: NextResponse.json({ error: 'Demande trop volumineuse.' }, { status: 413 }) };
  }
  try {
    return { body: JSON.parse(raw) };
  } catch {
    return { error: NextResponse.json({ error: 'JSON invalide.' }, { status: 400 }) };
  }
}
