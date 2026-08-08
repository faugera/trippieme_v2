import { itinerarySchema, type Itinerary, type TripRequest } from '@/lib/trip-schema';

/** Extra guards beyond the JSON schema: they make malformed AI edits impossible to apply. */
export function validateItinerary(value: unknown, trip?: TripRequest): { itinerary?: Itinerary; error?: string } {
  const parsed = itinerarySchema.safeParse(value);
  if (!parsed.success) return { error: 'La proposition IA contient une étape incomplète.' };

  const days = parsed.data.days;
  const dates = new Set<string>();
  let previousDate = '';
  const allowedCities = trip ? new Set(trip.cities.map(({ city }) => city.label.trim().toLocaleLowerCase('fr-FR'))) : undefined;
  for (const day of days) {
    if (dates.has(day.date)) return { error: 'La proposition IA contient deux journées à la même date.' };
    if (previousDate && day.date < previousDate) return { error: 'La proposition IA contient des journées hors ordre chronologique.' };
    if (trip && (day.date < trip.startDate || day.date > trip.endDate)) return { error: 'La proposition IA contient une journée en dehors des dates du séjour.' };
    if (allowedCities && !allowedCities.has(day.city.trim().toLocaleLowerCase('fr-FR'))) return { error: 'La proposition IA contient une ville qui ne fait pas partie du voyage demandé.' };
    dates.add(day.date);
    previousDate = day.date;
    let previousEnd = -1;
    for (const activity of day.activities) {
      const [hours, minutes] = activity.time.split(':').map(Number);
      const start = hours * 60 + minutes;
      if (start < previousEnd) return { error: `Les horaires du ${day.date} se chevauchent.` };
      previousEnd = start + activity.durationMinutes;
    }
  }
  return { itinerary: parsed.data };
}
