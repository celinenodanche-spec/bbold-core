/**
 * Contexte de marque B.BOLD pour le studio de Zara.
 * BBold Core EST l'app de B.BOLD Agency : la marque est embarquée (pas de
 * fichier clients/ à charger). Même interface que le brand.ts de Léa côté NAIOM,
 * pour que render / inspirations / generate compilent sans changement.
 */
import path from "node:path";

export interface BrandPalette { bg: string; fg: string; accent: string; accent2: string; muted: string }
export interface BrandFonts { display: string; body: string }
export interface Brand {
  slug: string;
  name: string;
  handle: string;
  palette: BrandPalette;
  fonts: BrandFonts;
  markdown: string;
  dir: string;         // dossier de travail (inspirations, style.json) — écrivable
  isTemplate: boolean;
}

/** Dossier de données local du studio (inspirations, store). */
export const STUDIO_DATA_DIR = path.join(process.cwd(), "studio-data");

const BBOLD_MARKDOWN = `# B.BOLD Agency — contexte de marque

## Positionnement
Agence de brand strategy et création de contenu pour les entrepreneurs et marques
des territoires insulaires français (Martinique, Guadeloupe, Guyane, La Réunion).
Promesse : une marque audacieuse, structurée et qui convertit, avec une vraie
connaissance du tissu économique local.

## Ton de voix
Cash, chaleureux, professionnel, jamais de clichés. Tutoiement, direct, on parle
AU lecteur. Hook ≤ 15 mots qui donne envie de cliquer « voir plus ». Corps en
prose fluide, 3 paragraphes max — jamais de listes à puces dans le corps des posts.
Authentique et territorial quand c'est pertinent, sans folklore ni caricature.
Concret, orienté résultat. CTA clair en fin (question ouverte ou action simple).

## Interdictions
Pas de jargon creux (« synergie », « game-changer », « disruptif »). Pas de listes
à puces dans le corps des posts. Pas de clichés sur les îles (soleil/plage/cocotiers
comme argument). Pas de promesses chiffrées non vérifiables. Pas d'anglicismes
gratuits. Ne jamais mentionner de clients réels sans accord.

## Cible (ICP)
Entrepreneur·e ou dirigeant·e de TPE/PME aux Antilles-Guyane / Réunion, 28–50 ans,
ambitieux·se, souvent isolé·e. Douleurs : manque de temps, communication brouillonne,
difficulté à se démarquer. Aspiration : une marque forte et un accompagnement qui
parle son langage.`;

export const BBOLD_BRAND: Brand = {
  slug: "bbold-core",
  name: "B.BOLD Agency",
  handle: "@bboldagency",
  palette: { bg: "#0a0008", fg: "#faf8fb", accent: "#c9a84c", accent2: "#7c3aed", muted: "#c4b5fd" },
  fonts: { display: "Playfair Display", body: "Inter" },
  markdown: BBOLD_MARKDOWN,
  dir: path.join(STUDIO_DATA_DIR, "bbold-core"),
  isTemplate: false,
};

/** Toujours la marque B.BOLD (l'app lui est dédiée). */
export async function loadBrand(): Promise<Brand | null> {
  return BBOLD_BRAND;
}

/** Bloc à coller dans un system prompt : la marque, non négociable. */
export function brandSystemBlock(b: Brand | null): string {
  if (!b) return "";
  return `\n\n---\n\n# CONTEXTE DE MARQUE — ${b.name}\nTu écris POUR cette marque. Son ton, sa cible et ses interdictions sont NON NÉGOCIABLES et priment sur toute autre consigne de style. Signature : ${b.handle}.\n\n${b.markdown}\n\n---`;
}
