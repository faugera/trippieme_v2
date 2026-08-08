import { randomUUID } from 'node:crypto';
import { and, desc, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuth } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { trip } from '@/lib/db/schema';
import { itinerarySchema } from '@/lib/trip-schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const saveTripSchema = z.object({ itinerary: itinerarySchema });

async function getSession(request: NextRequest) {
  const auth = getAuth();
  const db = getDb();
  if (!auth || !db) return { error: NextResponse.json({ error: 'La synchronisation cloud n’est pas encore configurée.' }, { status: 503 }) };
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return { error: NextResponse.json({ error: 'Authentification requise.' }, { status: 401 }) };
  return { auth, db, userId: session.user.id };
}

export async function GET(request: NextRequest) {
  const context = await getSession(request);
  if ('error' in context) return context.error;
  const rows = await context.db.select().from(trip).where(eq(trip.userId, context.userId)).orderBy(desc(trip.updatedAt)).limit(50);
  return NextResponse.json({ trips: rows.map((row) => ({ id: row.id, itinerary: row.itinerary, updatedAt: row.updatedAt.toISOString() })) });
}

export async function PUT(request: NextRequest) {
  const context = await getSession(request);
  if ('error' in context) return context.error;
  const body = await request.json().catch(() => null);
  const parsed = saveTripSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Itinéraire invalide.' }, { status: 422 });

  const itinerary = parsed.data.itinerary;
  const destination = itinerary.days[0]?.city;
  const startDate = itinerary.days[0]?.date;
  const endDate = itinerary.days.at(-1)?.date;
  if (!destination || !startDate || !endDate) return NextResponse.json({ error: 'Itinéraire incomplet.' }, { status: 422 });

  const [saved] = await context.db
    .insert(trip)
    .values({ id: randomUUID(), userId: context.userId, title: itinerary.title, destination, startDate, endDate, itinerary })
    .onConflictDoUpdate({
      target: [trip.userId, trip.title, trip.startDate],
      set: { destination, endDate, itinerary, updatedAt: new Date() },
    })
    .returning();

  return NextResponse.json({ trip: { id: saved.id, itinerary: saved.itinerary, updatedAt: saved.updatedAt.toISOString() } });
}

export async function DELETE(request: NextRequest) {
  const context = await getSession(request);
  if ('error' in context) return context.error;
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Identifiant de voyage manquant.' }, { status: 422 });
  await context.db.delete(trip).where(and(eq(trip.id, id), eq(trip.userId, context.userId)));
  return new NextResponse(null, { status: 204 });
}
