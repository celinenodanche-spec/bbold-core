/**
 * Modèles d'inspiration : visuels chargés par l'utilisateur dans le studio,
 * stockés dans `clients/<client>/inspirations/`. À partir de 3 visuels, Léa
 * (Claude vision) en extrait un PROFIL DE STYLE (palette, typo, ambiance,
 * motifs) qui pilote le rendu des posts / carrousels / stories.
 */
import { createAnthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import path from "node:path";
import type { Brand } from "./brand";
import { putData, getData, listData, delData, useBlob, mimeOf } from "./storage";

export const MIN_INSPIRATIONS = 3;
const MAX_FILES = 20;
const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp"]);

/** Polices Google Fonts que le rendu sait charger. */
export const FONT_CHOICES = [
  "Playfair Display", "Inter", "DM Serif Display", "Space Grotesk", "Cormorant Garamond", "Montserrat",
  "Bebas Neue", "Fraunces", "Manrope", "Lora", "Archivo Black", "Poppins",
] as const;

export interface StyleProfile {
  summary: string;                                   // 2-3 phrases : le style en mots
  palette: { bg: string; fg: string; accent: string; accent2: string; muted: string };
  fonts: { display: string; body: string };
  mood: string[];                                     // ex. ["premium", "chaleureux"]
  layout: { density: "airy" | "dense"; align: "left" | "center"; dark: boolean };
  typography: { upper: boolean; accentItalic: boolean };
  elements: string[];                                 // motifs graphiques observés (lignes fines, cadres, grain…)
  avoid: string[];                                    // ce que le style N'EST PAS
  analyzedAt: string;
  files: string[];
}

export interface Inspiration { name: string; url: string; size: number; addedAt: string }

const inspKey = (b: Brand, name: string) => `${b.slug}/inspirations/${name}`;
const profileKey = (b: Brand) => `${b.slug}/style.json`;
const inspPrefix = (b: Brand) => `${b.slug}/inspirations`;
const uiUrl = (b: Brand, name: string, blobUrl: string) => (useBlob() ? blobUrl : `/api/studio/content/inspirations/file/${encodeURIComponent(name)}?brand=${encodeURIComponent(b.slug)}`);
const safeName = (n: string) => n.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/^\.+/, "").slice(0, 80);

export async function listInspirations(b: Brand): Promise<Inspiration[]> {
  const entries = (await listData(inspPrefix(b))).filter((e) => /\.(png|jpe?g|webp)$/i.test(e.name));
  entries.sort((a, x) => (a.name < x.name ? -1 : 1));
  return entries.map((e) => ({ name: e.name, url: uiUrl(b, e.name, e.url), size: e.size, addedAt: e.addedAt }));
}

export async function addInspiration(b: Brand, file: File): Promise<Inspiration> {
  if (!ALLOWED.has(file.type)) throw new Error(`Format non supporté (${file.type || "inconnu"}). Utilise PNG, JPG ou WebP.`);
  if (file.size > 12 * 1024 * 1024) throw new Error("Image trop lourde (12 Mo max).");
  const existing = await listInspirations(b);
  if (existing.length >= MAX_FILES) throw new Error(`Maximum ${MAX_FILES} visuels d'inspiration.`);
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const base = safeName(file.name.replace(/\.[^.]+$/, "")) || "inspiration";
  const name = `${Date.now().toString(36)}-${base}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());
  const stored = await putData(inspKey(b, name), buf, file.type);
  return { name, url: uiUrl(b, name, stored), size: buf.length, addedAt: new Date().toISOString() };
}

export async function removeInspiration(b: Brand, name: string): Promise<void> {
  const clean = path.basename(name);
  if (!clean || clean === "style.json") return;
  await delData(inspKey(b, clean));
}

export async function readInspirationFile(b: Brand, name: string): Promise<{ buf: Buffer; mime: string } | null> {
  const clean = path.basename(name);
  if (!/\.(png|jpe?g|webp)$/i.test(clean)) return null;
  const buf = await getData(inspKey(b, clean));
  return buf ? { buf, mime: mimeOf(clean) } : null;
}

export async function loadStyleProfile(b: Brand): Promise<StyleProfile | null> {
  const buf = await getData(profileKey(b));
  if (!buf) return null;
  try { return JSON.parse(buf.toString("utf-8")) as StyleProfile; } catch { return null; }
}

export async function clearStyleProfile(b: Brand): Promise<void> {
  await delData(profileKey(b));
}

const HEX = /^#[0-9a-fA-F]{6}$/;
const hexOr = (v: unknown, fb: string) => (typeof v === "string" && HEX.test(v.trim()) ? v.trim() : fb);
const fontOr = (v: unknown, fb: string) => (typeof v === "string" && (FONT_CHOICES as readonly string[]).includes(v.trim()) ? v.trim() : fb);
const strs = (v: unknown, max = 8) => (Array.isArray(v) ? v.filter((x) => typeof x === "string").map((x) => String(x).trim()).filter(Boolean).slice(0, max) : []);

/**
 * Analyse les visuels d'inspiration avec Claude (vision) → StyleProfile.
 * Exige MIN_INSPIRATIONS visuels. Le profil est sauvegardé dans style.json.
 */
export async function analyzeInspirations(b: Brand): Promise<StyleProfile> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY absente dans .env.local.");
  const files = await listInspirations(b);
  if (files.length < MIN_INSPIRATIONS) throw new Error(`Charge au moins ${MIN_INSPIRATIONS} visuels d'inspiration (${files.length} pour l'instant).`);

  const images: { type: "image"; image: Buffer; mediaType: string }[] = [];
  for (const f of files) {
    const r = await readInspirationFile(b, f.name);
    if (r) images.push({ type: "image", image: r.buf, mediaType: r.mime });
  }

  const prompt = `Voici ${images.length} visuels que la marque « ${b.name} » aime et veut prendre comme MODÈLES D'INSPIRATION pour ses posts Instagram.
