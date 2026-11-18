/**
 * Identité B.BOLD : l'installation de référence.
 *
 * Chaque valeur ci-dessous est recopiée telle quelle depuis l'ancien code en dur.
 * Une installation client copie _modele.js (pas ce fichier) et remplit la sienne.
 *
 * Les fragments de `market` sont injectés AU MILIEU de phrases des consignes des
 * agents : ils commencent donc par une espace ou une ponctuation. Une chaîne vide
 * ('') retire la mention sans casser la phrase.
 */
const bbold = {
  id: 'bbold',

  // ─── Noms ──────────────────────────────────────────────────────────────────
  name: 'B.BOLD',                     // nom court : en-tête, logo texte, signatures
  agency: 'B.BOLD Agency',            // nom complet : « Tu es Zara, Designer de … »
  product: 'Core',                    // suffixe affiché à côté du nom
  productFull: 'B.BOLD Core',         // nom de la plateforme
  orchestrator: 'Céline',             // prénom de l'orchestratrice
  title: 'B.BOLD Core — Multi-Agent Platform',
  description: 'Plateforme multiagent B.BOLD Agency',

  // ─── Visuel ────────────────────────────────────────────────────────────────
  // null → losange « œil » dessiné aux couleurs ci-dessous.
  // Sinon : chemin d'une image dans /public, ex. '/tenants/bbold/logo.svg'.
  logo: null,
  colors: {
    primary: '#6b0f6e',     // violet profond
    secondary: '#c000c0',   // magenta
    accent: '#c9a84c',      // or : boutons, titres, bordures
    accentLight: '#e8cc7a', // or clair
    soft: '#d9a0d9',        // lilas
    softAlt: '#c4b5fd',     // lavande (accent des agents violets)
    bg: '#0a0008',          // fond principal
    bgAlt: '#120010',       // fond des panneaux
    bgDeep: '#0f000e',      // fond de dégradé
    text: '#faf8fb',        // texte principal
  },

  // ─── Marché ────────────────────────────────────────────────────────────────
  market: {
    timeZone: 'America/Martinique',
    timeZoneLabel: 'Martinique (UTC-4)',

    // Fragments des consignes (voir l'en-tête du fichier).
    maevaUI: ' pour les territoires insulaires français. Tu as une connaissance approfondie du tissu économique local — Martinique, Guadeloupe, Guyane, La Réunion et autres DOM-TOM',
    maevaApi: ' pour les territoires insulaires français (Martinique, Guadeloupe, Guyane)',
    pourZone: ' pour les territoires insulaires français',
    brandVoice: ', spécialisé dans les territoires insulaires français (Martinique, Guadeloupe, Guyane)',
    marronniers: ' Tu intègres les marronniers locaux martiniquais si pertinent.',
    veilleRegle: '\n- Pour les Antilles-Guyane : appuie-toi sur les spécificités du marché insulaire, les acteurs locaux réels, les comportements médias propres à ces territoires',
    veilleSection: '\n\n## 🌴 FOCUS TERRITOIRES INSULAIRES\nSpécificités Antilles-Guyane : comportements médias, plateformes dominantes, campagnes locales, opportunités.',
    veilleCible: ' travaillant sur les territoires insulaires français',
    influence: ' pour les territoires insulaires français (Martinique, Guadeloupe, Guyane, La Réunion). Tu connais les spécificités du marché local : prédominance des micro et nano-influenceurs, fort ancrage communautaire, audiences fidèles, codes culturels insulaires',
    offre: '\n\nTu connais le marché de la communication en DOM-TOM et tu adaptes le discours commercial à cette réalité (budget PME local, ROI attendu, relation de confiance primordiale).',
    seoCible: ' des territoires insulaires français',
    seoMarche: '\n\nTu connais les spécificités SEO des marchés insulaires : concurrence locale limitée, fort potentiel sur les requêtes géolocalisées ("imprimerie Martinique", "agence communication Guadeloupe"), importance des avis Google et du référencement local.',

    // Listes « Territoire » des formulaires
    territoireDefaut: 'France + Antilles-Guyane',
    territoiresVeille: ['France + Antilles-Guyane', 'France métropolitaine', 'Martinique', 'Guadeloupe', 'Global'],
    territoiresInfluence: ['Martinique', 'Guadeloupe', 'Guyane', 'La Réunion', 'Tous DOM-TOM', 'France + DOM-TOM'],
  },

  // ─── Exemples affichés dans les champs vides ───────────────────────────────
  examples: {
    lieu: 'Martinique',
    hashtag: '#martinique',
    marque: 'Ex: Caraïb Ediprint, imprimerie Martinique, cible TPE locales',
    secteurVeille: 'Ex: Luxe, food, tourisme insulaire...',
    seoSujet: 'Ex: Comment choisir son imprimeur local en Martinique',
    seoMotCle: 'Ex: imprimerie Martinique',
    seoSecondaires: 'Ex: impression numérique, flyer Martinique, devis imprimeur',
    studioMarque: 'Ex. Ton chaleureux et premium. Cible : mariées aux Antilles. Éviter le jargon.',
  },

  // ─── Studio de Zara ────────────────────────────────────────────────────────
  studio: {
    // Dossier de stockage (Blob / S3). Ne JAMAIS changer sur une installation
    // existante : les posts, marques et visuels déjà enregistrés y vivent.
    storagePrefix: 'bbold-studio',
    // Marque semée au premier lancement du studio.
    defaultBrand: {
      slug: 'bbold-core',
      name: 'B.BOLD Agency',
      handle: '@bboldagency',
      palette: { bg: '#0a0008', fg: '#faf8fb', accent: '#c9a84c', accent2: '#7c3aed', muted: '#c4b5fd' },
      fonts: { display: 'Playfair Display', body: 'Inter' },
      markdown: `# B.BOLD Agency — contexte de marque

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
Entrepreneur·e / dirigeant·e de TPE-PME aux Antilles-Guyane / Réunion, 28–50 ans, ambitieux·se.`,
    },
  },
}

export default bbold
