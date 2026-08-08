import 'server-only';

import { GoogleGenAI } from '@google/genai';

const DEFAULT_MODEL = 'gemini-2.5-flash';

export function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) return undefined;
  return new GoogleGenAI({ apiKey });
}

export function getGeminiModel() {
  return process.env.GEMINI_MODEL ?? DEFAULT_MODEL;
}

export function getRequestId() {
  return crypto.randomUUID();
}

export function logApiError(operation: string, requestId: string, error: unknown) {
  console.error(JSON.stringify({
    level: 'error',
    operation,
    requestId,
    message: error instanceof Error ? error.message : 'unknown',
  }));
}
