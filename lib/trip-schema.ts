import { z } from 'zod';

const locationSchema = z.object({
  label: z.string().trim().min(2).max(160),
  address: z.string().trim().max(240).optional(),
});

const transitSchema = z.object({
  mode: z.enum(['plane', 'train', 'car', 'other']).optional(),
  origin: locationSchema.optional(),
  destination: locationSchema.optional(),
  dateTime: z.string().datetime().optional(),
  bufferMinutes: z.number().int().min(0).max(360).default(60),
});

export const tripRequestSchema = z
  .object({
    title: z.string().trim().min(2).max(100).optional(),
    startDate: z.string().date(),
    endDate: z.string().date(),
    travellers: z.number().int().min(1).max(12),
    budget: z.number().int().min(0).max(100000).optional(),
    interests: z.array(z.string().trim().min(2).max(40)).max(8).default([]),
    pace: z.enum(['relaxed', 'balanced', 'intense']).default('balanced'),
    cities: z.array(z.object({
      city: locationSchema,
      nights: z.number().int().min(1).max(30),
      accommodation: locationSchema.optional(),
    })).min(1).max(8),
    arrival: transitSchema.optional(),
    departure: transitSchema.optional(),
  })
  .superRefine((trip, ctx) => {
    const start = new Date(`${trip.startDate}T00:00:00Z`);
    const end = new Date(`${trip.endDate}T00:00:00Z`);
    if (end < start) ctx.addIssue({ code: 'custom', path: ['endDate'], message: 'La date de départ doit suivre la date d’arrivée.' });
    const totalNights = Math.round((end.getTime() - start.getTime()) / 86_400_000);
    const cityNights = trip.cities.reduce((sum, city) => sum + city.nights, 0);
    if (totalNights !== cityNights) {
      ctx.addIssue({ code: 'custom', path: ['cities'], message: `Les étapes totalisent ${cityNights} nuit(s), alors que le séjour en compte ${totalNights}.` });
    }
  });

export type TripRequest = z.infer<typeof tripRequestSchema>;

export const itinerarySchema = z.object({
  title: z.string().min(2).max(120),
  summary: z.string().min(20).max(600),
  cover: z.object({
    imageUrl: z.string().url(), alt: z.string().min(1).max(240), photographerName: z.string().min(1).max(120),
    photographerUrl: z.string().url(), unsplashUrl: z.string().url(),
  }).optional(),
  logistics: z.object({
    arrivalPlan: z.string().max(500).optional(),
    departurePlan: z.string().max(500).optional(),
    warnings: z.array(z.string().max(240)).max(8),
  }),
  days: z.array(z.object({
    date: z.string().date(),
    city: z.string().min(2).max(120),
    theme: z.string().min(2).max(120),
    activities: z.array(z.object({
      time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
      title: z.string().min(2).max(160),
      location: z.string().min(2).max(200),
      durationMinutes: z.number().int().min(15).max(600),
      travelNote: z.string().max(240).optional(),
      bookingNote: z.string().max(240).optional(),
    })).min(1).max(8),
  })).min(1).max(31),
});

export type Itinerary = z.infer<typeof itinerarySchema>;

export const itineraryEditRequestSchema = z.object({
  instruction: z.string().trim().min(4).max(1_200),
  itinerary: itinerarySchema,
});

export const itineraryEditProposalSchema = z.object({
  summary: z.string().trim().min(12).max(500),
  changes: z.array(z.string().trim().min(3).max(220)).min(1).max(8),
  itinerary: itinerarySchema,
});

export type ItineraryEditProposal = z.infer<typeof itineraryEditProposalSchema>;

export const itineraryJsonSchema = {
  type: 'object',
  required: ['title', 'summary', 'logistics', 'days'],
  properties: {
    title: { type: 'string' }, summary: { type: 'string' },
    logistics: {
      type: 'object', required: ['warnings'], properties: {
        arrivalPlan: { type: 'string' }, departurePlan: { type: 'string' }, warnings: { type: 'array', items: { type: 'string' } },
      },
    },
    days: {
      type: 'array', items: {
        type: 'object', required: ['date', 'city', 'theme', 'activities'], properties: {
          date: { type: 'string' }, city: { type: 'string' }, theme: { type: 'string' },
          activities: {
            type: 'array', items: {
              type: 'object', required: ['time', 'title', 'location', 'durationMinutes'], properties: {
                time: { type: 'string' }, title: { type: 'string' }, location: { type: 'string' }, durationMinutes: { type: 'integer' }, travelNote: { type: 'string' }, bookingNote: { type: 'string' },
              },
            },
          },
        },
      },
    },
  },
} as const;

export const itineraryEditProposalJsonSchema = {
  type: 'object',
  required: ['summary', 'changes', 'itinerary'],
  properties: {
    summary: { type: 'string' },
    changes: { type: 'array', minItems: 1, items: { type: 'string' } },
    itinerary: itineraryJsonSchema,
  },
} as const;
