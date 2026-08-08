import { NextRequest, NextResponse } from 'next/server';
import { guardApiRequest, readJsonBody } from '@/lib/api-guard';
import { getGeminiClient, getGeminiModel, getRequestId, logApiError } from '@/lib/gemini';
import {
  itineraryEditProposalJsonSchema,
  itineraryEditProposalSchema,
  itineraryEditRequestSchema,
} from '@/lib/trip-schema';
import { validateItinerary } from '@/lib/itinerary-validation';
import { getEditIntent, isOutOfScopeTravelRequest, validateEditEffect } from '@/lib/itinerary-edit';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const blocked = guardApiRequest(request);
  if (blocked) return blocked;
  const payload = await readJsonBody(request);
  if (payload.error) return payload.error;
  const parsed = itineraryEditRequestSchema.safeParse(payload.body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'La demande ou l’itinéraire est invalide.' }, { status: 422 });
  }

  const client = getGeminiClient();
  if (!client) return NextResponse.json({ error: 'Le générateur IA n’est pas configuré côté serveur.' }, { status: 503 });

  const { instruction, itinerary } = parsed.data;
  if (isOutOfScopeTravelRequest(instruction)) {
    return NextResponse.json({
      error: 'TrippieMe reste centré sur votre voyage : demande un ajout, une suppression ou un ajustement d’activité, de journée, d’horaire ou de trajet.',
    }, { status: 422 });
  }
  const intent = getEditIntent(instruction);
  const requestId = getRequestId();
  const prompt = `Tu modifies un itinéraire de voyage. Réponds exclusivement avec le JSON conforme au schéma fourni.

Demande utilisateur : ${instruction}

Itinéraire actuel :
${JSON.stringify(itinerary)}

Règles impératives :
- Propose une modification, ne raconte pas ton raisonnement.
- Retourne l'itinéraire COMPLET après modification (toutes les journées, y compris celles qui ne changent pas).
- Chaque journée doit avoir une date ISO YYYY-MM-DD unique, une ville et au moins une activité.
- Chaque activité doit TOUJOURS renseigner time (HH:MM), title, location (nom ou adresse non vide) et durationMinutes. Ne renvoie jamais null, undefined, un objet vide, ni une étape générique sans lieu.
- Les activités d'une journée doivent être dans l'ordre, sans chevauchement. Une activité de transport peut être précisée dans travelNote, mais conserve un lieu exploitable.
- Pour un ajout de journée, ajoute exactement la date demandée si elle est explicite. Sinon, ajoute une date cohérente et indique-la dans changes. Ne supprime aucune journée existante sauf demande explicite.
- Pour une suppression d’activité, retire seulement l’activité visée et conserve le reste de la journée autant que possible. Pour un ajout, crée une activité complète et n’écrase pas les activités existantes. Pour une suppression de journée, retire uniquement la date visée.
- Conserve strictement les journées, activités et horaires non concernés par la demande. Ne transforme jamais la totalité du voyage pour une modification locale.
- Ne réponds jamais à une demande hors de l’organisation du voyage : elle a déjà été filtrée en amont.
- changes contient une liste courte et concrète de changements. summary explique la proposition en une phrase.
- Si une réservation, un horaire ou un billet est incertain, indique-le dans logistics.warnings plutôt que de l'inventer.`;

  try {
    const result = await client.models.generateContent({
      model: getGeminiModel(),
      contents: prompt,
      config: { responseMimeType: 'application/json', responseJsonSchema: itineraryEditProposalJsonSchema },
    });
    const raw = result.text?.trim();
    if (!raw) throw new Error('Réponse IA vide');
    const proposal = itineraryEditProposalSchema.safeParse(JSON.parse(raw));
    if (!proposal.success) throw new Error('Proposition IA invalide');
    const validation = validateItinerary(proposal.data.itinerary);
    if (!validation.itinerary) {
      return NextResponse.json({ error: 'La proposition IA comporte des activités incomplètes. Réessaie en précisant la date ou le lieu.' }, { status: 422 });
    }
    const effectError = validateEditEffect(itinerary, validation.itinerary, intent);
    if (effectError) return NextResponse.json({ error: effectError }, { status: 422 });
    // The cover is application metadata, not a planning decision: preserve it even
    // when the model does not include optional image fields in its structured output.
    return NextResponse.json({ proposal: { ...proposal.data, itinerary: { ...validation.itinerary, cover: itinerary.cover } } }, { headers: { 'Cache-Control': 'no-store', 'X-Request-Id': requestId } });
  } catch (error) {
    logApiError('trip-edit', requestId, error);
    return NextResponse.json({ error: 'La modification IA n’a pas pu être préparée. Votre itinéraire actuel est inchangé.', requestId }, { status: 502 });
  }
}