Analyse-les ENSEMBLE (ce qu'ils ont en commun) et décris le style à reproduire.

Contexte marque (pour trancher si les visuels hésitent) : palette actuelle bg ${b.palette.bg}, texte ${b.palette.fg}, accent ${b.palette.accent}, accent2 ${b.palette.accent2} ; typos ${b.fonts.display} / ${b.fonts.body}.

Réponds UNIQUEMENT avec un JSON valide (aucun texte autour) :
{
 "summary": "2-3 phrases en français qui décrivent le style commun (ambiance, composition, typographie, couleurs)",
 "palette": {"bg":"#hex fond dominant","fg":"#hex texte principal","accent":"#hex accent principal","accent2":"#hex accent secondaire","muted":"#hex texte secondaire"},
 "fonts": {"display":"<une police parmi : ${FONT_CHOICES.join(", ")}> la plus proche des titres","body":"<une police de la même liste> pour le texte"},
 "mood": ["3-5 adjectifs"],
 "layout": {"density":"airy|dense","align":"left|center","dark": true|false},
 "typography": {"upper": true|false (titres en capitales ?), "accentItalic": true|false (un mot mis en valeur en italique/couleur ?)},
 "elements": ["3-6 motifs graphiques récurrents : lignes fines, cadres, grain, formes géométriques, photos plein cadre, dégradés…"],
 "avoid": ["3-5 choses que ce style N'EST PAS (ex. emojis, néons, clipart)"]
}
Les couleurs doivent être des hex 6 caractères, contrastées (le texte doit être lisible sur le fond).`;

  const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const { text } = await generateText({
    model: anthropic("claude-sonnet-5"),
    maxOutputTokens: 1500,
    messages: [{ role: "user", content: [...images, { type: "text", text: prompt }] }],
  });
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  let j: Record<string, unknown> = {};
  try { j = JSON.parse(cleaned) as Record<string, unknown>; } catch { throw new Error("Léa n'a pas renvoyé un profil de style lisible. Réessaie."); }
  const p = (j.palette ?? {}) as Record<string, unknown>;
  const f = (j.fonts ?? {}) as Record<string, unknown>;
  const l = (j.layout ?? {}) as Record<string, unknown>;
  const t = (j.typography ?? {}) as Record<string, unknown>;
  const profile: StyleProfile = {
    summary: typeof j.summary === "string" ? j.summary.trim() : "",
    palette: {
      bg: hexOr(p.bg, b.palette.bg), fg: hexOr(p.fg, b.palette.fg), accent: hexOr(p.accent, b.palette.accent),
      accent2: hexOr(p.accent2, b.palette.accent2), muted: hexOr(p.muted, b.palette.muted),
    },
    fonts: { display: fontOr(f.display, b.fonts.display), body: fontOr(f.body, b.fonts.body) },
    mood: strs(j.mood, 6),
    layout: { density: l.density === "dense" ? "dense" : "airy", align: l.align === "center" ? "center" : "left", dark: typeof l.dark === "boolean" ? l.dark : true },
    typography: { upper: t.upper === true, accentItalic: t.accentItalic !== false },
    elements: strs(j.elements, 8),
    avoid: strs(j.avoid, 6),
    analyzedAt: new Date().toISOString(),
    files: files.map((x) => x.name),
  };
  await putData(profileKey(b), Buffer.from(JSON.stringify(profile, null, 2), "utf-8"), "application/json");
  return profile;
}

/** Bloc prompt : ce que les visuels d'inspiration disent du style (pour Léa, côté texte). */
export function styleProfileBlock(p: StyleProfile | null): string {
  if (!p) return "";
  return `\n\nPROFIL DE STYLE (déduit des visuels d'inspiration chargés par la marque) : ${p.summary} Ambiance : ${p.mood.join(", ")}. À éviter : ${p.avoid.join(", ")}.`;
}
