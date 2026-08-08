import { NextRequest, NextResponse } from 'next/server';
import { guardApiRequest, readJsonBody } from '@/lib/api-guard';
import { getGeminiClient, getGeminiModel, getRequestId, logApiError } from '@/lib/gemini';
import { getLogisticsContext } from '@/lib/logistics';
import { itineraryJsonSchema, tripRequestSchema } from '@/lib/trip-schema';
import { getDestinationCover } from '@/lib/unsplash';
import { validateItinerary } from '@/lib/itinerary-validation';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const blocked = guardApiRequest(request);
  if (blocked) return blocked;

  const payload = await readJsonBody(request);
  if (payload.error) return payload.error;
  const parsed = tripRequestSchema.safeParse(payload.body);
  if (!parsed.success) return NextResponse.json({ error: 'Paramètres invalides.', details: parsed.error.issues }, { status: 422 });
  const client = getGeminiClient();
  if (!client) return NextResponse.json({ error: 'Le générateur IA n’est pas configuré côté serveur.' }, { status: 503 });

  const trip = parsed.data;
  const context = getLogisticsContext(trip);
  const requestId = getRequestId();
  const prompt = `Tu es un concierge voyage expert. Génère un itinéraire réaliste, précis et diversifié en français.\n\nDonnées validées:\n${JSON.stringify(trip)}\n\nContraintes logistiques non négociables:\n${JSON.stringify(context)}\n- Le premier jour, aucune activité avant arrivalAvailableAt. Commence par le transfert puis l'hébergement si une adresse est fournie.\n- Le dernier jour, aucune activité qui empêcherait un départ à departureMustLeaveAt.\n- Respecte les villes et nuits telles que demandées, avec une étape cohérente par journée.\n- Indique les incertitudes (horaires, réservations, transferts) dans logistics.warnings plutôt que d'inventer.\n- Ne propose pas plus de 8 activités par jour et prévois des temps de déplacement réalistes.\nRetourne uniquement le JSON conforme au schéma.`;

  try {
    const result = await client.models.generateContent({
      model: getGeminiModel(),
      contents: prompt,
      config: { responseMimeType: 'application/json', responseJsonSchema: itineraryJsonSchema },
    });
    const raw = result.text?.trim();
    if (!raw) throw new Error('Réponse IA vide');
    const validation = validateItinerary(JSON.parse(raw), trip);
    if (!validation.itinerary) throw new Error(validation.error ?? 'Réponse IA invalide');
    const cover = getDestinationCover(trip.cities[0].city.label);
    return NextResponse.json({ itinerary: { ...validation.itinerary, cover } }, { headers: { 'Cache-Control': 'no-store', 'X-Request-Id': requestId } });
  } catch (error) {
    logApiError('trip-generation', requestId, error);
    return NextResponse.json({ error: 'La génération a échoué. Les données n’ont pas été sauvegardées : réessaie.', requestId }, { status: 502 });
  }
}
