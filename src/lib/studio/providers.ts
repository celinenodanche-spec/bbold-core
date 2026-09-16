/**
 * Détection du fournisseur de fond IA — module LÉGER (aucun import Chrome/puppeteer),
 * pour que la route "brand" (chargée à chaque ouverture du studio) reste fiable et rapide.
 */
import { isOpenAIImageConfigured, openAIImageModel, openAIImageModelBatch } from "./openaiImage";
import { isNanoBananaConfigured } from "./nanoBanana";

export function aiBackgroundProvider(fast = false): { id: "openai" | "gemini"; label: string } | null {
  if (isOpenAIImageConfigured()) return { id: "openai", label: `GPT Image 2.5 (${(fast ? openAIImageModelBatch() : openAIImageModel()).replace("gpt-image-2.5-", "")})` };
  if (isNanoBananaConfigured()) return { id: "gemini", label: "Gemini (Nano Banana)" };
  return null;
}
