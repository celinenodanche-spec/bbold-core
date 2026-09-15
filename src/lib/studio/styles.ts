/**
 * Styles éditoriaux au choix dans le studio. Chaque style pilote :
 *  - `text`   : consignes d'écriture données à Léa (ton, structure, rythme)
 *  - `visual` : paramètres de mise en page du rendu HTML → PNG
 * Fichier SANS import node : utilisable côté client (ContentStudio) et serveur.
 */
export type StyleId = "magazine" | "bold" | "minimal" | "storytelling" | "educatif" | "premium";

export interface EditorialStyle {
  id: StyleId;
  label: string;
  desc: string;
  text: string;
  visual: {
    display: "serif" | "sans";  // titres : "serif" = police display de la marque, "sans" = police texte de la marque
    upper: boolean;             // titres en capitales
    align: "left" | "center";
    accentItalic: boolean;      // dernier mot du titre en italique couleur accent
    decor: "lines" | "blocks" | "numbers" | "none" | "grid";
    density: "airy" | "dense";
    dark: boolean;              // fond sombre par défaut (sinon fond clair)
  };
}

export const STYLES: EditorialStyle[] = [
  {
    id: "magazine", label: "Magazine", desc: "Éditorial, serif élégant, aéré",
    text: "STYLE ÉDITORIAL MAGAZINE : phrases ciselées, rythme lent, une idée forte par écran. Titres courts en serif, un mot clé mis en valeur. Ton posé, assuré, jamais criard. Sous-titres en une phrase qui prolonge le titre.",
    visual: { display: "serif", upper: false, align: "left", accentItalic: true, decor: "lines", density: "airy", dark: true },
  },
  {
    id: "bold", label: "Bold", desc: "Percutant, capitales, contrastes",
    text: "STYLE BOLD & PERCUTANT : titres très courts (≤ 6 mots), affirmations tranchées, verbes d'action, zéro adverbe mou. Chaque slide claque comme un slogan. Le corps est bref (≤ 18 mots), direct, tutoiement franc.",
    visual: { display: "sans", upper: true, align: "left", accentItalic: false, decor: "blocks", density: "dense", dark: true },
  },
  {
    id: "minimal", label: "Minimal", desc: "Épuré, beaucoup d'espace",
    text: "STYLE MINIMAL : le strict nécessaire. Une phrase par écran, souvent sans corps de texte. Mots simples, précis, silence assumé. Pas d'emoji dans les visuels. La caption peut être plus développée.",
    visual: { display: "sans", upper: false, align: "center", accentItalic: false, decor: "none", density: "airy", dark: false },
  },
  {
    id: "storytelling", label: "Storytelling", desc: "Narratif, intime, émotion",
    text: "STYLE STORYTELLING : on raconte une histoire vraie ou vraisemblable (situation → tension → bascule → leçon). Écriture à la première personne ou 'tu', détails concrets et sensoriels, phrases qui s'enchaînent. Le corps peut atteindre 30 mots par écran. Fin = la leçon, pas une morale.",
    visual: { display: "serif", upper: false, align: "left", accentItalic: true, decor: "none", density: "dense", dark: false },
  },
  {
    id: "educatif", label: "Éducatif", desc: "Pédagogique, étapes, clarté",
    text: "STYLE ÉDUCATIF : on explique pour que ce soit COMPRIS. Structure numérotée (étape 1, 2, 3…), un concept par écran, exemple concret systématique, vocabulaire simple. Titre = le point clé, corps = comment l'appliquer. Fin = récap + action.",
    visual: { display: "sans", upper: false, align: "left", accentItalic: false, decor: "numbers", density: "dense", dark: false },
  },
  {
    id: "premium", label: "Premium", desc: "Sobre, luxe, or sur sombre",
    text: "STYLE PREMIUM : sobriété et maîtrise. Peu de mots, choisis. Vocabulaire précis, élégant, jamais familier (vouvoiement possible si la marque l'autorise, sinon tutoiement soigné). Aucune exclamation. La promesse est implicite, jamais survendue.",
    visual: { display: "serif", upper: true, align: "center", accentItalic: false, decor: "grid", density: "airy", dark: true },
  },
];

export const DEFAULT_STYLE: StyleId = "magazine";
export const styleById = (id?: string | null): EditorialStyle => STYLES.find((s) => s.id === id) ?? STYLES[0];
