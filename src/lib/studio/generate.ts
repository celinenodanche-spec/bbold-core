/**
 * Génération de contenu structuré par plateforme (agent Léa — createur-contenu).
 * Instagram / LinkedIn / Twitter(X). Claude renvoie un JSON adapté au réseau,
 * ensuite affiché dans un aperçu qui imite le rendu réel du réseau.
 */
import { createAnthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { brandSystemBlock, type Brand } from "./brand";
import { styleProfileBlock, type StyleProfile } from "./inspirations";
import { styleById } from "./styles";

export type Platform = "instagram" | "linkedin" | "twitter";
export type Format =
  | "carousel" // IG + LinkedIn
  | "post" // IG (image + caption) / LinkedIn (texte)
  | "image" // LinkedIn image + texte accroche
  | "tweet" // Twitter simple
  | "thread" // Twitter thread
  | "story"; // IG story 9:16 (1 à 3 écrans)

export interface Slide { title: string; body: string }

export interface ContentResult {
  platform: Platform;
  format: Format;
  slides?: Slide[]; // carousel
  caption?: string; // légende sous le post (IG/LinkedIn)
  hashtags?: string[];
  headline?: string; // gros texte d'accroche (image LinkedIn/IG)
  body?: string; // corps du post
  tweets?: string[]; // thread twitter
  cta?: string; // texte court d'appel à l'action (story / post IG)
}

const VOICE = `Voix NAIOM : experte mais accessible, zéro jargon creux (pas de "synergie", "game-changer"), phrases courtes, on parle AU lecteur ("vous"/"tu" selon le réseau). NAIOM = agence d'ingénierie d'agents IA + automatisations n8n.`;

// Voix LinkedIn de Zeyneb (d'après ses posts réels)
const LI_VOICE = `VOIX ZEYNEB (à respecter absolument) :
- 1re ligne = HOOK choc / breaking-news / affirmation forte (ex. "🚨 ALERTE : Anthropic vient de sortir Claude…", "Claude vient de tuer la recherche de clients."). Court, ça claque, ça donne envie de cliquer "voir plus".
- Ligne vide, puis corps TRÈS AÉRÉ : une idée par ligne, phrases courtes, beaucoup de sauts de ligne (\\n\\n).
- Utilise des flèches "→" pour énumérer des points concrets.
- Ton direct, tutoiement, zéro corporate, zéro jargon creux. Concret, orienté résultat.
- Termine par un CTA clair : soit "Commente « MOT » et je t'envoie X en DM", soit une question ouverte.
- Pas de hashtags dans le body (ils vont dans "hashtags").`;

function instructions(platform: Platform, format: Format, template?: string, hasBrand = false): string {
  const liVoice = hasBrand ? "VOIX : celle de la marque (CONTEXTE DE MARQUE ci-dessus : hook, structure, ton, interdictions) — non négociable." : LI_VOICE;
  const tmpl = template ? `\nStyle/DA visuelle choisie : "${template}" — adapte le ton des textes à cette ambiance.` : "";
  if (format === "carousel") {
    const n = platform === "instagram" ? "6 à 8" : "7 à 10";
    const ig = platform === "instagram";
    return `Format : CARROUSEL ${platform}${ig ? " (visuels 4:5)" : ""}. Produis ${n} slides.
- slide 1 = HOOK (accroche courte, ≤ 8 mots en "title", + 1 phrase "body" ≤ 20 mots).
- slides intermédiaires = 1 idée par slide (title = idée clé ≤ 9 mots, body = 1-2 phrases concrètes ≤ 35 mots).
- dernière slide = CTA clair (title = l'invitation, body = pourquoi).
${ig ? '"cta" = texte court affiché sur la dernière slide (≤ 4 mots, ex. "Commente BOLD"). ' : ""}"caption" = légende complète (hook en 1re ligne, 3 paragraphes max, CTA final).
Réponds en JSON: {"slides":[{"title":"","body":""}],${ig ? '"cta":"",' : ""}"caption":"","hashtags":["#..."]}.${tmpl}`;
  }
  if (platform === "twitter" && format === "thread") {
    return `Format : THREAD X (Twitter). 5 à 7 tweets. Tweet 1 = hook fort. Chaque tweet ≤ 270 caractères, autonome. Numérote pas.
Réponds en JSON: {"tweets":["tweet1","tweet2",...]}.`;
  }
  if (platform === "linkedin" && format === "image") {
    return `Format : POST LinkedIn IMAGE + texte. "headline" = accroche forte qui ira EN GROS sur le visuel (≤ 12 mots). "body" = le post LinkedIn dans la VOIX définie.
${liVoice}
Réponds en JSON: {"headline":"","body":"","hashtags":["#..."]}.${tmpl}`;
  }
  if (platform === "twitter" && format === "image") {
    return `Format : POST X (Twitter) avec VISUEL. "headline" = accroche courte forte qui ira EN GROS sur l'image (≤ 10 mots). "body" = le tweet (≤ 270 caractères, percutant).
Réponds en JSON: {"headline":"","body":"","hashtags":["#..."]}.${tmpl}`;
  }
  if (platform === "twitter") {
    return `Format : TWEET unique X (Twitter), ≤ 270 caractères, percutant, un angle fort.
Réponds en JSON: {"body":"le tweet","hashtags":["#..."]}.`;
  }
  if (platform === "linkedin") {
    return `Format : POST LinkedIn texte, dans la VOIX définie.
${liVoice}
Réponds en JSON: {"body":"le post complet avec sauts de ligne \\n","hashtags":["#..."]}.`;
  }
  if (platform === "instagram" && format === "story") {
    return `Format : STORY Instagram (vertical 9:16), 1 à 3 écrans qui s'enchaînent. Écran 1 = hook fort (title ≤ 8 mots, body ≤ 18 mots). Écrans suivants = développement court (title ≤ 8 mots, body ≤ 25 mots). "cta" = texte d'un sticker d'action (≤ 5 mots, ex. "Réponds à cette story", "Lien en bio").
Réponds en JSON: {"slides":[{"title":"","body":""}],"cta":"","caption":"1 phrase pour accompagner (optionnel)","hashtags":[]}.${tmpl}`;
  }
  // instagram post
  return `Format : POST Instagram simple (1 visuel 4:5 + légende). "headline" = accroche forte qui ira EN GROS sur le visuel (≤ 10 mots). "body" = 1 phrase de sous-titre pour le visuel (≤ 20 mots). "cta" = micro appel à l'action affiché en bas du visuel (≤ 4 mots, ex. "Sauvegarde ce post"). "caption" = légende complète (hook en 1re ligne, 3 paragraphes max, CTA final).
Réponds en JSON: {"headline":"","body":"","cta":"","caption":"","hashtags":["#..."]}.${tmpl}`;
}

/** Échappe les retours-ligne/tab bruts À L'INTÉRIEUR des chaînes JSON (Claude en met parfois). */
function escapeCtrlInStrings(s: string): string {
  let out = "";
  let inStr = false, esc = false;
  for (const ch of s) {
    if (esc) { out += ch; esc = false; continue; }
    if (ch === "\\") { out += ch; esc = true; continue; }
    if (ch === '"') { inStr = !inStr; out += ch; continue; }
    if (inStr && (ch === "\n" || ch === "\r" || ch === "\t")) {
      out += ch === "\n" ? "\\n" : ch === "\r" ? "\\r" : "\\t";
      continue;
    }
    out += ch;
  }
  return out;
}

export interface GenerateOpts {
  brand?: Brand | null;          // clients/<client>/brand.md → ton, cible, interdictions
  profile?: StyleProfile | null; // profil déduit des visuels d'inspiration
  styleId?: string | null;       // style éditorial choisi dans le studio
}

export async function generateContent(
  platform: Platform,
  format: Format,
  idea: string,
  template?: string,
  opts: GenerateOpts = {}
): Promise<ContentResult> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY absente dans .env.local.");
  const brand = opts.brand ?? null;
  const who = brand ? `Tu es Zara, copywriter senior pour ${brand.name}.` : `Tu es Zara, copywriter senior chez NAIOM.\n${VOICE}`;
  const system = `${who} Tu écris du contenu réseaux sociaux qui performe.
Tu réponds UNIQUEMENT avec un objet JSON valide conforme au format demandé (aucun texte autour, pas de bloc markdown).${brandSystemBlock(brand)}`;
  const style = platform === "instagram" && opts.styleId ? styleById(opts.styleId) : null;
  const prompt = `Plateforme : ${platform}
${instructions(platform, format, template, !!brand)}${style ? `\n\n${style.text}` : ""}${styleProfileBlock(opts.profile ?? null)}

IDÉE / SUJET : ${idea}

Rends le JSON maintenant.`;

  const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const { text } = await generateText({
    model: anthropic("claude-sonnet-5"),
    maxOutputTokens: format === "carousel" || format === "thread" ? 4500 : 2500,

    system,
    prompt,
  });
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  let j: Partial<ContentResult> = {};
  try { j = JSON.parse(cleaned) as Partial<ContentResult>; }
  catch {
    try { j = JSON.parse(escapeCtrlInStrings(cleaned)) as Partial<ContentResult>; }
    catch { j = { body: cleaned }; }
  }
  return {
    platform, format,
    slides: j.slides,
    caption: j.caption,
    hashtags: j.hashtags,
    headline: j.headline,
    body: j.body,
    tweets: j.tweets,
    cta: typeof j.cta === "string" ? j.cta : undefined,
  };
}
