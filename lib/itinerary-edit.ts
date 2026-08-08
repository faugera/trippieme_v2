import type { Itinerary } from '@/lib/trip-schema';
import { normaliseText } from '@/lib/text';

export type EditIntent = 'add-day' | 'remove-day' | 'add-activity' | 'remove-activity' | 'adjust-itinerary';

/**
 * TrippieMe edits an existing travel plan.  These patterns deliberately only
 * reject requests that are plainly unrelated; short requests such as
 * "ajoute le Louvre" remain valid in the context of an itinerary.
 */
const OUT_OF_SCOPE = /\b(code|programmation|javascript|typescript|python|sql|site web|application mobile|email|cv|lettre de motivation|devoir|exercice de maths?|analyse financiere|investissement|bitcoin|bourse)\b/;

export function getEditIntent(instruction: string): EditIntent {
  const text = normaliseText(instruction);
  const remove = /\b(supprime|retire|enleve|annule|efface)\b/.test(text);
  const day = /\b(journee|jour|day)\b/.test(text);
  if (remove && day) return 'remove-day';
  if (!remove && /\b(ajoute|ajouter|rajoute|rajouter|prolonge|prolonger|extension)\b/.test(text) && day) return 'add-day';
  if (remove) return 'remove-activity';
  if (/\b(ajoute|ajouter|rajoute|rajouter|insere|inclus|prevoi[st])\b/.test(text)) return 'add-activity';
  return 'adjust-itinerary';
}

export function isOutOfScopeTravelRequest(instruction: string) {
  return OUT_OF_SCOPE.test(normaliseText(instruction));
}

function activityCount(itinerary: Itinerary) {
  return itinerary.days.reduce((total, day) => total + day.activities.length, 0);
}

/** Ensures the generated proposal did actually perform the requested operation. */
export function validateEditEffect(before: Itinerary, after: Itinerary, intent: EditIntent): string | undefined {
  const daysDelta = after.days.length - before.days.length;
  const activitiesDelta = activityCount(after) - activityCount(before);
  const unchanged = JSON.stringify({ ...before, cover: undefined }) === JSON.stringify({ ...after, cover: undefined });

  if (unchanged) return 'La proposition ne modifie pas réellement votre itinéraire.';
  if (intent === 'add-day' && daysDelta < 1) return 'La proposition devait ajouter une journée, mais aucune journée complète n’a été ajoutée.';
  if (intent === 'remove-day' && daysDelta > -1) return 'La proposition devait supprimer une journée, mais aucune journée n’a été retirée.';
  if (intent === 'add-activity' && activitiesDelta < 1) return 'La proposition devait ajouter une activité, mais aucune activité supplémentaire n’a été ajoutée.';
  if (intent === 'remove-activity' && activitiesDelta > -1) return 'La proposition devait supprimer une activité, mais aucune activité n’a été retirée.';
}
