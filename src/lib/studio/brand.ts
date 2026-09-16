/**
 * Marques du studio (multi-clients). Chaque marque est stockée en JSON
 * (brands/<slug>.json) via la couche storage (local en dev, Vercel Blob en prod).
 * B.BOLD est semée par défaut au premier lancement.
 */
import { getData, putData, listData, delData } from "./storage";

export interface BrandPalette { bg: string; fg: string; accent: string; accent2: string; muted: string }
export interface BrandFonts { display: string; body: string }
export interface Brand {
  slug: string;
  name: string;
  handle: string;
  palette: BrandPalette;
  fonts: BrandFonts;
  markdown: string;   // ton, cible, interdictions (injecté dans les prompts)
  isTemplate: boolean;
}

const BBOLD_MARKDOWN = `# B.BOLD Agency — contexte de marque

## Positionnement
Agence de brand strategy et création de contenu pour les entrepreneurs et marques
des territoires insulaires français (Martinique, Guadeloupe, Guyane, La Réunion).

## Ton de voix
Cash, chaleureux, professionnel, jamais de clichés. Tutoiement, direct. Hook ≤ 15 mots.
Corps en prose fluide, 3 paragraphes max, jamais de listes à puces dans le corps.
Territorial quand c'est pertinent, sans folklore. CTA clair en fin.

## Interdictions
Pas de jargon creux, pas de clichés sur les îles, pas de promesses chiffrées non vérifiables.

## Cible
Entrepreneur·e / dirigeant·e de TPE-PME aux Antilles-Guyane / Réunion, 28–50 ans, ambitieux·se.`;

export const BBOLD_BRAND: Brand = {
  slug: "bbold-core",
  name: "B.BOLD Agency",
  handle: "@bboldagency",
  palette: { bg: "#0a0008", fg: "#faf8fb", accent: "#c9a84c", accent2: "#7c3aed", muted: "#c4b5fd" },
  fonts: { display: "Playfair Display", body: "Inter" },
  markdown: BBOLD_MARKDOWN,
  isTemplate: false,
};

export const slugify = (s: string): string =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "marque";

const brandKey = (slug: string) => `brands/${slug}.json`;

function normalize(raw: unknown): Brand | null {
  if (!raw || typeof raw !== "object") return null;
  const b = raw as Record<string, unknown>;
  if (typeof b.slug !== "string" || typeof b.name !== "string") return null;
  const p = (b.palette ?? {}) as Record<string, unknown>;
  const f = (b.fonts ?? {}) as Record<string, unknown>;
  const hex = (v: unknown, fb: string) => (typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v.trim()) ? v.trim() : fb);
  const str = (v: unknown, fb: string) => (typeof v === "string" && v.trim() ? v.trim() : fb);
  return {
    slug: b.slug, name: b.name,
    handle: str(b.handle, "@" + b.slug),
    palette: {
      bg: hex(p.bg, "#0a0008"), fg: hex(p.fg, "#faf8fb"), accent: hex(p.accent, "#c9a84c"),
      accent2: hex(p.accent2, "#7c3aed"), muted: hex(p.muted, "#c4b5fd"),
    },
    fonts: { display: str(f.display, "Playfair Display"), body: str(f.body, "Inter") },
    markdown: str(b.markdown, ""),
    isTemplate: false,
  };
}

export async function listBrands(): Promise<Brand[]> {
  const out: Brand[] = [];
  try {
    const entries = (await listData("brands")).filter((e) => e.name.endsWith(".json"));
    for (const e of entries) {
      const buf = await getData(`brands/${e.name}`);
      if (buf) { try { const b = normalize(JSON.parse(buf.toString("utf-8"))); if (b) out.push(b); } catch { /* ignore */ } }
    }
  } catch { /* stockage indisponible : on retombe sur B.BOLD ci-dessous */ }
  if (!out.length) {
    // première utilisation (ou stockage muet) : on sème B.BOLD, persisté si possible.
    try { await saveBrand(BBOLD_BRAND); } catch { /* stockage non prêt */ }
    return [BBOLD_BRAND];
  }
  return out.sort((a, b) => (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1));
}

export async function getBrand(slug: string): Promise<Brand | null> {
  const buf = await getData(brandKey(slug));
  if (buf) { try { return normalize(JSON.parse(buf.toString("utf-8"))); } catch { return null; } }
  if (slug === BBOLD_BRAND.slug) return BBOLD_BRAND;
  return null;
}

export async function saveBrand(b: Brand): Promise<void> {
  await putData(brandKey(b.slug), Buffer.from(JSON.stringify(b, null, 2), "utf-8"), "application/json");
}

export async function deleteBrand(slug: string): Promise<void> {
  await delData(brandKey(slug));
}

/** Marque active : celle du slug demandé, sinon la première (B.BOLD par défaut). */
export async function loadBrand(slug?: string | null): Promise<Brand | null> {
  if (slug) { const b = await getBrand(slug); if (b) return b; }
  const all = await listBrands();
  return all[0] ?? BBOLD_BRAND;
}

/** Bloc à coller dans un system prompt : la marque, non négociable. */
export function brandSystemBlock(b: Brand | null): string {
  if (!b) return "";
  return `\n\n---\n\n# CONTEXTE DE MARQUE — ${b.name}\nTu écris POUR cette marque. Son ton, sa cible et ses interdictions sont NON NÉGOCIABLES et priment sur toute autre consigne de style. Signature : ${b.handle}.\n\n${b.markdown}\n\n---`;
}
