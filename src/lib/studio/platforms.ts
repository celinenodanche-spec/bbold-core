/**
 * Réseaux affichés dans le studio.
 *
 * Le code des trois réseaux (Instagram, LinkedIn, X) est complet et reste en place.
 * Ce fichier décide seulement lesquels sont PROPOSÉS : onglets du Studio, formats
 * suggérés par Zara dans la Discussion, brief envoyé au Studio.
 *
 * Réglage : variable d'environnement NEXT_PUBLIC_STUDIO_PLATFORMS, liste séparée
 * par des virgules. Exemples :
 *   NEXT_PUBLIC_STUDIO_PLATFORMS=instagram                     (défaut : studio de Céline)
 *   NEXT_PUBLIC_STUDIO_PLATFORMS=instagram,linkedin
 *   NEXT_PUBLIC_STUDIO_PLATFORMS=instagram,linkedin,twitter    (tout ouvrir)
 * Sur Vercel : Settings → Environment Variables, puis REDÉPLOYER (la valeur est
 * figée dans le code du navigateur au moment du build).
 *
 * Les contenus LinkedIn / X déjà créés restent visibles dans la Bibliothèque,
 * même quand leur réseau n'est plus proposé.
 *
 * Fichier SANS import node : utilisable côté navigateur et côté serveur.
 */
export type StudioPlatform = "instagram" | "linkedin" | "twitter";
export const ALL_PLATFORMS: StudioPlatform[] = ["instagram", "linkedin", "twitter"];
const DEFAULT_PLATFORMS: StudioPlatform[] = ["instagram"];

/** Formats de chaque réseau, tels que Zara les présente dans la Discussion. */
export const PLATFORM_FORMATS_TEXT: Record<StudioPlatform, string> = {
  instagram: "Instagram (post 4:5, carrousel 4:5, story 9:16)",
  linkedin: "LinkedIn (post avec visuel, carrousel, post texte)",
  twitter: "X (post avec visuel, tweet, thread)",
};

export function parsePlatforms(raw: string | undefined | null): StudioPlatform[] {
  const wanted = (raw ?? "").toLowerCase().split(/[\s,;]+/).map((s) => (s === "x" ? "twitter" : s)).filter(Boolean);
  // on garde l'ordre canonique, pas celui de la variable : les onglets ne bougent pas d'un déploiement à l'autre
  const out = ALL_PLATFORMS.filter((p) => wanted.includes(p));
  return out.length ? out : DEFAULT_PLATFORMS; // variable absente, vide ou mal écrite → on ne laisse jamais le studio sans réseau
}

// Accès LITTÉRAL obligatoire : Next ne remplace process.env.NEXT_PUBLIC_… dans le code navigateur que sous cette forme exacte.
export const ENABLED_PLATFORMS: StudioPlatform[] = parsePlatforms(process.env.NEXT_PUBLIC_STUDIO_PLATFORMS);
export const isPlatformEnabled = (p: unknown): p is StudioPlatform => ENABLED_PLATFORMS.includes(p as StudioPlatform);
