/**
 * MODÈLE D'INSTALLATION CLIENT — à copier, pas à importer tel quel.
 *
 * 1. Copie ce fichier en src/config/tenants/<id>.js (id : minuscules, sans espace, ex. 'lumen').
 * 2. Remplis chaque champ « À REMPLIR ».
 * 3. Logo : dépose-le dans public/tenants/<id>/logo.svg (ou .png) et renseigne `logo`.
 * 4. Enregistre le tenant dans src/config/tenant.js :
 *      import lumen from './tenants/lumen'
 *      const TENANTS = { bbold, lumen }
 * 5. Sur le projet Vercel du client : NEXT_PUBLIC_TENANT=<id>.
 *
 * Les fragments de `market` sont insérés AU MILIEU des consignes des agents :
 * garde l'espace (ou la ponctuation) du début. '' = aucune mention de territoire.
 * Repère : la phrase complète est rappelée en commentaire, « … » = le fragment.
 */
const modele = {
  id: 'modele', // À REMPLIR : identique au nom du fichier

  // ─── Noms ──────────────────────────────────────────────────────────────────
  name: 'NOM',                          // À REMPLIR : nom court (en-tête, logo texte)
  agency: 'NOM Agency',                 // À REMPLIR : « Tu es Zara, Designer de NOM Agency »
  product: 'Studio',                    // affiché à côté du nom : « NOM Studio »
  productFull: 'NOM Studio',            // nom de la plateforme
  orchestrator: 'Alex',                 // À REMPLIR : prénom de l'orchestrateur·rice
  title: 'NOM Studio — Plateforme multi-agents',
  description: 'Plateforme multi-agents NOM Agency',

  // ─── Visuel ────────────────────────────────────────────────────────────────
  logo: null, // ex. '/tenants/modele/logo.svg' ; null = losange aux couleurs ci-dessous
  // Interface sombre : `bg`, `bgAlt`, `bgDeep` doivent rester foncés et `text` clair.
  colors: {
    primary: '#1e3a8a',     // couleur principale (boutons secondaires, fonds teintés)
    secondary: '#2563eb',   // seconde couleur (halos, dégradés)
    accent: '#f59e0b',      // accent : titres, boutons, bordures actives
    accentLight: '#fcd34d', // accent clair
    soft: '#93c5fd',        // teinte douce
    softAlt: '#bfdbfe',     // teinte douce bis (accent des agents)
    bg: '#050816',          // fond principal (foncé)
    bgAlt: '#0b1024',       // fond des panneaux (foncé)
    bgDeep: '#070b1c',      // fond de dégradé (foncé)
    text: '#f8fafc',        // texte principal (clair)
  },

  // ─── Marché ────────────────────────────────────────────────────────────────
  market: {
    timeZone: 'Europe/Paris',               // fuseau IANA : dates des calendriers et veilles
    timeZoneLabel: 'Paris (UTC+1/+2)',

    // Maeva (Studio)   : « experte en brand strategy… . Ton style… »
    maevaUI: ' pour les entreprises de [territoire]. Tu as une connaissance approfondie du tissu économique local',
    // Maeva (campagne) : « experte en brand strategy… . Style… »
    maevaApi: ' pour les entreprises de [territoire]',
    // Zara et Debelvoix : « … création Canva… . » / « … brand voice… . »
    pourZone: ' pour les entreprises de [territoire]',
    // Maya Angelou : « …pour les réseaux sociaux… . Tu travailles… »
    brandVoice: ', spécialisé dans les marques de [territoire]',
    // Hermione (calendrier) : phrase complète ou ''
    marronniers: ' Tu intègres les marronniers locaux si pertinent.',
    // Olivia Pope (veille) : règle, section du rapport, cible
    veilleRegle: '',
    veilleSection: '',
    veilleCible: '',
    // Kris Jenner (influence) : « stratégies d'influence… . »
    influence: '',
    // Oprah (offre) : paragraphe complet ou ''
    offre: '',
    // Ada Lovelace (SEO) : « pour les entreprises… . » + paragraphe marché
    seoCible: '',
    seoMarche: '',

    territoireDefaut: 'France',
    territoiresVeille: ['France', 'Europe', 'Global'],
    territoiresInfluence: ['France', 'Europe', 'Global'],
  },

  // ─── Exemples affichés dans les champs vides ───────────────────────────────
  examples: {
    lieu: 'Paris',
    hashtag: '#paris',
    marque: 'Ex: Maison Lumen, décoration, cible CSP+ urbaines',
    secteurVeille: 'Ex: Luxe, food, tourisme...',
    seoSujet: 'Ex: Comment choisir son architecte d\'intérieur à Paris',
    seoMotCle: 'Ex: architecte intérieur Paris',
    seoSecondaires: 'Ex: rénovation appartement, décoration sur mesure, devis architecte',
    studioMarque: 'Ex. Ton chaleureux et premium. Cible : jeunes parents urbains. Éviter le jargon.',
  },

  // ─── Studio de Zara ────────────────────────────────────────────────────────
  studio: {
    // Dossier de stockage, propre à ce client. Ne plus jamais le changer ensuite.
    storagePrefix: 'modele-studio',
    defaultBrand: {
      slug: 'modele',
      name: 'NOM Agency',
      handle: '@nom',
      palette: { bg: '#050816', fg: '#f8fafc', accent: '#f59e0b', accent2: '#2563eb', muted: '#93c5fd' },
      fonts: { display: 'Playfair Display', body: 'Inter' },
      markdown: `# NOM Agency — contexte de marque

## Positionnement
À REMPLIR

## Ton de voix
À REMPLIR

## Interdictions
À REMPLIR

## Cible
À REMPLIR`,
    },
  },
}

export default modele
