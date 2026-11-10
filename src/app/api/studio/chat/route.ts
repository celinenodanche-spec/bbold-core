import { createAnthropic } from "@ai-sdk/anthropic";
import { streamText, type ModelMessage } from "ai";
import { loadBrand, brandSystemBlock } from "@/lib/studio/brand";
import { ENABLED_PLATFORMS, PLATFORM_FORMATS_TEXT } from "@/lib/studio/platforms";

export const runtime = "nodejs";
export const maxDuration = 60;

/** POST /api/studio/chat { messages } → réponse de Zara en streaming (texte). */
export async function POST(req: Request) {
  const { messages, brand: brandSlug } = (await req.json()) as { messages?: ModelMessage[]; brand?: string };
  if (!process.env.ANTHROPIC_API_KEY) return new Response("ANTHROPIC_API_KEY absente.", { status: 500 });
  const brand = await loadBrand(brandSlug);
  const system = `Tu es Zara, directrice artistique et créatrice de contenu de ${brand?.name ?? "la marque"}.
Tu discutes avec l'utilisateur pour préparer ses contenus réseaux sociaux : trouver des idées de posts, des angles, des accroches, choisir le réseau, le format et la direction visuelle (style éditorial).
Formats disponibles dans ce studio : ${ENABLED_PLATFORMS.map((p) => PLATFORM_FORMATS_TEXT[p]).join(", ")}. Ne propose AUCUN autre réseau ni format : le Studio ne saurait pas les produire.
Sois concrète, chaleureuse et cash, tu tutoies. Propose des idées prêtes à l'emploi. Quand une idée est mûre, récapitule-la en quelques lignes (réseau, format, angle, accroche, points clés, CTA) et invite à cliquer sur « Envoyer ce brief au Studio » : ce récapitulatif est repris tel quel pour produire le contenu.${brandSystemBlock(brand)}`;
  const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const result = streamText({
    model: anthropic("claude-sonnet-5"),
    system,
    messages: Array.isArray(messages) ? messages : [],
    maxOutputTokens: 1200,
  });
  return result.toTextStreamResponse();
}
