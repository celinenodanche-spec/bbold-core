import { createAnthropic } from "@ai-sdk/anthropic";
import { generateText, type ModelMessage } from "ai";
import { loadBrand } from "@/lib/studio/brand";
import { ENABLED_PLATFORMS } from "@/lib/studio/platforms";

export const runtime = "nodejs";
export const maxDuration = 60;

// Seuls les réseaux proposés dans ce studio (cf. lib/studio/platforms.ts) peuvent sortir d'un brief.
const PLATFORMS = ENABLED_PLATFORMS;
const FORMATS: Record<"instagram" | "linkedin" | "twitter", string[]> = {
  instagram: ["post", "carousel", "story"],
  linkedin: ["image", "carousel", "post"],
  twitter: ["image", "tweet", "thread"],
};

const FORMAT_HELP: Record<"instagram" | "linkedin" | "twitter", string> = {
  instagram: "post, carousel, story",
  linkedin: "image (post avec visuel), carousel, post (texte seul)",
  twitter: "image (post avec visuel), tweet, thread",
};

/** Dernière réponse de Zara, raccourcie : le brief de secours si le résumé échoue. */
function lastWord(messages: { role: string; content: unknown }[]): string {
  const texts = messages.filter((m) => typeof m.content === "string" && (m.content as string).trim());
  const lastUser = [...texts].reverse().find((m) => m.role === "user");
  const lastZara = [...texts].reverse().find((m) => m.role === "assistant");
  // on préfère ce que Zara a proposé (c'est le travail abouti) ; à défaut, la demande de départ
  const hasUser = !!lastUser;
  const pick = hasUser && lastZara ? (lastZara.content as string) : ((lastUser?.content as string) ?? "");
  return pick.trim().slice(0, 1500);
}

/**
 * POST /api/studio/chat/brief { messages, brand? }
 * → { idea, platform?, format? } : la conversation avec Zara condensée en un brief
 * prêt à coller dans le Studio. Ne renvoie JAMAIS d'erreur bloquante : au pire,
 * `idea` reprend le dernier échange tel quel (source: "fallback").
 */
export async function POST(req: Request) {
  let messages: { role: "user" | "assistant"; content: string }[] = [];
  try {
    const body = (await req.json()) as { messages?: unknown; brand?: string };
    if (Array.isArray(body.messages)) {
      messages = (body.messages as { role?: string; content?: unknown }[])
        .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && (m.content as string).trim())
        .map((m) => ({ role: m.role as "user" | "assistant", content: (m.content as string).slice(0, 6000) }));
    }
    // Rien n'a été dit par l'utilisateur : pas de brief à transférer.
    if (!messages.some((m) => m.role === "user")) return Response.json({ idea: "", source: "empty" });
    if (!process.env.ANTHROPIC_API_KEY) return Response.json({ idea: lastWord(messages), source: "fallback" });

    const brand = await loadBrand(body.brand).catch(() => null);
    const transcript = messages.slice(-30).map((m) => `${m.role === "user" ? "UTILISATEUR" : "ZARA"} : ${m.content}`).join("\n\n");
    const system = `Tu condenses une conversation entre un utilisateur et Zara (créatrice de contenu${brand ? ` de ${brand.name}` : ""}) en UN brief de production.
Le brief sera collé tel quel dans le champ « idée de contenu » d'un studio qui génère ensuite le texte et les visuels. Il doit donc contenir TOUT ce qui a été décidé, et rien d'inventé.

Règles :
- Reprends l'idée retenue en dernier. Si plusieurs pistes ont été évoquées sans choix clair, prends la dernière que l'utilisateur a approuvée ; à défaut, la plus aboutie proposée par Zara.
- Garde le concret : sujet, angle, cible, accroche(s) formulée(s), points à dérouler, CTA, mots-clés, mentions de compte. Reprends les formulations validées mot pour mot.
- N'ajoute aucune idée, aucun chiffre, aucun élément absent de la conversation.
- Texte brut, sans markdown, sans titre, sans phrase d'introduction. 1200 caractères maximum.

Réponds UNIQUEMENT avec un JSON valide :
{"idea":"le brief","platform":"${PLATFORMS.join("|")} ou null si non précisé","format":"un format du réseau choisi, ou null si non précisé"}
Formats possibles par réseau : ${PLATFORMS.map((p) => `${p} = ${FORMAT_HELP[p]}`).join(" · ")}.`;

    const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const { text } = await generateText({
      model: anthropic("claude-sonnet-5"),
      system,
      messages: [{ role: "user", content: `CONVERSATION :\n\n${transcript}\n\nRends le JSON maintenant.` }] as ModelMessage[],
      maxOutputTokens: 900,
    });
    const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
    let j: { idea?: unknown; platform?: unknown; format?: unknown } = {};
    try { j = JSON.parse(cleaned.slice(cleaned.indexOf("{"), cleaned.lastIndexOf("}") + 1)); } catch { j = {}; }
    const idea = typeof j.idea === "string" && j.idea.trim() ? j.idea.trim().slice(0, 2000) : "";
    if (!idea) return Response.json({ idea: lastWord(messages), source: "fallback" });
    const platform = PLATFORMS.find((p) => p === j.platform) ?? null;
    // un format n'est retenu que s'il existe sur le réseau annoncé (sinon le studio garderait une combinaison impossible)
    const format = platform && typeof j.format === "string" && FORMATS[platform].includes(j.format) ? j.format : null;
    return Response.json({ idea, platform, format, source: "zara" });
  } catch {
    return Response.json({ idea: lastWord(messages), source: "fallback" });
  }
}
