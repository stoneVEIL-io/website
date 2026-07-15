import { GoogleGenAI } from "@google/genai";

// Single place the AI provider is configured. The rest of the app talks to the
// audit/demo layer, never to a specific vendor — swap the model or key here.
//
// Key resolution: prefer AI_API_KEY; fall back to the legacy GEMINI_API_KEY so
// existing deployments keep working during the rename.
export const AI_MODEL = process.env.AI_MODEL || "gemini-2.0-flash";

export function getAiKey(): string | undefined {
  return process.env.AI_API_KEY || process.env.GEMINI_API_KEY;
}

export function getAiClient(): GoogleGenAI | null {
  const apiKey = getAiKey();
  if (!apiKey) {
    console.warn("AI_API_KEY is not set — audit/demo generation will use fallbacks.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
}
