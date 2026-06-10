'use client'
import { useState, useEffect, useRef } from 'react'

const B = {
  violetDeep: '#6b0f6e', magenta: '#c000c0', gold: '#c9a84c',
  goldLight: '#e8cc7a', black: '#0a0008', lilas: '#d9a0d9',
  white: '#faf8fb', surface: 'rgba(107,15,110,0.09)', border: 'rgba(201,168,76,0.2)',
}

const AGENTS = [
  { id:'stratege',     emoji:'🎯', prenom:'Maeva', title:'Stratège & Brief',    model:'OPUS',   color:B.magenta,    accent:B.lilas },
  { id:'createur',     emoji:'✍️', prenom:'Lola',  title:'Créatrice Contenu',  model:'SONNET', color:B.violetDeep, accent:'#c4b5fd' },
  { id:'designer',     emoji:'🎨', prenom:'Zara',  title:'Designer',            model:'SONNET', color:B.gold,       accent:B.goldLight },
  { id:'analyste',     emoji:'📊', prenom:'Inès',  title:'Analyste & Plan 3D', model:'OPUS',   color:B.magenta,    accent:B.lilas },
  { id:'presentateur', emoji:'🎤', prenom:'Naïa',  title:'Présentatrice',       model:'SONNET', color:B.violetDeep, accent:'#c4b5fd' },
]

const SUPPORT_AGENTS = [
  { id:'gmail',      emoji:'📧', name:'Gmail',         subtitle:'Email professionnel — objet + corps + CTA en 30 secondes.',          color:'#3b82f6', accent:'#93c5fd' },
  { id:'fireflies',  emoji:'🔥', name:'Fireflies',     subtitle:'Extrait un brief structuré depuis un transcript de réunion.',        color:'#10b981', accent:'#6ee7b7' },
  { id:'cv',         emoji:'📁', name:'Content Vault', subtitle:'Archive et versionne tes livrables avec frontmatter YAML.',          color:'#f97316', accent:'#fdba74' },
  { id:'debelvoix',  emoji:'🔍', name:'Debelvoix',     subtitle:'Analyse la voix de marque existante et génère le guide brand voice.', color:'#0d9488', accent:'#5eead4' },
  { id:'repurpose',  emoji:'♻️', name:'Repurpose',     subtitle:'1 post validé → 5 formats natifs (LinkedIn, Insta, FB, Story, NL).', color:'#f59e0b', accent:'#fde68a' },
  { id:'calendrier', emoji:'📅', name:'Calendrier',    subtitle:'Génère un calendrier éditorial 30 jours depuis ta stratégie.',       color:'#4f46e5', accent:'#a5b4fc' },
  { id:'olivia',     emoji:'📡', name:'Olivia Pope',      subtitle:'Veille communicationnelle en temps réel — réseaux, campagnes, canaux digitaux & classiques.', color:'#dc2626', accent:'#fca5a5' },
  { id:'anna',       emoji:'👑', name:'Anna Wintour',     subtitle:'Brand board complet — palette HEX, typographies, logo, ambiance. Téléchargeable en HTML.',    color:'#b45309', accent:'#fde68a' },
  { id:'script',     emoji:'🎬', name:'Script Vidéo',     subtitle:'Hook 3s + script complet Reel/TikTok/YouTube avec timestamps et description optimisée.',      color:'#7c3aed', accent:'#c4b5fd' },
  { id:'influence',  emoji:'🌟', name:'Influence Marketing', subtitle:'Profils influenceurs ciblés + brief influenceur complet + message d\'approche.',           color:'#ec4899', accent:'#f9a8d4' },
  { id:'offre',      emoji:'📋', name:'Offre Commerciale', subtitle:'Proposition commerciale structurée — contexte, solution, livrables, budget, planning.',      color:'#059669', accent:'#6ee7b7' },
  { id:'seo',        emoji:'🔎', name:'SEO Content',      subtitle:'Article SEO complet avec métas, structure H1/H2/H3 et contenu optimisé.',                     color:'#0891b2', accent:'#67e8f9' },
]

const PIPELINE_STEPS = [
  { id:'stratege',     prenom:'Maeva', emoji:'🎯', folder:'briefs/',         color:B.magenta    },
  { id:'createur',     prenom:'Lola',  emoji:'✍️', folder:'content/',        color:B.violetDeep },
  { id:'designer',     prenom:'Zara',  emoji:'🎨', folder:'prompts-images/', color:B.gold       },
  { id:'analyste',     prenom:'Inès',  emoji:'📊', folder:'analytics/',      color:B.magenta    },
  { id:'presentateur', prenom:'Naïa',  emoji:'🎤', folder:'decks/',          color:B.violetDeep },
]

const URL_FIELDS = [
  { key:'site_web',  label:'Site web',  placeholder:'https://...' },
  { key:'instagram', label:'Instagram', placeholder:'https://instagram.com/...' },
  { key:'facebook',  label:'Facebook',  placeholder:'https://facebook.com/...' },
  { key:'linkedin',  label:'LinkedIn',  placeholder:'https://linkedin.com/...' },
  { key:'tiktok',    label:'TikTok',    placeholder:'https://tiktok.com/...' },
]

const ORCH_SYSTEM = `Tu es l'Orchestrateur de B.BOLD Core, chef de projet multi-agents. Tu reçois un brief de projet pour une marque et tu décides quels agents activer, dans quel ordre, et pourquoi.

LES 5 AGENTS DISPONIBLES :
- stratege (Maeva) : Stratège & Brief — positionnement, Value Proposition Canvas, piliers éditoriaux. Indispensable pour tout nouveau client ou nouveau projet de marque.
- createur (Lola) : Créatrice Contenu — posts, hooks, scripts, captions pour les réseaux sociaux. Nécessite la stratégie de Maeva en amont.
- designer (Zara) : Designer — prompts génératifs Midjourney/Flux/DALL-E pour les visuels. Utile uniquement si des visuels doivent être produits.
- analyste (Inès) : Analyste & Plan 3D — KPIs, plan de publication 4 semaines, budget ads. Idéal si un plan de croissance mesurable est attendu.
- presentateur (Naïa) : Présentatrice — deck pitch slide-par-slide avec notes speaker. Uniquement si une présentation client est prévue.

RÈGLES DE SÉLECTION :
1. Ne sélectionne QUE les agents vraiment utiles pour CE projet spécifique.
2. Maeva est presque toujours nécessaire — elle pose la base stratégique.
3. Lola est nécessaire si du contenu doit être produit.
4. Zara uniquement si des visuels sont explicitement demandés.
5. Inès si un plan de publication ou des KPIs sont attendus.
6. Naïa uniquement si une présentation formelle est prévue.

Analyse le brief, justifie tes choix en 2-3 phrases claires, puis termine OBLIGATOIREMENT par ce bloc JSON exact, sans exception :

\`\`\`json
{"selected_agents": ["stratege", "createur"], "rationale": "résumé en 1 phrase"}
\`\`\``

function getAvatarPath(id) {
  const map = { stratege:'maeva', createur:'lola', designer:'zara', analyste:'ines', presentateur:'naia' }
  return `/avatars/${map[id]}.png`
}

// ─── History helpers ──────────────────────────────────────────────────────────

const HISTORY_KEY = 'bbold_history'

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') } catch { return [] }
}

function saveToHistory(entry) {
  try {
    const prev = loadHistory()
    localStorage.setItem(HISTORY_KEY, JSON.stringify([entry, ...prev].slice(0, 20)))
  } catch {}
}

function deleteFromHistory(id) {
  try {
    const prev = loadHistory()
    localStorage.setItem(HISTORY_KEY, JSON.stringify(prev.filter(e => e.id !== id)))
  } catch {}
}

// ─── Campaign markdown builder ────────────────────────────────────────────────

function buildMarkdown(brief, steps) {
  const date = new Date().toISOString().split('T')[0]
  let md = `# Campagne B.BOLD — ${brief.client || '—'}\n`
  md += `**Date :** ${date}  \n**Objectif :** ${brief.objectif || '—'}  \n**Plateformes :** ${brief.plateformes || '—'}  \n**Budget :** ${brief.budget || '—'}  \n\n---\n\n`
  steps.filter(s => s.status === 'done').forEach(s => {
    md += `## ${s.emoji} ${s.prenom} → ${s.folder}\n\n${s.output}\n\n---\n\n`
  })
  return md
}

function downloadMd(brief, steps) {
  const date = new Date().toISOString().split('T')[0]
  const slug = (brief.client || 'client').toLowerCase().replace(/\s+/g, '-')
  const md = buildMarkdown(brief, steps)
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `bbold-${slug}-${date}.md`; a.click()
  URL.revokeObjectURL(url)
}

// ─── FORMS ────────────────────────────────────────────────────────────────────

const FORMS = {
  stratege: {
    title: 'Brief Stratégique', subtitle: 'Maeva construit ton positionnement, ta VPC et identifie tes 3 concurrents directs.',
    system: `Tu es Maeva, Stratège & Brief de B.BOLD Agency, experte en brand strategy pour les territoires insulaires français. Tu as une connaissance approfondie du tissu économique local — Martinique, Guadeloupe, Guyane, La Réunion et autres DOM-TOM. Ton style : cash, structuré, bullet points pour les insights.

Pour chaque brief, tu identifies OBLIGATOIREMENT 3 concurrents directs réels dans le même département que le client, proposant le même type de produits ou services. Si tu ne connais pas d'acteurs locaux certains, tu identifies les types d'acteurs les plus probables avec leurs caractéristiques générales tout en le précisant. Tu analyses ensuite leurs positionnements pour en déduire le territoire disponible pour le client.`,
    fields: [
      { key:'client',   label:'Nom du client',      type:'text',     placeholder:'Ex: Caraïb Ediprint' },
      { key:'secteur',  label:"Secteur & territoire", type:'text',    placeholder:'Ex: Imprimerie digitale, Martinique' },
      { key:'objectif', label:'Objectif principal', type:'select',   options:['Notoriété de marque','Génération de leads','Augmenter les ventes','Fidéliser la communauté'] },
      { key:'icp',      label:'Cible / ICP',        type:'textarea', placeholder:'Ex: TPE locales 30-50 ans, budget com < 2k/mois' },
      { key:'budget',   label:'Budget mensuel',     type:'text',     placeholder:'Ex: 1 500€/mois' },
    ],
    userPrompt: (d) => `CLIENT : ${d.client||'—'}
SECTEUR & TERRITOIRE : ${d.secteur||'—'}
OBJECTIF : ${d.objectif||'—'}
CIBLE / ICP : ${d.icp||'—'}
BUDGET : ${d.budget||'—'}

Mission :
1. 3 insights clés sur ce marché local (spécificités du territoire, comportements consommateurs, opportunités)
2. ICP détaillé (profil, douleurs, déclencheurs d'achat)
3. ANALYSE CONCURRENTIELLE — identifie toi-même 3 concurrents directs dans le même département proposant le même type de produits/services. Pour chacun :
   - Nom + description courte
   - Positionnement perçu (promesse, ton, cible apparente)
   - Point fort identifiable
   - Angle faible / territoire non exploité
   → Conclusion : le positionnement disponible pour ${d.client||'le client'}
4. Positionnement différenciant en 1 phrase (ancré dans les angles libres identifiés)
5. Value Proposition Canvas complet
6. 3 piliers éditoriaux`,
  },
  createur: {
    title: 'Brief Contenu', subtitle: 'Lola rédige tes posts, scripts et captions qui convertissent.',
    system: `Tu es Lola, Créatrice de Contenu de B.BOLD Agency. Hook = 15 mots max. Jamais de listes à puces dans le corps. Prose fluide, 3 paragraphes max. Style authentique et territorial si pertinent.`,
    fields: [
      { key:'plateforme', label:'Plateforme cible',    type:'select',   options:['LinkedIn','Instagram','Facebook','YouTube','TikTok'] },
      { key:'thematique', label:'Thématique',          type:'text',     placeholder:'Ex: Lancement nouvelle gamme, conseils impression' },
      { key:'ton',        label:'Ton souhaité',        type:'select',   options:['Inspirationnel','Éducatif','Humoristique','Persuasif','Authentique'] },
      { key:'cta',        label:"Appel à l'action",   type:'text',     placeholder:'Ex: Visiter le site, Envoyer un DM' },
      { key:'brand',      label:'Spécificités marque', type:'textarea', placeholder:'Ex: Ton cash, pas de clichés, références antillaises' },
    ],
    userPrompt: (d) => `PLATEFORME : ${d.plateforme||'—'}\nTHÉMATIQUE : ${d.thematique||'—'}\nTON : ${d.ton||'—'}\nCTA : ${d.cta||'—'}\nSPÉCIFICITÉS : ${d.brand||'—'}\n\nMission : 3 versions du post (angle différent), hook 15 mots max pour chacune, CTA intégré, 5-10 hashtags optimisés.`,
  },
  designer: {
    title: 'Brief Visuel', subtitle: 'Zara crée tes prompts Gemini Imagen + specs Canva prêtes à l\'emploi.',
    system: `Tu es Zara, Designer de B.BOLD Agency, experte en direction artistique, prompts IA et création Canva pour les territoires insulaires français.

FORMATS AUTORISÉS (jamais de carré 1:1) :
- Deck / Présentation 16:9 → Canva : 1920 × 1080 px
- Post Instagram/LinkedIn 4:5 → Canva : 1080 × 1350 px
- Story & Reel 9:16 → Canva : 1080 × 1920 px

Pour chaque visuel tu fournis OBLIGATOIREMENT :

1. PROMPT GEMINI IMAGEN (anglais, 120-160 mots)
Format : description scène + sujet + style + éclairage + palette + composition + ambiance
Ex : "Wide cinematic shot of a smiling Black woman entrepreneur in a bright studio, wearing elegant professional attire in deep purple and gold tones, natural Caribbean light filtering through large windows, bokeh background with geometric shapes, luxury magazine aesthetic, ultra-detailed skin texture, warm golden hour lighting, --ar 4:5"

2. BRIEF CANVA STRUCTURÉ
- Dimensions exactes
- Layout : zones titre / visuel / texte corps / CTA
- Typographies (telles que fournies par le client)
- Palette HEX
- Style des éléments décoratifs (formes, traits, overlays)
- Textes suggérés pour titres et sous-titres

Si une image de référence est fournie, analyse PRÉCISÉMENT : palette dominante, style typographique visible, composition, ratio, mood général — et intègre tout ça dans les specs.`,
    fields: [
      { key:'format',            label:'Format cible',            type:'select',   options:['Deck / Présentation 16:9','Post Instagram/LinkedIn 4:5','Story & Reel 9:16'] },
      { key:'nombre',            label:'Nombre de visuels',       type:'select',   options:['1 visuel','3 visuels','5 visuels (carrousel)','10 slides (deck)'] },
      { key:'style',             label:'Style visuel',            type:'select',   options:['Minimaliste & épuré','Énergique & contrasté','Luxe & premium','Naturel & organique','Disruptif & bold'] },
      { key:'palette',           label:'Palette couleurs',        type:'text',     placeholder:'Ex: violet #6b0f6e, or #c9a84c, fond noir #0a0008' },
      { key:'police_titre',      label:'Police — Titres',         type:'text',     placeholder:'Ex: Playfair Display Bold' },
      { key:'police_sous_titre', label:'Police — Sous-titres',    type:'text',     placeholder:'Ex: Montserrat SemiBold 600' },
      { key:'police_corps',      label:'Police — Corps de texte', type:'text',     placeholder:'Ex: Inter Regular 400' },
      { key:'sujet',             label:'Sujet / Message visuel',  type:'textarea', placeholder:'Ex: Femme créole en studio, ambiance luxe, message "Votre marque mérite mieux"' },
      { key:'mood',              label:'Mood / Références',       type:'text',     placeholder:'Ex: Vogue Paris, lumière naturelle dorée, editorial' },
    ],
    userPrompt: (d) => `FORMAT : ${d.format||'—'}
NOMBRE : ${d.nombre||'1 visuel'}
STYLE : ${d.style||'—'}
PALETTE : ${d.palette||'—'}

TYPOGRAPHIES :
- Titres : ${d.police_titre||'non spécifiée'}
- Sous-titres : ${d.police_sous_titre||'non spécifiée'}
- Corps de texte : ${d.police_corps||'non spécifiée'}

SUJET / MESSAGE : ${d.sujet||'—'}
MOOD / RÉFÉRENCES : ${d.mood||'—'}

Mission :
1. Pour chaque visuel : prompt Gemini Imagen complet (anglais, 120-160 mots) avec toutes les specs visuelles
2. Brief Canva structuré (dimensions, layout, zones, typographies, textes suggérés, éléments décoratifs)
3. Si image de référence uploadée : analyse le style et adapte les prompts en conséquence`,
  },
  analyste: {
    title: 'Brief Analytique', subtitle: 'Inès lit tes analytics et construit ton plan 3D sur 4 semaines.',
    system: `Tu es Inès, Analyste & Architecte du Plan 3D de B.BOLD Agency. Tableaux clairs, bullet points, chiffres précis. Plan 4 semaines x 3 actions SMART par semaine.`,
    fields: [
      { key:'plateformes', label:'Plateformes',          type:'select',   options:['LinkedIn + Meta','LinkedIn seul','Meta (FB+IG)','YouTube','Tout'] },
      { key:'periode',     label:"Période d'analyse",    type:'select',   options:['30 derniers jours','90 jours','6 mois','12 mois'] },
      { key:'kpi',         label:'KPI prioritaire',      type:'select',   options:["Portée & impressions","Taux d'engagement","Leads / Clics","Croissance abonnés","Conversions"] },
      { key:'contexte',    label:'Contexte / Résultats', type:'textarea', placeholder:'Ex: Post du 15/05 a fait +400% portée, budget ads 500€/mois' },
      { key:'objectif_g',  label:'Objectif croissance',  type:'text',     placeholder:'Ex: +30% engagement en 3 mois' },
    ],
    userPrompt: (d) => `PLATEFORMES : ${d.plateformes||'—'}\nPÉRIODE : ${d.periode||'—'}\nKPI : ${d.kpi||'—'}\nCONTEXTE : ${d.contexte||'—'}\nOBJECTIF : ${d.objectif_g||'—'}\n\nMission : 3 quick wins, plan 4 semaines (tableau), dashboard KPI avec seuils d'alerte.`,
  },
  presentateur: {
    title: 'Brief Présentation', subtitle: 'Naïa transforme ton brief en deck slide-par-slide.',
    system: `Tu es Naïa, Présentatrice de B.BOLD Agency, experte en storytelling (SOZA, Pyramide de Minto, Before/After). Structure narrative claire, slide-par-slide.`,
    fields: [
      { key:'type_deck', label:'Type de présentation', type:'select',   options:['Pitch commercial','Rapport de performance','Formation équipe','Webinar','Présentation institutionnelle'] },
      { key:'audience',  label:'Audience cible',       type:'text',     placeholder:'Ex: Dirigeants PME Martinique' },
      { key:'nb_slides', label:'Volume',               type:'select',   options:['5-8 slides (express)','10-15 slides (standard)','20+ slides (formation)'] },
      { key:'message',   label:'Message clé',          type:'textarea', placeholder:'Ex: Montrer ROI Q1, convaincre de renouveler le contrat' },
      { key:'data',      label:'Données / chiffres',   type:'text',     placeholder:'Ex: +127% engagement, 45 leads mars, ROI x4.2' },
    ],
    userPrompt: (d) => `TYPE : ${d.type_deck||'—'}\nAUDIENCE : ${d.audience||'—'}\nVOLUME : ${d.nb_slides||'—'}\nMESSAGE CLÉ : ${d.message||'—'}\nDONNÉES : ${d.data||'—'}\n\nMission : structure narrative (choix framework), plan slide-par-slide avec titre + message + visuel recommandé, notes speaker pour les 3 slides critiques.`,
  },
}

const SUPPORT_FORMS = {
  gmail: {
    title: 'Agent Gmail', subtitle: 'Email B.BOLD — objet + corps + CTA en 30 secondes.',
    fields: [
      { key:'destinataire', label:'Destinataire / Contexte', type:'text',     placeholder:'Ex: Directeur marketing, relance après réunion' },
      { key:'sujet',        label:"Sujet de l'email",        type:'text',     placeholder:'Ex: Bilan campagne mai — vos résultats' },
      { key:'contexte',     label:"Type d'email",            type:'select',   options:["Suivi client","Présentation d'offre","Rapport de performance","Relance prospect","Brief réunion","Remerciement"] },
      { key:'contenu',      label:'Points clés à inclure',   type:'textarea', placeholder:'Ex: Résultats +40% engagement, RDV jeudi, lien rapport' },
    ],
  },
  fireflies: {
    title: 'Agent Fireflies', subtitle: 'Colle ton transcript — Fireflies en extrait un brief actionnable.',
    fields: [
      { key:'transcript', label:'Transcript ou notes de réunion', type:'textarea', placeholder:'Colle ici ton transcript Fireflies.ai ou tes notes brutes de réunion...' },
    ],
  },
  cv: {
    title: 'Content Vault', subtitle: 'Archive un livrable avec frontmatter YAML + changelog.',
    fields: [
      { key:'client',   label:'Client',   type:'text',     placeholder:'Ex: Caraïb Ediprint' },
      { key:'version',  label:'Version',  type:'text',     placeholder:'Ex: v1.0' },
      { key:'livrable', label:'Livrable', type:'textarea', placeholder:'Colle ici le contenu à archiver et versionner...' },
    ],
  },
  debelvoix: {
    title: 'Debelvoix — Brand Voice', subtitle: "Colle du contenu existant, Debelvoix sort le guide brand voice complet.",
    fields: [
      { key:'client',  label:'Client / Marque',             type:'text',     placeholder:'Ex: Debeliou Agency' },
      { key:'secteur', label:'Secteur',                     type:'text',     placeholder:'Ex: Agence communication, Martinique' },
      { key:'contenu', label:'Contenu existant à analyser', type:'textarea', placeholder:'Colle ici 5 à 10 posts, captions, emails ou textes existants de la marque...' },
    ],
  },
  repurpose: {
    title: 'Repurpose — 1 post → 5 formats', subtitle: 'Prends un post validé, Repurpose le décline sur toutes les plateformes.',
    fields: [
      { key:'contenu', label:'Post original (validé)',    type:'textarea', placeholder:'Colle ici le post ou le contenu à décliner...' },
      { key:'client',  label:'Client',                    type:'text',     placeholder:'Ex: Caraïb Ediprint' },
      { key:'ton',     label:'Ton de marque',             type:'select',   options:['Cash & direct','Inspirationnel','Éducatif','Humoristique','Premium & luxe'] },
      { key:'cta',     label:"Appel à l'action",          type:'text',     placeholder:'Ex: Envoyer un DM, Réserver un audit, Visiter le site' },
    ],
  },
  calendrier: {
    title: 'Calendrier Éditorial 30 jours', subtitle: 'Donne tes piliers, Calendrier génère un plan mois complet.',
    fields: [
      { key:'client',      label:'Client',                   type:'text',     placeholder:'Ex: Debeliou Agency' },
      { key:'plateformes', label:'Plateformes',              type:'select',   options:['Instagram + Facebook','LinkedIn + Meta','Instagram seul','LinkedIn seul','Tous les canaux'] },
      { key:'objectif',    label:'Objectif principal',       type:'select',   options:['Notoriété de marque','Génération de leads','Augmenter les ventes','Fidéliser la communauté'] },
      { key:'frequence',   label:'Fréquence de publication', type:'select',   options:['1 fois par semaine','3 fois par semaine','5 fois par semaine','Quotidien'] },
      { key:'piliers',     label:'Piliers éditoriaux',       type:'textarea', placeholder:'Ex:\nPilier 1 — Preuve sociale\nPilier 2 — Éducation\nPilier 3 — Culture de marque' },
      { key:'contexte',    label:'Contexte / Infos utiles',  type:'textarea', placeholder:'Ex: Mois de juillet, saison cyclonique, lancement produit prévu le 15...' },
    ],
  },
  olivia: {
    title: 'Olivia Pope — Veille Com', subtitle: 'Veille communicationnelle en temps réel via Perplexity AI.',
    fields: [
      { key:'focus',      label:'Focus thématique',                     type:'select',   options:['Communication digitale & réseaux sociaux','Campagnes publicitaires notables','Influence marketing','Communication de crise','Tendances brand content','Vue d\'ensemble communication'] },
      { key:'territoire', label:'Territoire',                            type:'select',   options:['France + Antilles-Guyane','France métropolitaine','Martinique','Guadeloupe','Global'] },
      { key:'periode',    label:'Période de veille',                     type:'select',   options:['7 derniers jours','30 derniers jours','Actualité immédiate','3 derniers mois'] },
      { key:'secteur',    label:'Secteur à surveiller (optionnel)',      type:'text',     placeholder:'Ex: Luxe, food, tourisme insulaire...' },
      { key:'profondeur', label:'Profondeur du rapport',                 type:'select',   options:['Vue d\'ensemble','Analyse approfondie','Focus 1 tendance spécifique'] },
    ],
  },
  anna: {
    title: 'Anna Wintour — Brand Board', subtitle: 'Brand board complet avec palette HEX, typographies, concept logo et ambiance.',
    fields: [
      { key:'client',              label:'Client / Nom de marque',               type:'text',     placeholder:'Ex: Debeliou Agency' },
      { key:'secteur',             label:'Secteur',                              type:'text',     placeholder:'Ex: Agence communication, Martinique' },
      { key:'valeurs',             label:'Valeurs de la marque',                 type:'text',     placeholder:'Ex: Authenticité, disruption, excellence' },
      { key:'cible',               label:'Cible',                                type:'text',     placeholder:'Ex: Créatifs, entrepreneurs 25-40 ans' },
      { key:'personnalite',        label:'Personnalité souhaitée',               type:'select',   options:['Luxe & premium','Disruptif & bold','Naturel & organique','Tech & moderne','Artisanal & authentique','Énergique & jeune'] },
      { key:'references',          label:'Références visuelles / inspirations',  type:'text',     placeholder:'Ex: Vogue, Glossier, Apple' },
      { key:'couleurs_existantes', label:'Couleurs existantes (si logo déjà)',   type:'text',     placeholder:'Ex: Violet #6b0f6e, Or #c9a84c — ou "Aucune contrainte"' },
      { key:'debelvoix_analyse',   label:'Analyse Debelvoix (optionnel)',         type:'textarea', placeholder:'Colle ici le guide brand voice généré par Debelvoix pour enrichir le brand board...' },
    ],
  },

  script: {
    title: 'Script Vidéo', subtitle: 'Hook 3s + script complet avec timestamps, sous-titres et description.',
    fields: [
      { key:'plateforme',   label:'Plateforme',               type:'select',   options:['Instagram Reel','TikTok','YouTube Short','YouTube (format long)','Facebook Reel'] },
      { key:'duree',        label:'Durée cible',              type:'select',   options:['15 secondes','30 secondes','60 secondes','90 secondes','3-5 minutes','8-12 minutes'] },
      { key:'sujet',        label:'Sujet / Message principal',type:'textarea', placeholder:'Ex: Présenter notre nouvelle offre d\'impression eco-responsable, montrer le processus...' },
      { key:'ton',          label:'Ton',                      type:'select',   options:['Dynamique & énergique','Professionnel & rassurant','Storytelling émotionnel','Éducatif & pédagogique','Humoristique & léger'] },
      { key:'cta',          label:"Appel à l'action final",   type:'text',     placeholder:'Ex: Demander un devis gratuit sur le lien en bio' },
      { key:'infos_marque', label:'Infos marque / contexte',  type:'text',     placeholder:'Ex: Caraïb Ediprint, imprimerie Martinique, cible TPE locales' },
    ],
  },

  influence: {
    title: 'Influence Marketing', subtitle: 'Stratégie influenceurs ciblée DOM-TOM — brief + approche + contrat.',
    fields: [
      { key:'client',    label:'Client / Marque',                      type:'text',     placeholder:'Ex: Caraïb Ediprint' },
      { key:'secteur',   label:'Secteur',                              type:'text',     placeholder:'Ex: Imprimerie, Martinique' },
      { key:'territoire',label:'Territoire',                           type:'select',   options:['Martinique','Guadeloupe','Guyane','La Réunion','Tous DOM-TOM','France + DOM-TOM'] },
      { key:'objectif',  label:'Objectif de la campagne influence',    type:'select',   options:['Notoriété de marque','Génération de leads','Lancement produit','Drive-to-store','Engagement communauté'] },
      { key:'budget',    label:'Budget collaboration (par influenceur)',type:'select',   options:['Troc / Gifting uniquement','Moins de 500€','500€ — 1 500€','1 500€ — 3 000€','Plus de 3 000€'] },
      { key:'type',      label:'Type de contenu souhaité',             type:'select',   options:['Post Instagram + Story','Reel dédié','TikTok','YouTube mention','Package multi-formats'] },
    ],
  },

  offre: {
    title: 'Offre Commerciale', subtitle: 'Proposition commerciale B.BOLD complète prête à envoyer au client.',
    fields: [
      { key:'client',   label:'Nom du client / prospect',    type:'text',     placeholder:'Ex: Boutique Mode Tropicale, Fort-de-France' },
      { key:'secteur',  label:'Secteur',                     type:'text',     placeholder:'Ex: Mode & retail, Martinique' },
      { key:'besoin',   label:'Besoin / problème identifié', type:'textarea', placeholder:'Ex: Aucune présence Instagram, concurrent qui cartonne sur les réseaux, besoin de visibilité pour l\'ouverture du deuxième magasin...' },
      { key:'services', label:'Services à proposer',         type:'textarea', placeholder:'Ex: Stratégie réseaux sociaux, création de contenu mensuel (12 posts + 4 reels), community management...' },
      { key:'budget',   label:'Budget indicatif',            type:'text',     placeholder:'Ex: 1 500€/mois — ou "à définir"' },
      { key:'delai',    label:'Délai de démarrage souhaité', type:'text',     placeholder:'Ex: Démarrage début septembre' },
    ],
  },

  seo: {
    title: 'SEO Content', subtitle: 'Article SEO optimisé avec métas, structure et contenu prêt à publier.',
    fields: [
      { key:'sujet',          label:'Sujet de l\'article',              type:'text',     placeholder:'Ex: Comment choisir son imprimeur local en Martinique' },
      { key:'mot_cle',        label:'Mot-clé principal',                type:'text',     placeholder:'Ex: imprimerie Martinique' },
      { key:'mots_cles_sec',  label:'Mots-clés secondaires (3 à 5)',    type:'text',     placeholder:'Ex: impression numérique, flyer Martinique, devis imprimeur' },
      { key:'audience',       label:'Audience cible',                   type:'text',     placeholder:'Ex: TPE et commerçants martiniquais qui cherchent un imprimeur fiable' },
      { key:'type_contenu',   label:'Type de contenu',                  type:'select',   options:['Article de blog informatif','Guide pratique (how-to)','Comparatif / Top X','Landing page service','FAQ optimisée'] },
      { key:'longueur',       label:'Longueur cible',                   type:'select',   options:['800 mots (article court)','1 200 mots (article standard)','2 000 mots (article approfondi)','2 500+ mots (pilier SEO)'] },
    ],
  },
}

const CAMPAIGN_FIELDS = [
  { key:'client',      label:'Nom du client',        type:'text',     placeholder:'Ex: Caraïb Ediprint' },
  { key:'secteur',     label:'Secteur & territoire', type:'text',     placeholder:'Ex: Imprimerie digitale, Martinique' },
  { key:'objectif',    label:'Objectif principal',   type:'select',   options:['Notoriété de marque','Génération de leads','Augmenter les ventes','Fidéliser la communauté','Lancement produit/service'] },
  { key:'cible',       label:'Cible / ICP',          type:'textarea', placeholder:'Ex: TPE locales 30-50 ans, budget com < 2k/mois' },
  { key:'budget',      label:'Budget mensuel',       type:'text',     placeholder:'Ex: 1 500€/mois' },
  { key:'plateformes', label:'Plateformes cibles',   type:'select',   options:['LinkedIn + Meta','Instagram seul','LinkedIn seul','Meta (FB+IG)','Tous les canaux'] },
  { key:'ton',         label:'Ton de marque',        type:'select',   options:['Cash & direct','Inspirationnel','Éducatif','Humoristique','Premium & luxe'] },
]

// ─── SVG Eye ──────────────────────────────────────────────────────────────────

function Eye({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none">
      <polygon points="30,4 56,30 30,56 4,30" stroke={B.gold} strokeWidth="1.5" fill="none"/>
      <polygon points="30,10 50,30 30,50 10,30" stroke={B.magenta} strokeWidth="1" fill="none" opacity="0.55"/>
      <ellipse cx="30" cy="30" rx="12" ry="8" stroke={B.gold} strokeWidth="1.5" fill="none"/>
      <circle cx="30" cy="30" r="4" fill={B.gold}/>
      <circle cx="30" cy="30" r="2" fill={B.black}/>
    </svg>
  )
}

// ─── Shared field renderer ────────────────────────────────────────────────────

function FieldGroup({ field, value, onChange, accentColor }) {
  const baseStyle = {
    width:'100%', padding:'10px 14px', borderRadius:'10px',
    background:'rgba(107,15,110,0.15)', border:`1px solid ${accentColor || B.gold}33`,
    color:B.white, fontSize:'13px', outline:'none',
  }
  return (
    <div style={{ marginBottom:'14px' }}>
      <label style={{ display:'block', fontSize:'10px', fontWeight:'700', color:accentColor || B.goldLight,
        letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'5px' }}>
        {field.label}
      </label>
      {field.type === 'select' ? (
        <select value={value||''} onChange={e=>onChange(e.target.value)} style={{ ...baseStyle, cursor:'pointer' }}>
          <option value="" style={{background:'#120010'}}>Choisir…</option>
          {field.options.map(o=><option key={o} value={o} style={{background:'#120010'}}>{o}</option>)}
        </select>
      ) : field.type === 'textarea' ? (
        <textarea value={value||''} onChange={e=>onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={['transcript','contenu','piliers','debelvoix_analyse','sujet','besoin','services'].includes(field.key) ? 6 : 3}
          style={{ ...baseStyle, resize:'vertical', fontFamily:'system-ui,sans-serif', lineHeight:'1.5' }}/>
      ) : (
        <input type="text" value={value||''} onChange={e=>onChange(e.target.value)}
          placeholder={field.placeholder} style={baseStyle}/>
      )}
    </div>
  )
}

// ─── Modal (agent individuel) ─────────────────────────────────────────────────

function Modal({ agent, onClose }) {
  const form = FORMS[agent.id]
  const [data, setData] = useState({})
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [imageBase64, setImageBase64] = useState(null)
  const [imageMediaType, setImageMediaType] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const fileInputRef = useRef(null)
  const isDesigner = agent.id === 'designer'

  function handleImageUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const allowed = ['image/jpeg','image/png','image/gif','image/webp']
    if (!allowed.includes(file.type)) { setError('Format non supporté. Utilise JPG, PNG, GIF ou WebP.'); return }
    if (file.size > 5 * 1024 * 1024) { setError('Image trop lourde (max 5 Mo).'); return }
    setError('')
    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = ev.target.result
      const base64 = result.split(',')[1]
      setImageBase64(base64)
      setImageMediaType(file.type)
      setImagePreview(result)
    }
    reader.readAsDataURL(file)
  }

  async function generate() {
    setLoading(true); setResponse(''); setError('')
    try {
      const body = {
        agentId: agent.id,
        systemPrompt: form.system,
        userPrompt: form.userPrompt(data),
      }
      if (isDesigner && imageBase64) {
        body.imageBase64 = imageBase64
        body.imageMediaType = imageMediaType
      }
      const res = await fetch('/api/brief', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(`Erreur ${res.status}`)
      const reader = res.body.getReader(); const decoder = new TextDecoder(); let text = ''
      while (true) {
        const { done, value } = await reader.read(); if (done) break
        text += decoder.decode(value, { stream:true }); setResponse(text)
      }
    } catch (e) { setError(e.message || 'Erreur inconnue') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(10,0,8,0.9)', backdropFilter:'blur(12px)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:'linear-gradient(160deg,#120010 0%,#0a0008 60%)',
        border:`1px solid ${agent.color}44`, borderRadius:'20px', padding:'32px',
        width:'100%', maxWidth:'660px', maxHeight:'90vh', overflowY:'auto',
        position:'relative', boxShadow:`0 0 60px ${agent.color}22` }}>
        <button onClick={onClose} style={{ position:'absolute', top:'16px', right:'16px',
          background:'transparent', border:'1px solid rgba(250,248,251,0.15)', borderRadius:'8px',
          color:'rgba(250,248,251,0.5)', width:'32px', height:'32px', cursor:'pointer', fontSize:'16px' }}>×</button>
        <div style={{ display:'flex', alignItems:'center', gap:'16px', marginBottom:'24px' }}>
          <img src={getAvatarPath(agent.id)} alt={agent.prenom}
            style={{ width:'56px', height:'56px', borderRadius:'50%', objectFit:'cover', objectPosition:'top', border:`2px solid ${agent.color}66` }}/>
          <div>
            <div style={{ fontFamily:'Georgia,serif', fontSize:'20px', fontWeight:'900', color:B.white }}>{form.title}</div>
            <div style={{ fontSize:'12px', color:'rgba(250,248,251,0.45)' }}>{form.subtitle}</div>
          </div>
        </div>
        <div style={{ height:'1px', background:`linear-gradient(90deg,transparent,${agent.color}88,transparent)`, marginBottom:'24px' }}/>
        {!response && !loading && (
          <>
            {form.fields.map(field => (
              <FieldGroup key={field.key} field={field} value={data[field.key]}
                onChange={v=>setData({...data,[field.key]:v})} accentColor={agent.accent}/>
            ))}

            {/* Image de référence — Zara uniquement */}
            {isDesigner && (
              <div style={{ marginBottom:'18px' }}>
                <label style={{ display:'block', fontSize:'10px', fontWeight:'700', color:B.gold,
                  letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'8px' }}>
                  Image de référence (optionnel)
                </label>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleImageUpload} style={{ display:'none' }}/>
                {!imagePreview ? (
                  <button onClick={() => fileInputRef.current?.click()} style={{
                    width:'100%', padding:'14px',
                    background:'rgba(201,168,76,0.07)', border:`1px dashed ${B.gold}44`,
                    borderRadius:'10px', color:B.gold, fontSize:'12px', cursor:'pointer',
                    display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
                  }}>
                    <span style={{ fontSize:'18px' }}>📎</span>
                    Uploader une image de référence (JPG, PNG, WebP — max 5 Mo)
                  </button>
                ) : (
                  <div style={{ position:'relative', borderRadius:'10px', overflow:'hidden', border:`1px solid ${B.gold}44` }}>
                    <img src={imagePreview} alt="Référence" style={{ width:'100%', maxHeight:'180px', objectFit:'cover', display:'block' }}/>
                    <div style={{ position:'absolute', inset:0, background:'rgba(10,0,8,0.55)',
                      display:'flex', alignItems:'center', justifyContent:'center', gap:'10px' }}>
                      <span style={{ fontSize:'11px', color:B.goldLight, fontWeight:'600' }}>✓ Zara analysera ce style</span>
                      <button onClick={() => { setImagePreview(null); setImageBase64(null); setImageMediaType(null); if(fileInputRef.current) fileInputRef.current.value='' }}
                        style={{ padding:'4px 10px', background:'rgba(255,107,107,0.2)', border:'1px solid rgba(255,107,107,0.4)',
                          borderRadius:'6px', color:'#ff6b6b', fontSize:'10px', cursor:'pointer' }}>
                        Retirer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {error && <div style={{ color:'#ff6b6b', fontSize:'12px', marginBottom:'12px' }}>⚠ {error}</div>}
            <button onClick={generate} style={{ width:'100%', padding:'14px',
              background:`linear-gradient(135deg,${agent.color},${B.violetDeep})`,
              border:`1px solid ${agent.color}66`, borderRadius:'12px',
              color:B.white, fontSize:'14px', fontWeight:'700', cursor:'pointer' }}>
              ✦ Activer {agent.prenom} →
            </button>
          </>
        )}
        {loading && (
          <div style={{ textAlign:'center', padding:'40px 0' }}>
            <div style={{ width:'40px', height:'40px', borderRadius:'50%', margin:'0 auto 16px',
              border:`2px solid ${agent.color}22`, borderTop:`2px solid ${agent.color}`,
              animation:'spin 0.8s linear infinite' }}/>
            <p style={{ color:'rgba(250,248,251,0.5)', fontSize:'13px' }}>{agent.prenom} analyse le brief…</p>
          </div>
        )}
        {response && (
          <>
            <div style={{ marginBottom:'16px' }}>
              <div style={{ fontSize:'11px', fontWeight:'700', color:agent.accent, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'10px' }}>
                Réponse de {agent.prenom}
              </div>
              <div style={{ background:'rgba(10,0,8,0.5)', border:`1px solid ${agent.color}33`,
                borderRadius:'12px', padding:'18px', fontSize:'13px', color:'rgba(250,248,251,0.85)',
                lineHeight:'1.75', whiteSpace:'pre-wrap', maxHeight:'360px', overflowY:'auto', fontFamily:'system-ui,sans-serif' }}>
                {response}
              </div>
            </div>
            <div style={{ display:'flex', gap:'10px', marginBottom:'12px', flexWrap:'wrap' }}>
              <button onClick={() => { navigator.clipboard.writeText(response).then(() => { setCopied(true); setTimeout(()=>setCopied(false),2000) }) }}
                style={{ flex:1, minWidth:'140px', padding:'12px',
                  background: copied ? 'rgba(201,168,76,0.2)' : 'rgba(107,15,110,0.3)',
                  border:`1px solid ${copied ? B.gold : agent.color}55`, borderRadius:'10px',
                  color: copied ? B.goldLight : B.white, fontSize:'13px', fontWeight:'600', cursor:'pointer' }}>
                {copied ? '✓ Copié !' : '📋 Copier'}
              </button>
              {isDesigner && (
                <a href="https://www.canva.com/design/new" target="_blank" rel="noopener noreferrer"
                  onClick={() => navigator.clipboard.writeText(response)}
                  style={{ flex:1, minWidth:'140px', padding:'12px',
                    background:'linear-gradient(135deg,#7c3aed,#4f46e5)',
                    border:'1px solid #7c3aed88', borderRadius:'10px',
                    color:B.white, fontSize:'13px', fontWeight:'700', cursor:'pointer',
                    textDecoration:'none', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>
                  🎨 Ouvrir Canva
                </a>
              )}
            </div>
            {isDesigner && (
              <div style={{ padding:'10px 14px', background:'rgba(201,168,76,0.07)', border:`1px solid ${B.gold}22`,
                borderRadius:'8px', fontSize:'11px', color:'rgba(250,248,251,0.45)', marginBottom:'10px' }}>
                💡 Le brief Canva est copié dans ton presse-papier. Clique "Ouvrir Canva" pour créer ton design avec ces specs.
              </div>
            )}
            <NotionSaveWidget
              response={response}
              agentEmoji={agent.emoji}
              agentName={agent.prenom}
              clientName={data.client || ''}
              accentColor={agent.color}
            />
            <button onClick={() => { setResponse(''); setData({}); setImagePreview(null); setImageBase64(null); setImageMediaType(null) }}
              style={{ width:'100%', padding:'10px',
                background:'transparent', border:'1px solid rgba(250,248,251,0.12)', borderRadius:'10px',
                color:'rgba(250,248,251,0.4)', fontSize:'12px', cursor:'pointer' }}>
              ← Nouveau brief
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── HTML download helper (Olivia + Anna) ────────────────────────────────────

function downloadResponseAsHtml(responseText, agentId, agentName, agentEmoji, agentColor, clientName) {
  const date = new Date().toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' })
  const slug = (clientName || agentId).toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')

  // Render HEX swatches + links + basic markdown
  const styledContent = responseText
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/#([0-9a-fA-F]{6})\b/g, (m, hex) =>
      `<span class="hex-chip"><span class="swatch" style="background:#${hex}"></span>#${hex}</span>`)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^━+$/gm, '<hr class="divider">')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\n/g, '<br>')

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${agentEmoji} ${agentName} — ${clientName || 'B.BOLD'} — ${date}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Inter:wght@400;500;600&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Inter',sans-serif;background:#0a0008;color:#faf8fb;min-height:100vh;padding:0}
  .header{background:linear-gradient(135deg,#120010,#1a001a);border-bottom:1px solid ${agentColor}44;padding:32px 48px;display:flex;align-items:center;gap:20px}
  .header-emoji{font-size:48px;line-height:1}
  .header-title{font-family:'Playfair Display',serif;font-size:28px;font-weight:900;color:#faf8fb}
  .header-meta{font-size:13px;color:rgba(250,248,251,0.45);margin-top:4px}
  .header-badge{background:${agentColor}22;border:1px solid ${agentColor}55;color:${agentColor};font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;letter-spacing:0.08em;margin-top:8px;display:inline-block}
  .content{max-width:860px;margin:0 auto;padding:48px 48px 80px}
  h1{font-family:'Playfair Display',serif;font-size:24px;font-weight:900;color:#faf8fb;margin:32px 0 14px;border-left:3px solid ${agentColor};padding-left:16px}
  h2{font-family:'Playfair Display',serif;font-size:18px;font-weight:700;color:#faf8fb;margin:28px 0 12px;padding-bottom:8px;border-bottom:1px solid rgba(250,248,251,0.1)}
  .body-text{font-size:14px;line-height:1.85;color:rgba(250,248,251,0.82)}
  .hex-chip{display:inline-flex;align-items:center;gap:6px;background:rgba(250,248,251,0.06);border:1px solid rgba(250,248,251,0.12);border-radius:6px;padding:2px 8px;font-size:12px;font-family:'Inter',sans-serif;font-weight:600;color:#faf8fb;vertical-align:middle;margin:2px 3px}
  .swatch{width:16px;height:16px;border-radius:3px;border:1px solid rgba(255,255,255,0.2);flex-shrink:0;display:inline-block}
  .divider{border:none;border-top:1px solid rgba(250,248,251,0.12);margin:24px 0}
  hr.divider{border:none;height:2px;background:linear-gradient(90deg,transparent,${agentColor}55,transparent);margin:28px 0}
  a{color:${agentColor};text-decoration:underline;word-break:break-all}
  a:hover{opacity:0.8}
  strong{font-weight:700;color:#faf8fb}
  .footer{text-align:center;padding:32px;border-top:1px solid rgba(250,248,251,0.08);font-size:11px;color:rgba(250,248,251,0.25);margin-top:40px}
  @media print{body{background:#fff;color:#111}.header{background:#f5f5f5;border-bottom:1px solid #ddd}.content{padding:24px}.header-title,.body-text,h1,h2,strong{color:#111!important}.hex-chip{border:1px solid #ccc;background:#f9f9f9;color:#111!important}}
</style>
</head>
<body>
<div class="header">
  <div class="header-emoji">${agentEmoji}</div>
  <div>
    <div class="header-title">${agentName}</div>
    <div class="header-meta">B.BOLD Agency · ${clientName || ''} · ${date}</div>
    <div class="header-badge">B.BOLD CORE</div>
  </div>
</div>
<div class="content">
  <div class="body-text">${styledContent}</div>
</div>
<div class="footer">Généré par B.BOLD Core · ${agentEmoji} ${agentName} · ${date}</div>
</body>
</html>`

  const blob = new Blob([html], { type:'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `bbold-${agentId}-${slug}-${Date.now()}.html`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── NotionSaveWidget ─────────────────────────────────────────────────────────

function NotionSaveWidget({ response, agentEmoji, agentName, clientName, accentColor }) {
  const [open, setOpen]         = useState(false)
  const [url, setUrl]           = useState('')
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [err, setErr]           = useState('')

  async function save() {
    if (!url.trim()) { setErr('Colle l\'URL de la page Notion du client.'); return }
    setSaving(true); setErr('')
    try {
      const res = await fetch('/api/notion/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageUrl: url, content: response, agentEmoji, agentName, clientName }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`)
      setSaved(true); setOpen(false); setUrl('')
      setTimeout(() => setSaved(false), 4000)
    } catch (e) { setErr(e.message) }
    finally { setSaving(false) }
  }

  const color = accentColor || '#6b0f6e'

  return (
    <div style={{ marginBottom:'8px' }}>
      {!open && !saved && (
        <button onClick={() => setOpen(true)} style={{
          width:'100%', padding:'11px', display:'flex', alignItems:'center', justifyContent:'center', gap:'7px',
          background:'rgba(0,0,0,0)', border:'1px solid rgba(250,248,251,0.15)', borderRadius:'10px',
          color:'rgba(250,248,251,0.55)', fontSize:'12px', fontWeight:'600', cursor:'pointer',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          → Sauvegarder dans Notion
        </button>
      )}
      {saved && (
        <div style={{ padding:'11px', textAlign:'center', background:'rgba(16,185,129,0.1)',
          border:'1px solid rgba(16,185,129,0.3)', borderRadius:'10px',
          color:'#6ee7b7', fontSize:'12px', fontWeight:'600' }}>
          ✓ Ajouté dans Notion
        </div>
      )}
      {open && (
        <div style={{ background:'rgba(10,0,8,0.6)', border:`1px solid ${color}33`, borderRadius:'12px', padding:'16px' }}>
          <div style={{ fontSize:'10px', fontWeight:'700', color:'rgba(250,248,251,0.4)',
            letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'8px' }}>
            URL de la page Notion du client
          </div>
          <input
            type="text" value={url} onChange={e => { setUrl(e.target.value); setErr('') }}
            placeholder="https://notion.so/..."
            style={{ width:'100%', padding:'9px 12px', borderRadius:'8px',
              background:'rgba(107,15,110,0.15)', border:`1px solid ${color}44`,
              color:B.white, fontSize:'12px', outline:'none', marginBottom:'8px',
              fontFamily:'system-ui,sans-serif' }}
          />
          {err && <div style={{ color:'#ff6b6b', fontSize:'11px', marginBottom:'8px' }}>⚠ {err}</div>}
          <div style={{ display:'flex', gap:'8px' }}>
            <button onClick={save} disabled={saving} style={{
              flex:1, padding:'9px', borderRadius:'8px', fontSize:'12px', fontWeight:'700', cursor:'pointer',
              background: saving ? 'rgba(107,15,110,0.3)' : `linear-gradient(135deg,${color}cc,${color}77)`,
              border:`1px solid ${color}66`, color:B.white,
            }}>
              {saving ? '⏳ Envoi…' : '✓ Confirmer'}
            </button>
            <button onClick={() => { setOpen(false); setErr('') }} style={{
              padding:'9px 14px', borderRadius:'8px', fontSize:'12px', cursor:'pointer',
              background:'transparent', border:'1px solid rgba(250,248,251,0.12)', color:'rgba(250,248,251,0.4)',
            }}>
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── SupportModal ─────────────────────────────────────────────────────────────

function SupportModal({ agent, onClose }) {
  const form = SUPPORT_FORMS[agent.id]
  const [data, setData] = useState({})
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const isOlivia = agent.id === 'olivia'
  const isAnna   = agent.id === 'anna'
  const hasDownload = isOlivia || isAnna

  async function generate() {
    setLoading(true); setResponse(''); setError('')
    try {
      const res = await fetch('/api/agents/support', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ agentId:agent.id, ...data }),
      })
      if (!res.ok) throw new Error(`Erreur ${res.status}`)
      const reader = res.body.getReader(); const decoder = new TextDecoder(); let text = ''
      while (true) {
        const { done, value } = await reader.read(); if (done) break
        text += decoder.decode(value, { stream:true }); setResponse(text)
      }
    } catch (e) { setError(e.message || 'Erreur inconnue') }
    finally { setLoading(false) }
  }

  const loadingMsg = isOlivia
    ? 'Olivia scrute le web en temps réel…'
    : isAnna
    ? 'Anna construit le brand board…'
    : `Agent ${agent.name} en cours…`

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(10,0,8,0.9)', backdropFilter:'blur(12px)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:'linear-gradient(160deg,#120010 0%,#0a0008 60%)',
        border:`1px solid ${agent.color}55`, borderRadius:'20px', padding:'32px',
        width:'100%', maxWidth:'660px', maxHeight:'90vh', overflowY:'auto',
        position:'relative', boxShadow:`0 0 60px ${agent.color}18` }}>
        <button onClick={onClose} style={{ position:'absolute', top:'16px', right:'16px',
          background:'transparent', border:'1px solid rgba(250,248,251,0.15)', borderRadius:'8px',
          color:'rgba(250,248,251,0.5)', width:'32px', height:'32px', cursor:'pointer', fontSize:'16px' }}>×</button>
        <div style={{ display:'flex', alignItems:'center', gap:'16px', marginBottom:'24px' }}>
          <div style={{ width:'56px', height:'56px', borderRadius:'50%', display:'flex', alignItems:'center',
            justifyContent:'center', fontSize:'26px', background:`${agent.color}18`, border:`2px solid ${agent.color}55`, flexShrink:0 }}>
            {agent.emoji}
          </div>
          <div>
            <div style={{ fontFamily:'Georgia,serif', fontSize:'20px', fontWeight:'900', color:B.white }}>{form.title}</div>
            <div style={{ fontSize:'12px', color:'rgba(250,248,251,0.45)' }}>{form.subtitle}</div>
          </div>
        </div>
        <div style={{ height:'1px', background:`linear-gradient(90deg,transparent,${agent.color}88,transparent)`, marginBottom:'24px' }}/>

        {/* ── FORM ─────────────────────────────────────────────────── */}
        {!response && !loading && (
          <>
            {form.fields.map(field => (
              <FieldGroup key={field.key} field={field} value={data[field.key]}
                onChange={v=>setData({...data,[field.key]:v})} accentColor={agent.accent}/>
            ))}
            {isOlivia && (
              <div style={{ padding:'10px 14px', background:'rgba(220,38,38,0.06)', border:'1px solid rgba(220,38,38,0.2)',
                borderRadius:'8px', fontSize:'11px', color:'rgba(250,248,251,0.45)', marginBottom:'14px' }}>
                📡 Olivia synthétise la veille comm via Claude Opus — campagnes réelles, tendances plateformes, insights actionnables.
              </div>
            )}
            {error && <div style={{ color:'#ff6b6b', fontSize:'12px', marginBottom:'12px' }}>⚠ {error}</div>}
            <button onClick={generate} style={{ width:'100%', padding:'14px',
              background:`linear-gradient(135deg,${agent.color}cc,${agent.color}66)`,
              border:`1px solid ${agent.color}77`, borderRadius:'12px',
              color:B.white, fontSize:'14px', fontWeight:'700', cursor:'pointer' }}>
              ✦ Activer {agent.name} →
            </button>
          </>
        )}

        {/* ── LOADING ───────────────────────────────────────────────── */}
        {loading && (
          <div style={{ textAlign:'center', padding:'40px 0' }}>
            <div style={{ width:'40px', height:'40px', borderRadius:'50%', margin:'0 auto 16px',
              border:`2px solid ${agent.color}22`, borderTop:`2px solid ${agent.color}`,
              animation:'spin 0.8s linear infinite' }}/>
            <p style={{ color:'rgba(250,248,251,0.5)', fontSize:'13px' }}>{loadingMsg}</p>
          </div>
        )}

        {/* ── RESPONSE ──────────────────────────────────────────────── */}
        {response && (
          <>
            <div style={{ marginBottom:'16px' }}>
              <div style={{ fontSize:'11px', fontWeight:'700', color:agent.accent, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'10px' }}>
                {isOlivia ? '📡 Rapport de veille' : isAnna ? '👑 Brand Board' : `Résultat — ${agent.name}`}
              </div>
              <div style={{ background:'rgba(10,0,8,0.5)', border:`1px solid ${agent.color}33`,
                borderRadius:'12px', padding:'18px', fontSize:'13px', color:'rgba(250,248,251,0.85)',
                lineHeight:'1.75', whiteSpace:'pre-wrap', maxHeight:'420px', overflowY:'auto', fontFamily:'system-ui,sans-serif' }}>
                {response}
              </div>
            </div>

            {/* ── ACTIONS ─────────────────────────────────────────── */}
            <div style={{ display:'flex', gap:'10px', marginBottom:'12px', flexWrap:'wrap' }}>
              <button onClick={() => { navigator.clipboard.writeText(response).then(() => { setCopied(true); setTimeout(()=>setCopied(false),2000) }) }}
                style={{ flex:1, minWidth:'120px', padding:'12px',
                  background: copied ? `${agent.color}22` : 'rgba(107,15,110,0.3)',
                  border:`1px solid ${agent.color}55`, borderRadius:'10px',
                  color: copied ? agent.accent : B.white, fontSize:'13px', fontWeight:'600', cursor:'pointer' }}>
                {copied ? '✓ Copié !' : '📋 Copier'}
              </button>

              {hasDownload && (
                <button
                  onClick={() => downloadResponseAsHtml(
                    response, agent.id, agent.name, agent.emoji, agent.color,
                    data.client || data.focus || ''
                  )}
                  style={{ flex:1, minWidth:'180px', padding:'12px',
                    background:`linear-gradient(135deg,${agent.color}cc,${agent.color}77)`,
                    border:`1px solid ${agent.color}88`, borderRadius:'10px',
                    color:B.white, fontSize:'13px', fontWeight:'700', cursor:'pointer',
                    display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>
                  {isAnna ? '👑 Télécharger Brand Board' : '📥 Télécharger Rapport HTML'}
                </button>
              )}
            </div>

            {isAnna && (
              <div style={{ padding:'10px 14px', background:'rgba(180,83,9,0.07)', border:'1px solid rgba(180,83,9,0.25)',
                borderRadius:'8px', fontSize:'11px', color:'rgba(250,248,251,0.45)', marginBottom:'10px' }}>
                👑 Le brand board HTML s'ouvre dans ton navigateur. Tu peux l'imprimer ou le partager directement au client.
              </div>
            )}
            {isOlivia && (
              <div style={{ padding:'10px 14px', background:'rgba(220,38,38,0.06)', border:'1px solid rgba(220,38,38,0.2)',
                borderRadius:'8px', fontSize:'11px', color:'rgba(250,248,251,0.45)', marginBottom:'10px' }}>
                📡 Rapport avec sources cliquables. Le fichier HTML s'ouvre dans ton navigateur.
              </div>
            )}

            <NotionSaveWidget
              response={response}
              agentEmoji={agent.emoji}
              agentName={agent.name}
              clientName={data.client || data.focus || ''}
              accentColor={agent.color}
            />

            <button onClick={() => { setResponse(''); setData({}) }} style={{ width:'100%', padding:'10px',
              background:'transparent', border:'1px solid rgba(250,248,251,0.12)', borderRadius:'10px',
              color:'rgba(250,248,251,0.4)', fontSize:'12px', cursor:'pointer' }}>
              ← Nouvelle requête
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── HistoryModal ─────────────────────────────────────────────────────────────

function HistoryModal({ campaign, onClose }) {
  const [expandedStep, setExpandedStep] = useState(0)
  const [copied, setCopied] = useState(null)
  const [copiedAll, setCopiedAll] = useState(false)

  const stepsWithOutput = PIPELINE_STEPS.map(step => ({
    ...step, status: campaign.outputs[step.id] ? 'done' : 'pending', output: campaign.outputs[step.id] || '',
  }))

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(10,0,8,0.96)', backdropFilter:'blur(16px)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
      <div style={{ background:'linear-gradient(160deg,#120010 0%,#0a0008 60%)', border:`1px solid ${B.gold}44`,
        borderRadius:'20px', width:'100%', maxWidth:'900px', maxHeight:'92vh', overflow:'hidden',
        display:'flex', flexDirection:'column', boxShadow:`0 0 80px ${B.magenta}10` }}>
        <div style={{ padding:'20px 24px 0', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
            <Eye size={26}/>
            <div>
              <div style={{ fontFamily:'Georgia,serif', fontSize:'17px', fontWeight:'900', color:B.white }}>{campaign.client}</div>
              <div style={{ fontSize:'9px', color:B.gold, letterSpacing:'0.18em', marginTop:'2px' }}>
                {campaign.date} · {campaign.objectif || '—'} · {campaign.plateformes || '—'}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background:'transparent', border:'1px solid rgba(250,248,251,0.15)',
            borderRadius:'8px', color:'rgba(250,248,251,0.5)', width:'32px', height:'32px', cursor:'pointer', fontSize:'16px' }}>×</button>
        </div>
        <div style={{ height:'1px', background:`linear-gradient(90deg,transparent,${B.gold}66,transparent)`, margin:'16px 0 0' }}/>
        <div style={{ flex:1, overflowY:'auto', padding:'16px 24px 24px', display:'flex', flexDirection:'column', gap:'10px' }}>
          {stepsWithOutput.filter(s => s.status === 'done').map((step, idx) => {
            const isOpen = expandedStep === idx
            const wordCount = step.output ? step.output.trim().split(/\s+/).length : 0
            return (
              <div key={step.id} style={{ border:`1px solid ${step.color}33`, borderRadius:'12px', overflow:'hidden' }}>
                <div onClick={() => setExpandedStep(isOpen ? null : idx)}
                  style={{ padding:'12px 16px', display:'flex', alignItems:'center', gap:'10px', cursor:'pointer', background:`${step.color}0d` }}>
                  <img src={getAvatarPath(step.id)} alt={step.prenom}
                    style={{ width:'30px', height:'30px', borderRadius:'50%', objectFit:'cover', objectPosition:'top', border:`1.5px solid ${step.color}55`, flexShrink:0 }}/>
                  <div style={{ flex:1 }}>
                    <span style={{ fontSize:'13px', fontWeight:'700', color:B.white }}>{step.prenom}</span>
                    <span style={{ fontSize:'10px', color:step.color, marginLeft:'8px' }}>→ {step.folder}</span>
                  </div>
                  <span style={{ fontSize:'9px', color:B.gold, opacity:0.7 }}>✓ {wordCount} mots</span>
                  <span style={{ fontSize:'11px', color:'rgba(250,248,251,0.25)', marginLeft:'6px' }}>{isOpen ? '▲' : '▼'}</span>
                </div>
                {isOpen && (
                  <div style={{ padding:'0 16px 14px' }}>
                    <div style={{ background:'rgba(10,0,8,0.45)', borderRadius:'10px', padding:'14px',
                      fontSize:'12px', color:'rgba(250,248,251,0.8)', lineHeight:'1.78',
                      whiteSpace:'pre-wrap', maxHeight:'340px', overflowY:'auto', marginBottom:'8px', fontFamily:'system-ui,sans-serif' }}>
                      {step.output}
                    </div>
                    <button onClick={() => { navigator.clipboard.writeText(step.output).then(() => { setCopied(idx); setTimeout(()=>setCopied(null),2000) }) }}
                      style={{ padding:'7px 14px', background: copied===idx ? `${step.color}18` : 'rgba(107,15,110,0.2)',
                        border:`1px solid ${step.color}44`, borderRadius:'8px',
                        color: copied===idx ? step.color : B.white, fontSize:'11px', cursor:'pointer' }}>
                      {copied===idx ? '✓ Copié' : '📋 Copier'}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
          <div style={{ display:'flex', gap:'10px', marginTop:'6px', flexWrap:'wrap' }}>
            <button onClick={() => downloadMd(campaign, stepsWithOutput)} style={{ flex:1, minWidth:'180px', padding:'10px 20px',
              background:`linear-gradient(135deg,${B.gold}cc,${B.goldLight}88)`, border:`1px solid ${B.gold}88`,
              borderRadius:'10px', color:B.black, fontSize:'12px', fontWeight:'800', cursor:'pointer' }}>
              ⬇ Télécharger (.md)
            </button>
            <button onClick={() => { const md = buildMarkdown(campaign, stepsWithOutput); navigator.clipboard.writeText(md).then(() => { setCopiedAll(true); setTimeout(()=>setCopiedAll(false),2000) }) }}
              style={{ flex:1, minWidth:'180px', padding:'10px 20px',
                background: copiedAll ? `${B.gold}18` : 'rgba(107,15,110,0.25)',
                border:`1px solid ${copiedAll ? B.gold : B.border}`, borderRadius:'10px',
                color: copiedAll ? B.goldLight : B.white, fontSize:'12px', fontWeight:'700', cursor:'pointer' }}>
              {copiedAll ? '✓ Copié !' : '📋 Copier tout (.md)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── OrchestratorModal ────────────────────────────────────────────────────────

function OrchestratorModal({ onClose, onLaunch }) {
  const ORCH_FIELDS = [
    { key:'client',   label:'Nom du client / marque', type:'text',     placeholder:'Ex: Caraïb Ediprint' },
    { key:'projet',   label:'Décris le projet',        type:'textarea', placeholder:'Ex: Refonte complète de la présence digitale pour une imprimerie martiniquaise. Objectif : générer des leads B2B via LinkedIn et Instagram...' },
    { key:'objectif', label:'Objectif principal',      type:'select',   options:['Notoriété de marque','Génération de leads','Augmenter les ventes','Fidéliser la communauté','Lancement produit/service'] },
    { key:'budget',   label:'Budget mensuel',          type:'text',     placeholder:'Ex: 1 500€/mois' },
    { key:'urgence',  label:'Urgence',                 type:'select',   options:["Lancement immédiat","Sous 2 semaines","Sous 1 mois","Pas d'urgence"] },
  ]

  const [data, setData] = useState({})
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [parsedAgents, setParsedAgents] = useState(null)
  const [rationale, setRationale] = useState('')

  async function analyse() {
    if (!data.client || !data.projet) return
    setLoading(true); setResponse(''); setError(''); setParsedAgents(null); setRationale('')

    const userPrompt = `CLIENT : ${data.client || '—'}
PROJET : ${data.projet || '—'}
OBJECTIF : ${data.objectif || '—'}
BUDGET : ${data.budget || '—'}
URGENCE : ${data.urgence || '—'}

Analyse ce projet et sélectionne les agents B.BOLD les plus adaptés.`

    try {
      const res = await fetch('/api/brief', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ agentId:'orchestrateur', systemPrompt:ORCH_SYSTEM, userPrompt, max_tokens:3500 }),
      })
      if (!res.ok) throw new Error(`Erreur ${res.status}`)
      const reader = res.body.getReader(); const decoder = new TextDecoder(); let text = ''
      while (true) {
        const { done, value } = await reader.read(); if (done) break
        text += decoder.decode(value, { stream:true }); setResponse(text)
      }
      const match = text.match(/```json\s*([\s\S]*?)\s*```/)
      if (match) {
        try {
          const parsed = JSON.parse(match[1])
          setParsedAgents(parsed.selected_agents || [])
          setRationale(parsed.rationale || '')
        } catch (_) {}
      }
    } catch (e) { setError(e.message || 'Erreur inconnue') }
    finally { setLoading(false) }
  }

  const displayText = response.replace(/```json[\s\S]*?```/g, '').trim()

  function handleLaunch() {
    if (!parsedAgents) return
    onLaunch({
      brief: { client:data.client, objectif:data.objectif, budget:data.budget, secteur:'', plateformes:'', ton:'', cible:data.projet },
      selectedAgents: parsedAgents,
    })
    onClose()
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(10,0,8,0.95)', backdropFilter:'blur(16px)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}
      onClick={e => e.target === e.currentTarget && !loading && onClose()}>
      <div style={{ background:'linear-gradient(160deg,#120010 0%,#0a0008 60%)',
        border:`1px solid ${B.gold}55`, borderRadius:'20px', padding:'32px',
        width:'100%', maxWidth:'700px', maxHeight:'92vh', overflowY:'auto',
        position:'relative', boxShadow:`0 0 80px ${B.gold}18` }}>

        {!loading && (
          <button onClick={onClose} style={{ position:'absolute', top:'16px', right:'16px',
            background:'transparent', border:'1px solid rgba(250,248,251,0.15)', borderRadius:'8px',
            color:'rgba(250,248,251,0.5)', width:'32px', height:'32px', cursor:'pointer', fontSize:'16px' }}>×</button>
        )}

        <div style={{ display:'flex', alignItems:'center', gap:'16px', marginBottom:'8px' }}>
          <Eye size={44}/>
          <div>
            <div style={{ fontFamily:'Georgia,serif', fontSize:'22px', fontWeight:'900', color:B.white }}>Orchestrateur</div>
            <div style={{ fontSize:'11px', color:B.gold, letterSpacing:'0.12em' }}>CHEF DE PROJET · CLAUDE OPUS</div>
          </div>
        </div>
        <p style={{ fontSize:'12px', color:'rgba(250,248,251,0.45)', marginBottom:'24px', lineHeight:'1.6' }}>
          Décris ton projet. L'Orchestrateur analyse le brief et sélectionne les agents les plus adaptés.
        </p>
        <div style={{ height:'1px', background:`linear-gradient(90deg,transparent,${B.gold}77,transparent)`, marginBottom:'24px' }}/>

        {!response && !loading && (
          <>
            {ORCH_FIELDS.map(field => (
              <FieldGroup key={field.key} field={field} value={data[field.key]}
                onChange={v=>setData({...data,[field.key]:v})} accentColor={B.goldLight}/>
            ))}
            {error && <div style={{ color:'#ff6b6b', fontSize:'12px', marginBottom:'12px' }}>⚠ {error}</div>}
            <button onClick={analyse} disabled={!data.client || !data.projet} style={{
              width:'100%', padding:'15px',
              background: (data.client && data.projet) ? `linear-gradient(135deg,${B.gold}cc,${B.goldLight}88)` : 'rgba(201,168,76,0.1)',
              border:`1px solid ${(data.client && data.projet) ? B.gold+'88' : 'rgba(201,168,76,0.15)'}`,
              borderRadius:'12px', color: (data.client && data.projet) ? B.black : 'rgba(250,248,251,0.25)',
              fontSize:'14px', fontWeight:'800', cursor: (data.client && data.projet) ? 'pointer' : 'not-allowed',
            }}>
              ✦ Analyser le projet →
            </button>
          </>
        )}

        {loading && (
          <div style={{ textAlign:'center', padding:'32px 0' }}>
            <div style={{ width:'44px', height:'44px', borderRadius:'50%', margin:'0 auto 16px',
              border:`2px solid ${B.gold}22`, borderTop:`2px solid ${B.gold}`,
              animation:'spin 0.8s linear infinite' }}/>
            <p style={{ color:'rgba(250,248,251,0.5)', fontSize:'13px' }}>L'Orchestrateur analyse le projet…</p>
          </div>
        )}

        {response && !loading && (
          <>
            <div style={{ background:'rgba(10,0,8,0.5)', border:`1px solid ${B.gold}28`,
              borderRadius:'12px', padding:'16px', fontSize:'12.5px', color:'rgba(250,248,251,0.82)',
              lineHeight:'1.78', whiteSpace:'pre-wrap', maxHeight:'260px', overflowY:'auto',
              fontFamily:'system-ui,sans-serif', marginBottom:'20px' }}>
              {displayText || <span style={{opacity:0.3}}>Analyse en cours…</span>}
            </div>

            {parsedAgents && (
              <>
                <div style={{ fontSize:'10px', fontWeight:'700', color:B.goldLight, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:'12px' }}>
                  Agents sélectionnés
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', marginBottom:'16px' }}>
                  {PIPELINE_STEPS.map(step => {
                    const selected = parsedAgents.includes(step.id)
                    return (
                      <div key={step.id} style={{
                        padding:'7px 14px', borderRadius:'20px', fontSize:'12px', fontWeight:'700',
                        background: selected ? `${step.color}28` : 'rgba(250,248,251,0.04)',
                        border:`1px solid ${selected ? step.color+'77' : 'rgba(250,248,251,0.1)'}`,
                        color: selected ? B.white : 'rgba(250,248,251,0.25)',
                        display:'flex', alignItems:'center', gap:'6px',
                      }}>
                        {selected && <span style={{ color:step.color, fontSize:'14px' }}>{step.emoji}</span>}
                        {step.prenom}
                        {selected && <span style={{ fontSize:'9px', color:step.color, marginLeft:'2px' }}>✓</span>}
                      </div>
                    )
                  })}
                </div>

                {rationale && (
                  <div style={{ padding:'10px 14px', background:`${B.gold}0a`, border:`1px solid ${B.gold}22`,
                    borderRadius:'10px', fontSize:'12px', color:'rgba(250,248,251,0.6)', marginBottom:'20px', lineHeight:'1.6' }}>
                    💡 {rationale}
                  </div>
                )}

                <button onClick={handleLaunch} style={{
                  width:'100%', padding:'15px',
                  background:`linear-gradient(135deg,${B.magenta},${B.violetDeep})`,
                  border:`1px solid ${B.magenta}88`, borderRadius:'12px',
                  color:B.white, fontSize:'14px', fontWeight:'800', cursor:'pointer',
                  boxShadow:`0 4px 20px ${B.magenta}33`,
                }}>
                  🚀 Lancer ces {parsedAgents.length} agent{parsedAgents.length > 1 ? 's' : ''} →
                </button>
              </>
            )}

            <button onClick={() => { setResponse(''); setParsedAgents(null); setRationale('') }}
              style={{ width:'100%', padding:'10px', marginTop:'10px',
                background:'transparent', border:'1px solid rgba(250,248,251,0.1)', borderRadius:'10px',
                color:'rgba(250,248,251,0.35)', fontSize:'12px', cursor:'pointer' }}>
              ← Modifier le brief
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── CampaignModal ────────────────────────────────────────────────────────────

function CampaignModal({ onClose, onSaved, initialBrief, initialSelectedAgents }) {
  const [phase, setPhase] = useState('form')
  const [brief, setBrief] = useState(initialBrief || {})
  const [activeSelectedAgents] = useState(initialSelectedAgents || null)
  const [showUrlFields, setShowUrlFields] = useState(false)

  const effectiveSteps = (activeSelectedAgents && activeSelectedAgents.length > 0)
    ? PIPELINE_STEPS.filter(s => activeSelectedAgents.includes(s.id))
    : PIPELINE_STEPS

  const [stepStatuses, setStepStatuses] = useState(
    Object.fromEntries(PIPELINE_STEPS.map(s => [s.id, { ...s, status:'pending', output:'' }]))
  )

  const [preStepStatus, setPreStepStatus] = useState('idle')
  const [preStepText, setPreStepText] = useState('')
  const [preStepOutput, setPreStepOutput] = useState('')
  const [preStepExpanded, setPreStepExpanded] = useState(false)
  const preStepTextRef = useRef('')
  const preStepRef = useRef(null)

  const [currentActiveAgent, setCurrentActiveAgent] = useState(null)
  const [currentStreamText, setCurrentStreamText] = useState('')
  const [expandedStep, setExpandedStep] = useState(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(null)
  const [copiedAll, setCopiedAll] = useState(false)
  const outputRef = useRef(null)
  const currentOutputRef = useRef('')
  const allOutputsRef = useRef({})

  const hasUrls = !!(brief.site_web || brief.instagram || brief.facebook || brief.linkedin || brief.tiktok)

  async function launch() {
    if (!brief.client) return
    setPhase('running')
    setError('')
    currentOutputRef.current = ''
    allOutputsRef.current = {}
    preStepTextRef.current = ''
    setPreStepStatus('idle')
    setPreStepText('')
    setPreStepOutput('')
    setCurrentActiveAgent(null)
    setCurrentStreamText('')
    setStepStatuses(Object.fromEntries(PIPELINE_STEPS.map(s => [s.id, { ...s, status:'pending', output:'' }])))

    try {
      const res = await fetch('/api/orchestrate', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          ...brief,
          selected_agents: (activeSelectedAgents && activeSelectedAgents.length > 0) ? activeSelectedAgents : undefined,
        }),
      })
      if (!res.ok) throw new Error(`Erreur API ${res.status}`)
      const reader = res.body.getReader(); const decoder = new TextDecoder(); let buffer = ''
      while (true) {
        const { done, value } = await reader.read(); if (done) break
        buffer += decoder.decode(value, { stream:true })
        const lines = buffer.split('\n'); buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.trim()) continue
          try { processEvent(JSON.parse(line)) } catch (_) {}
        }
      }
    } catch (e) {
      setError(e.message || 'Erreur inconnue'); setPhase('done')
    }
  }

  function processEvent(event) {
    switch (event.type) {
      case 'pre_step_start':
        setPreStepStatus('active')
        preStepTextRef.current = ''
        setPreStepText('')
        break

      case 'pre_step_chunk':
        preStepTextRef.current += event.text
        setPreStepText(preStepTextRef.current)
        if (preStepRef.current) preStepRef.current.scrollTop = preStepRef.current.scrollHeight
        break

      case 'pre_step_done':
        setPreStepStatus('done')
        setPreStepOutput(event.output || preStepTextRef.current)
        break

      case 'pre_step_error':
        setPreStepStatus('error')
        break

      case 'step_start':
        setCurrentActiveAgent(event.agent)
        currentOutputRef.current = ''
        setCurrentStreamText('')
        setStepStatuses(prev => {
          const next = { ...prev }
          const idx = effectiveSteps.findIndex(s => s.id === event.agent)
          effectiveSteps.slice(0, idx).forEach(s => {
            if (next[s.id]?.status === 'active') next[s.id] = { ...next[s.id], status:'done' }
          })
          next[event.agent] = { ...next[event.agent], status:'active' }
          return next
        })
        break

      case 'step_chunk':
        currentOutputRef.current += event.text
        setCurrentStreamText(currentOutputRef.current)
        if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight
        break

      case 'step_done': {
        const out = currentOutputRef.current
        allOutputsRef.current[event.agent] = out
        setStepStatuses(prev => ({ ...prev, [event.agent]: { ...prev[event.agent], status:'done', output:out } }))
        break
      }

      case 'step_error':
        setStepStatuses(prev => ({ ...prev, [event.agent]: { ...prev[event.agent], status:'error' } }))
        setError(event.error || 'Erreur inconnue')
        setPhase('done')
        break

      case 'pipeline_done': {
        const entry = {
          id: Date.now(),
          date: new Date().toISOString().split('T')[0],
          client: brief.client, objectif: brief.objectif,
          plateformes: brief.plateformes, budget: brief.budget, secteur: brief.secteur,
          outputs: { ...allOutputsRef.current },
        }
        saveToHistory(entry)
        if (onSaved) onSaved()
        setPhase('done')
        setCurrentActiveAgent(null)
        setExpandedStep(effectiveSteps[0]?.id || null)
        break
      }
    }
  }

  const activeStepInfo = currentActiveAgent ? PIPELINE_STEPS.find(s => s.id === currentActiveAgent) : null
  const allEffectiveDone = effectiveSteps.every(s => stepStatuses[s.id]?.status === 'done')

  function handleDownload() { downloadMd(brief, effectiveSteps.map(s => stepStatuses[s.id] || s)) }
  function handleCopyAll() {
    const md = buildMarkdown(brief, effectiveSteps.map(s => stepStatuses[s.id] || s))
    navigator.clipboard.writeText(md).then(() => { setCopiedAll(true); setTimeout(()=>setCopiedAll(false),2000) })
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(10,0,8,0.96)', backdropFilter:'blur(16px)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
      <div style={{
        background:'linear-gradient(160deg,#120010 0%,#0a0008 60%)',
        border:`1px solid ${B.gold}44`, borderRadius:'20px',
        width:'100%', maxWidth: phase === 'form' ? '640px' : '1060px',
        maxHeight:'92vh', overflow:'hidden', display:'flex', flexDirection:'column',
        boxShadow:`0 0 100px ${B.magenta}12`, transition:'max-width 0.4s ease',
      }}>

        <div style={{ padding:'20px 24px 0', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
            <Eye size={26}/>
            <div>
              <div style={{ fontFamily:'Georgia,serif', fontSize:'17px', fontWeight:'900', color:B.white }}>
                {phase === 'form' && 'Campagne Complète'}
                {phase === 'running' && `En cours — ${brief.client || ''}`}
                {phase === 'done' && `✓ Terminé — ${brief.client || ''}`}
              </div>
              <div style={{ fontSize:'9px', color:B.gold, letterSpacing:'0.18em', marginTop:'2px' }}>
                {phase === 'form' && (activeSelectedAgents ? `${effectiveSteps.length} AGENTS SÉLECTIONNÉS PAR L'ORCHESTRATEUR` : `${effectiveSteps.length} AGENTS · PIPELINE SÉQUENTIEL`)}
                {phase === 'running' && 'PIPELINE EN COURS'}
                {phase === 'done' && "PIPELINE COMPLET · SAUVEGARDÉ DANS L'HISTORIQUE"}
              </div>
            </div>
          </div>
          {phase !== 'running' && (
            <button onClick={onClose} style={{ background:'transparent', border:'1px solid rgba(250,248,251,0.15)',
              borderRadius:'8px', color:'rgba(250,248,251,0.5)', width:'32px', height:'32px', cursor:'pointer', fontSize:'16px' }}>×</button>
          )}
        </div>
        <div style={{ height:'1px', background:`linear-gradient(90deg,transparent,${B.gold}66,transparent)`, margin:'16px 0 0' }}/>

        <div style={{ flex:1, overflow:'hidden', display:'flex' }}>

          {/* ── PHASE FORM ── */}
          {phase === 'form' && (
            <div style={{ flex:1, padding:'20px 24px 24px', overflowY:'auto' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'20px', padding:'10px 14px',
                background:B.surface, border:`1px solid ${B.border}`, borderRadius:'12px', flexWrap:'wrap' }}>
                {effectiveSteps.map((step, i) => (
                  <div key={step.id} style={{ display:'flex', alignItems:'center', gap:'6px', flexShrink:0 }}>
                    <span style={{ padding:'4px 10px', borderRadius:'20px', fontSize:'10px', fontWeight:'700',
                      background:`${step.color}18`, border:`1px solid ${step.color}44`, color:B.white }}>
                      {step.emoji} {step.prenom}
                    </span>
                    {i < effectiveSteps.length - 1 && <span style={{ fontSize:'10px', color:B.gold, opacity:0.45 }}>→</span>}
                  </div>
                ))}
                {activeSelectedAgents && (
                  <span style={{ marginLeft:'auto', fontSize:'8px', color:B.gold, opacity:0.6, flexShrink:0 }}>via Orchestrateur</span>
                )}
              </div>

              {CAMPAIGN_FIELDS.map(field => (
                <FieldGroup key={field.key} field={field} value={brief[field.key]}
                  onChange={v=>setBrief({...brief,[field.key]:v})} accentColor={B.goldLight}/>
              ))}

              <div style={{ marginBottom:'18px' }}>
                <button onClick={() => setShowUrlFields(!showUrlFields)} style={{
                  width:'100%', padding:'10px 14px', borderRadius:'10px', cursor:'pointer',
                  background: showUrlFields ? 'rgba(13,148,136,0.12)' : 'rgba(13,148,136,0.06)',
                  border:`1px solid ${showUrlFields ? '#0d948888' : '#0d948833'}`,
                  color:'#5eead4', fontSize:'12px', fontWeight:'600', textAlign:'left',
                  display:'flex', alignItems:'center', justifyContent:'space-between',
                }}>
                  <span>🔍 Analyse présence digitale existante (optionnel)</span>
                  <span style={{ fontSize:'10px', opacity:0.7 }}>{showUrlFields ? '▲ masquer' : '▼ ajouter des URLs'}</span>
                </button>
                {showUrlFields && (
                  <div style={{ marginTop:'10px', padding:'16px', borderRadius:'12px',
                    background:'rgba(13,148,136,0.07)', border:'1px solid #0d948833' }}>
                    <p style={{ fontSize:'11px', color:'#5eead4', marginBottom:'14px', lineHeight:'1.6' }}>
                      🔍 <strong>Debelvoix</strong> analysera la présence digitale avant de lancer le pipeline.
                    </p>
                    {URL_FIELDS.map(f => (
                      <div key={f.key} style={{ marginBottom:'10px' }}>
                        <label style={{ display:'block', fontSize:'10px', fontWeight:'700', color:'#5eead4',
                          letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'4px' }}>{f.label}</label>
                        <input type="text" value={brief[f.key]||''} onChange={e=>setBrief({...brief,[f.key]:e.target.value})}
                          placeholder={f.placeholder}
                          style={{ width:'100%', padding:'9px 12px', borderRadius:'8px',
                            background:'rgba(13,148,136,0.1)', border:'1px solid #0d948844',
                            color:B.white, fontSize:'12px', outline:'none' }}/>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button onClick={launch} disabled={!brief.client} style={{
                width:'100%', padding:'15px',
                background: brief.client ? `linear-gradient(135deg,${B.magenta},${B.violetDeep})` : 'rgba(107,15,110,0.15)',
                border:`1px solid ${brief.client ? B.magenta+'88' : 'rgba(250,248,251,0.08)'}`,
                borderRadius:'12px', color:B.white, fontSize:'15px', fontWeight:'800',
                cursor: brief.client ? 'pointer' : 'not-allowed', opacity: brief.client ? 1 : 0.45,
              }}>
                🚀 Lancer le Pipeline →
              </button>
            </div>
          )}

          {/* ── PHASE RUNNING / DONE ── */}
          {(phase === 'running' || phase === 'done') && (
            <div style={{ display:'flex', flex:1, overflow:'hidden' }}>

              {/* Sidebar */}
              <div style={{ width:'210px', flexShrink:0, borderRight:`1px solid ${B.border}`,
                padding:'14px 10px', overflowY:'auto', display:'flex', flexDirection:'column', gap:'5px' }}>

                {/* Debelvoix pre-step row */}
                {(hasUrls && preStepStatus !== 'idle') && (
                  <div onClick={() => preStepStatus === 'done' && setPreStepExpanded(!preStepExpanded)}
                    style={{ padding:'10px 11px', borderRadius:'10px', marginBottom:'2px',
                      background: preStepStatus === 'active' ? 'rgba(13,148,136,0.18)' : preStepStatus === 'done' ? 'rgba(13,148,136,0.1)' : 'transparent',
                      border:`1px solid ${preStepStatus === 'active' ? '#0d948866' : preStepStatus === 'done' ? '#0d948833' : 'rgba(250,248,251,0.05)'}`,
                      cursor: preStepStatus === 'done' ? 'pointer' : 'default',
                    }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                      <div style={{ width:'28px', height:'28px', borderRadius:'50%', display:'flex', alignItems:'center',
                        justifyContent:'center', fontSize:'13px', background:'rgba(13,148,136,0.2)',
                        border:'1.5px solid #0d948866', flexShrink:0 }}>🔍</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:'11px', fontWeight:'700', color:B.white }}>Debelvoix</div>
                        <div style={{ fontSize:'8px', color:'#0d9488', opacity:0.8 }}>brand analysis</div>
                      </div>
                      <div style={{ fontSize:'11px', flexShrink:0, color: preStepStatus === 'done' ? '#4ade80' : preStepStatus === 'error' ? '#f87171' : '#0d9488' }}>
                        {preStepStatus === 'done' ? '✓' : preStepStatus === 'error' ? '✕' : <span style={{ animation:'bpulse 1s infinite', display:'inline-block' }}>●</span>}
                      </div>
                    </div>
                  </div>
                )}

                {effectiveSteps.map(step => {
                  const s = stepStatuses[step.id] || step
                  const isActive  = s.status === 'active'
                  const isDone    = s.status === 'done'
                  const isPending = s.status === 'pending'
                  const isError   = s.status === 'error'
                  return (
                    <div key={step.id}
                      onClick={() => isDone && setExpandedStep(expandedStep === step.id ? null : step.id)}
                      style={{ padding:'10px 11px', borderRadius:'10px',
                        background: isActive ? `${step.color}22` : isDone ? `${step.color}10` : 'transparent',
                        border:`1px solid ${isActive ? step.color+'66' : isDone ? step.color+'28' : 'rgba(250,248,251,0.05)'}`,
                        cursor: isDone ? 'pointer' : 'default', transition:'all 0.2s',
                      }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                        <img src={getAvatarPath(step.id)} alt={step.prenom}
                          style={{ width:'28px', height:'28px', borderRadius:'50%', objectFit:'cover', objectPosition:'top',
                            border:`1.5px solid ${step.color}${isActive ? '' : '55'}`,
                            opacity: isPending ? 0.3 : 1, flexShrink:0 }}/>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:'12px', fontWeight:'700', color: isPending ? 'rgba(250,248,251,0.25)' : B.white, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{step.prenom}</div>
                          <div style={{ fontSize:'8px', color:step.color, opacity: isPending ? 0.3 : 0.8, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{step.folder}</div>
                        </div>
                        <div style={{ fontSize:'11px', flexShrink:0, color: isDone ? '#4ade80' : isError ? '#f87171' : isActive ? step.color : 'rgba(250,248,251,0.15)' }}>
                          {isDone ? '✓' : isError ? '✕' : isActive ? <span style={{ animation:'bpulse 1s infinite', display:'inline-block' }}>●</span> : '○'}
                        </div>
                      </div>
                    </div>
                  )
                })}

                {phase === 'done' && (
                  <button onClick={() => {
                    setPhase('form')
                    setStepStatuses(Object.fromEntries(PIPELINE_STEPS.map(s => [s.id, {...s,status:'pending',output:''}])))
                    setPreStepStatus('idle'); setPreStepText(''); setPreStepOutput('')
                    setExpandedStep(null); setCurrentActiveAgent(null); setError('')
                    allOutputsRef.current = {}
                  }} style={{ marginTop:'10px', padding:'9px 11px', background:'transparent',
                    border:`1px solid ${B.border}`, borderRadius:'10px',
                    color:'rgba(250,248,251,0.35)', fontSize:'11px', cursor:'pointer' }}>
                    ← Nouvelle campagne
                  </button>
                )}
              </div>

              {/* Output area */}
              <div style={{ flex:1, padding:'16px 20px', overflowY:'auto', display:'flex', flexDirection:'column', gap:'12px' }}
                ref={phase === 'running' ? outputRef : null}>

                {phase === 'running' && preStepStatus === 'active' && (
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px' }}>
                      <div style={{ width:'38px', height:'38px', borderRadius:'50%', display:'flex', alignItems:'center',
                        justifyContent:'center', fontSize:'18px', background:'rgba(13,148,136,0.2)',
                        border:'2px solid #0d948888', flexShrink:0 }}>🔍</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:'14px', fontWeight:'700', color:B.white }}>Debelvoix analyse la présence digitale…</div>
                        <div style={{ fontSize:'10px', color:'#0d9488' }}>brand voice analysis</div>
                      </div>
                      <div style={{ width:'18px', height:'18px', borderRadius:'50%', flexShrink:0,
                        border:'2px solid #0d948822', borderTop:'2px solid #0d9488',
                        animation:'spin 0.8s linear infinite' }}/>
                    </div>
                    <div style={{ background:'rgba(10,0,8,0.5)', border:'1px solid #0d948833',
                      borderRadius:'12px', padding:'16px', fontSize:'12.5px',
                      color:'rgba(250,248,251,0.82)', lineHeight:'1.78', whiteSpace:'pre-wrap',
                      fontFamily:'system-ui,sans-serif', minHeight:'140px' }} ref={preStepRef}>
                      {preStepText || <span style={{opacity:0.25}}>Initialisation…</span>}
                    </div>
                  </div>
                )}

                {phase === 'running' && preStepStatus !== 'active' && activeStepInfo && (
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px' }}>
                      <img src={getAvatarPath(activeStepInfo.id)} alt={activeStepInfo.prenom}
                        style={{ width:'38px', height:'38px', borderRadius:'50%', objectFit:'cover', objectPosition:'top',
                          border:`2px solid ${activeStepInfo.color}88`, flexShrink:0 }}/>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:'14px', fontWeight:'700', color:B.white }}>{activeStepInfo.prenom} génère…</div>
                        <div style={{ fontSize:'10px', color:activeStepInfo.color }}>→ {activeStepInfo.folder}</div>
                      </div>
                      <div style={{ width:'18px', height:'18px', borderRadius:'50%', flexShrink:0,
                        border:`2px solid ${activeStepInfo.color}22`, borderTop:`2px solid ${activeStepInfo.color}`,
                        animation:'spin 0.8s linear infinite' }}/>
                    </div>
                    <div style={{ background:'rgba(10,0,8,0.5)', border:`1px solid ${activeStepInfo.color}33`,
                      borderRadius:'12px', padding:'16px', fontSize:'12.5px',
                      color:'rgba(250,248,251,0.82)', lineHeight:'1.78', whiteSpace:'pre-wrap',
                      fontFamily:'system-ui,sans-serif', minHeight:'180px' }}>
                      {currentStreamText || <span style={{opacity:0.25}}>Initialisation…</span>}
                    </div>
                  </div>
                )}

                {phase === 'done' && (
                  <>
                    {error && (
                      <div style={{ color:'#ff6b6b', fontSize:'12px', padding:'10px 14px',
                        background:'rgba(255,107,107,0.06)', borderRadius:'8px', border:'1px solid rgba(255,107,107,0.18)' }}>
                        ⚠ {error}
                      </div>
                    )}

                    {preStepStatus === 'done' && preStepOutput && (
                      <div style={{ border:'1px solid #0d948833', borderRadius:'12px', overflow:'hidden' }}>
                        <div onClick={() => setPreStepExpanded(!preStepExpanded)}
                          style={{ padding:'12px 16px', display:'flex', alignItems:'center', gap:'10px', cursor:'pointer', background:'rgba(13,148,136,0.08)' }}>
                          <div style={{ width:'30px', height:'30px', borderRadius:'50%', display:'flex', alignItems:'center',
                            justifyContent:'center', fontSize:'14px', background:'rgba(13,148,136,0.2)',
                            border:'1.5px solid #0d948855', flexShrink:0 }}>🔍</div>
                          <div style={{ flex:1 }}>
                            <span style={{ fontSize:'13px', fontWeight:'700', color:B.white }}>Debelvoix</span>
                            <span style={{ fontSize:'10px', color:'#0d9488', marginLeft:'8px' }}>brand analysis</span>
                          </div>
                          <span style={{ fontSize:'9px', color:'#0d9488', opacity:0.7 }}>✓ analyse complète</span>
                          <span style={{ fontSize:'11px', color:'rgba(250,248,251,0.25)', marginLeft:'6px' }}>{preStepExpanded ? '▲' : '▼'}</span>
                        </div>
                        {preStepExpanded && (
                          <div style={{ padding:'0 16px 14px' }}>
                            <div style={{ background:'rgba(10,0,8,0.45)', borderRadius:'10px', padding:'14px',
                              fontSize:'12px', color:'rgba(250,248,251,0.8)', lineHeight:'1.78',
                              whiteSpace:'pre-wrap', maxHeight:'340px', overflowY:'auto', marginBottom:'8px', fontFamily:'system-ui,sans-serif' }}>
                              {preStepOutput}
                            </div>
                            <button onClick={() => { navigator.clipboard.writeText(preStepOutput).then(() => { setCopied('debelvoix'); setTimeout(()=>setCopied(null),2000) }) }}
                              style={{ padding:'7px 14px', background: copied==='debelvoix' ? 'rgba(13,148,136,0.18)' : 'rgba(107,15,110,0.2)',
                                border:`1px solid ${copied==='debelvoix' ? '#0d948877' : '#0d948844'}`, borderRadius:'8px',
                                color: copied==='debelvoix' ? '#5eead4' : B.white, fontSize:'11px', cursor:'pointer' }}>
                              {copied==='debelvoix' ? '✓ Copié' : '📋 Copier'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {effectiveSteps.filter(step => stepStatuses[step.id]?.status === 'done').map(step => {
                      const s = stepStatuses[step.id]
                      const isOpen = expandedStep === step.id
                      const wordCount = s.output ? s.output.trim().split(/\s+/).length : 0
                      return (
                        <div key={step.id} style={{ border:`1px solid ${step.color}33`, borderRadius:'12px', overflow:'hidden' }}>
                          <div onClick={() => setExpandedStep(isOpen ? null : step.id)}
                            style={{ padding:'12px 16px', display:'flex', alignItems:'center', gap:'10px', cursor:'pointer', background:`${step.color}0d` }}>
                            <img src={getAvatarPath(step.id)} alt={step.prenom}
                              style={{ width:'30px', height:'30px', borderRadius:'50%', objectFit:'cover', objectPosition:'top', border:`1.5px solid ${step.color}55`, flexShrink:0 }}/>
                            <div style={{ flex:1 }}>
                              <span style={{ fontSize:'13px', fontWeight:'700', color:B.white }}>{step.prenom}</span>
                              <span style={{ fontSize:'10px', color:step.color, marginLeft:'8px' }}>→ {step.folder}</span>
                            </div>
                            <span style={{ fontSize:'9px', color:B.gold, opacity:0.7 }}>✓ {wordCount} mots</span>
                            <span style={{ fontSize:'11px', color:'rgba(250,248,251,0.25)', marginLeft:'6px' }}>{isOpen ? '▲' : '▼'}</span>
                          </div>
                          {isOpen && (
                            <div style={{ padding:'0 16px 14px' }}>
                              <div style={{ background:'rgba(10,0,8,0.45)', borderRadius:'10px', padding:'14px',
                                fontSize:'12px', color:'rgba(250,248,251,0.8)', lineHeight:'1.78',
                                whiteSpace:'pre-wrap', maxHeight:'340px', overflowY:'auto', marginBottom:'8px', fontFamily:'system-ui,sans-serif' }}>
                                {s.output}
                              </div>
                              <button onClick={() => { navigator.clipboard.writeText(s.output).then(() => { setCopied(step.id); setTimeout(()=>setCopied(null),2000) }) }}
                                style={{ padding:'7px 14px', background: copied===step.id ? `${step.color}18` : 'rgba(107,15,110,0.2)',
                                  border:`1px solid ${step.color}44`, borderRadius:'8px',
                                  color: copied===step.id ? step.color : B.white, fontSize:'11px', cursor:'pointer' }}>
                                {copied===step.id ? '✓ Copié' : '📋 Copier'}
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}

                    {allEffectiveDone && (
                      <div style={{ textAlign:'center', padding:'18px', background:`${B.gold}07`, border:`1px solid ${B.gold}28`, borderRadius:'12px' }}>
                        <div style={{ fontSize:'22px', marginBottom:'6px' }}>✦</div>
                        <div style={{ fontSize:'13px', fontWeight:'700', color:B.goldLight }}>Pipeline complet · Sauvegardé dans l'historique</div>
                        <div style={{ fontSize:'11px', color:'rgba(250,248,251,0.4)', marginTop:'4px', marginBottom:'14px' }}>
                          Clique sur chaque agente pour lire et copier son output
                        </div>
                        <div style={{ display:'flex', gap:'10px', justifyContent:'center', flexWrap:'wrap' }}>
                          <button onClick={handleDownload} style={{ padding:'10px 24px',
                            background:`linear-gradient(135deg,${B.gold}cc,${B.goldLight}88)`,
                            border:`1px solid ${B.gold}88`, borderRadius:'10px',
                            color:B.black, fontSize:'13px', fontWeight:'800', cursor:'pointer' }}>
                            ⬇ Télécharger (.md)
                          </button>
                          <button onClick={handleCopyAll} style={{ padding:'10px 24px',
                            background: copiedAll ? `${B.gold}18` : 'rgba(107,15,110,0.3)',
                            border:`1px solid ${copiedAll ? B.gold : B.border}`, borderRadius:'10px',
                            color: copiedAll ? B.goldLight : B.white, fontSize:'13px', fontWeight:'700', cursor:'pointer' }}>
                            {copiedAll ? '✓ Copié !' : '📋 Copier tout'}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── AgentCard ────────────────────────────────────────────────────────────────

function AgentCard({ agent, onActivate }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}
      style={{ background: hovered ? `linear-gradient(135deg,${agent.color}20,rgba(107,15,110,0.15))` : B.surface,
        border:`1px solid ${hovered ? agent.color+'66' : B.border}`, borderRadius:'16px', padding:'20px',
        cursor:'default', transition:'all 0.25s', position:'relative', overflow:'hidden',
        boxShadow: hovered ? `0 8px 28px ${agent.color}20` : 'none', display:'flex', flexDirection:'column' }}>
      {hovered && <div style={{ position:'absolute', top:0, left:'15%', right:'15%', height:'1px',
        background:`linear-gradient(90deg,transparent,${B.gold},transparent)` }}/>}
      <div style={{ display:'flex', alignItems:'center', gap:'14px', marginBottom:'12px' }}>
        <div style={{ position:'relative', flexShrink:0 }}>
          <img src={getAvatarPath(agent.id)} alt={agent.prenom}
            style={{ width:'68px', height:'68px', borderRadius:'50%', objectFit:'cover', objectPosition:'top center',
              border:`2px solid ${agent.color}66`, boxShadow:`0 0 16px ${agent.color}33` }}/>
          <div style={{ position:'absolute', bottom:0, right:0, width:'20px', height:'20px', background:agent.color,
            borderRadius:'50%', border:`1.5px solid ${B.black}`, display:'flex', alignItems:'center',
            justifyContent:'center', fontSize:'10px' }}>{agent.emoji}</div>
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:'Georgia,serif', fontSize:'17px', fontWeight:'900', color:B.white }}>{agent.prenom}</div>
          <div style={{ fontSize:'10px', color:agent.color, fontWeight:'600', letterSpacing:'0.1em', margin:'1px 0' }}>{agent.title}</div>
          <div style={{ display:'inline-block', padding:'1px 7px', background:`${agent.color}18`,
            border:`1px solid ${agent.color}30`, borderRadius:'10px', fontSize:'8px', color:agent.accent, fontWeight:'600' }}>{agent.model}</div>
        </div>
      </div>
      <p style={{ fontSize:'11.5px', color:'rgba(250,248,251,0.5)', lineHeight:'1.65', margin:'0 0 14px', flex:1 }}>
        {FORMS[agent.id].subtitle}
      </p>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end' }}>
        <button onClick={()=>onActivate(agent)} style={{ padding:'8px 20px',
          background:`linear-gradient(135deg,${agent.color}cc,${B.violetDeep}cc)`,
          border:`1px solid ${agent.color}88`, borderRadius:'20px',
          color:B.white, fontSize:'12px', fontWeight:'700', cursor:'pointer',
          boxShadow: hovered ? `0 4px 14px ${agent.color}44` : 'none', transition:'all 0.2s' }}>
          Activer →
        </button>
      </div>
    </div>
  )
}

// ─── SupportCard ──────────────────────────────────────────────────────────────

function SupportCard({ agent, onActivate }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}
      style={{ background: hovered ? `${agent.color}12` : B.surface,
        border:`1px solid ${hovered ? agent.color+'55' : B.border}`, borderRadius:'14px', padding:'18px',
        cursor:'default', transition:'all 0.22s', display:'flex', flexDirection:'column',
        boxShadow: hovered ? `0 6px 20px ${agent.color}18` : 'none' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'10px' }}>
        <div style={{ width:'46px', height:'46px', borderRadius:'50%', display:'flex', alignItems:'center',
          justifyContent:'center', fontSize:'20px', background:`${agent.color}15`, border:`1.5px solid ${agent.color}44`, flexShrink:0 }}>
          {agent.emoji}
        </div>
        <div>
          <div style={{ fontFamily:'Georgia,serif', fontSize:'15px', fontWeight:'800', color:B.white }}>{agent.name}</div>
          <div style={{ fontSize:'9px', color:agent.color, fontWeight:'600', letterSpacing:'0.1em' }}>AGENT SUPPORT</div>
        </div>
      </div>
      <p style={{ fontSize:'11px', color:'rgba(250,248,251,0.45)', lineHeight:'1.6', margin:'0 0 12px', flex:1 }}>
        {agent.subtitle}
      </p>
      <div style={{ display:'flex', justifyContent:'flex-end' }}>
        <button onClick={()=>onActivate(agent)} style={{ padding:'6px 16px',
          background:`${agent.color}cc`, border:`1px solid ${agent.color}88`,
          borderRadius:'16px', color:B.white, fontSize:'11px', fontWeight:'700', cursor:'pointer' }}>
          Activer →
        </button>
      </div>
    </div>
  )
}

// ─── BBoldCore (main) ─────────────────────────────────────────────────────────

export default function BBoldCore() {
  const [tab, setTab] = useState('agents')
  const [activeAgent, setActiveAgent] = useState(null)
  const [activeSupportAgent, setActiveSupportAgent] = useState(null)
  const [showCampaign, setShowCampaign] = useState(false)
  const [showOrchestrator, setShowOrchestrator] = useState(false)
  const [campaignInitialBrief, setCampaignInitialBrief] = useState(null)
  const [campaignSelectedAgents, setCampaignSelectedAgents] = useState(null)
  const [historyItems, setHistoryItems] = useState([])
  const [viewingHistory, setViewingHistory] = useState(null)

  useEffect(() => { document.title = 'B.BOLD Core — Multi-Agent Platform' }, [])
  useEffect(() => { if (tab === 'historique') setHistoryItems(loadHistory()) }, [tab])

  function refreshHistory() { setHistoryItems(loadHistory()) }

  function handleDeleteHistory(id) {
    deleteFromHistory(id); setHistoryItems(loadHistory())
  }

  function handleOrchestratorLaunch({ brief, selectedAgents }) {
    setCampaignInitialBrief(brief)
    setCampaignSelectedAgents(selectedAgents)
    setShowOrchestrator(false)
    setShowCampaign(true)
  }

  function handleCloseCampaign() {
    setShowCampaign(false)
    setCampaignInitialBrief(null)
    setCampaignSelectedAgents(null)
  }

  return (
    <div style={{ minHeight:'100vh', background:`linear-gradient(160deg,#120010 0%,#0a0008 55%,#0f000e 100%)`,
      color:B.white, fontFamily:'system-ui,sans-serif' }}>
      <style>{`
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:${B.gold}44; border-radius:2px; }
        input::placeholder, textarea::placeholder { color:rgba(250,248,251,0.22); }
        input:focus, textarea:focus, select:focus { border-color:rgba(201,168,76,0.5) !important; }
        button:hover { opacity:0.87; }
        select option { background:#120010; }
        @keyframes bfadein { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes bpulse  { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.3;transform:scale(0.8)} }
        @keyframes spin    { to{transform:rotate(360deg)} }
      `}</style>

      {activeAgent        && <Modal             agent={activeAgent}        onClose={()=>setActiveAgent(null)}/>}
      {activeSupportAgent && <SupportModal       agent={activeSupportAgent} onClose={()=>setActiveSupportAgent(null)}/>}
      {showOrchestrator   && <OrchestratorModal  onClose={()=>setShowOrchestrator(false)} onLaunch={handleOrchestratorLaunch}/>}
      {showCampaign       && <CampaignModal       onClose={handleCloseCampaign} onSaved={refreshHistory}
                               initialBrief={campaignInitialBrief} initialSelectedAgents={campaignSelectedAgents}/>}
      {viewingHistory     && <HistoryModal        campaign={viewingHistory}   onClose={()=>setViewingHistory(null)}/>}

      {/* Header */}
      <header style={{ borderBottom:`1px solid ${B.border}`, padding:'0 28px', height:'68px',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        background:'rgba(10,0,8,0.88)', backdropFilter:'blur(16px)', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <Eye size={36}/>
          <div>
            <div style={{ fontSize:'18px', fontWeight:'900', fontFamily:'Georgia,serif',
              background:`linear-gradient(90deg,${B.white},${B.lilas})`,
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              B.BOLD <span style={{ fontWeight:'300', fontSize:'14px', WebkitTextFillColor:B.gold }}>Core</span>
            </div>
            <div style={{ fontSize:'8px', color:B.gold, letterSpacing:'0.22em', fontWeight:'600' }}>MULTI-AGENT PLATFORM</div>
          </div>
        </div>
        <nav style={{ display:'flex', gap:'4px' }}>
          {[{id:'agents',label:'Agents'},{id:'historique',label:'Historique'},{id:'stack',label:'Stack'}].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
              padding:'7px 16px',
              background: tab===t.id ? `linear-gradient(135deg,${B.magenta}22,${B.violetDeep}22)` : 'transparent',
              border:`1px solid ${tab===t.id ? B.gold+'55' : 'transparent'}`,
              borderRadius:'8px', color: tab===t.id ? B.goldLight : 'rgba(250,248,251,0.4)',
              fontSize:'12px', fontWeight:'600', cursor:'pointer' }}>
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Main */}
      <main style={{ padding:'32px', maxWidth:'1200px', margin:'0 auto' }}>

        {/* ── TAB : AGENTS ── */}
        {tab === 'agents' && (
          <div style={{ animation:'bfadein 0.35s ease' }}>

            {/* Orchestrateur banner */}
            <div style={{ background:`linear-gradient(135deg,rgba(201,168,76,0.1),rgba(107,15,110,0.18))`,
              border:`1px solid ${B.gold}55`, borderRadius:'18px', padding:'22px 28px', marginBottom:'24px',
              display:'flex', alignItems:'center', justifyContent:'space-between', gap:'20px', flexWrap:'wrap' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'20px', flex:1, minWidth:'220px' }}>
                <Eye size={44}/>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'6px', flexWrap:'wrap' }}>
                    <span style={{ fontFamily:'Georgia,serif', fontSize:'20px', fontWeight:'900', color:B.white }}>Orchestrateur</span>
                    <span style={{ padding:'2px 9px', background:`${B.gold}18`, border:`1px solid ${B.gold}50`,
                      borderRadius:'20px', fontSize:'9px', color:B.goldLight, fontWeight:'600', letterSpacing:'0.12em' }}>
                      CLAUDE OPUS
                    </span>
                    <div style={{ display:'flex', alignItems:'center', gap:'5px' }}>
                      <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:B.goldLight,
                        boxShadow:`0 0 8px ${B.gold}`, animation:'bpulse 2s infinite' }}/>
                      <span style={{ fontSize:'9px', color:B.gold, fontWeight:'600' }}>ACTIF</span>
                    </div>
                  </div>
                  <p style={{ fontSize:'12px', color:'rgba(250,248,251,0.55)', lineHeight:'1.65', margin:0 }}>
                    Chef de projet IA. Soumets ton projet, il sélectionne les agents adaptés et déclenche le pipeline sur mesure.
                  </p>
                </div>
              </div>
              <button onClick={() => setShowOrchestrator(true)} style={{
                padding:'12px 28px', flexShrink:0,
                background:`linear-gradient(135deg,${B.gold}cc,${B.goldLight}88)`,
                border:`1px solid ${B.gold}88`, borderRadius:'12px',
                color:B.black, fontSize:'13px', fontWeight:'800', cursor:'pointer',
                boxShadow:`0 4px 20px ${B.gold}33`,
              }}>
                Confier un projet →
              </button>
            </div>

            <div style={{ display:'flex', alignItems:'center', gap:'14px', marginBottom:'14px' }}>
              <div style={{ height:'1px', flex:1, background:`linear-gradient(90deg,transparent,${B.gold}55)` }}/>
              <span style={{ fontSize:'9px', color:B.gold, fontWeight:'600', letterSpacing:'0.2em' }}>LES 5 AGENTES</span>
              <div style={{ height:'1px', flex:1, background:`linear-gradient(90deg,${B.gold}55,transparent)` }}/>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(210px,1fr))', gap:'12px', marginBottom:'28px' }}>
              {AGENTS.map(agent => <AgentCard key={agent.id} agent={agent} onActivate={setActiveAgent}/>)}
            </div>

            <div style={{ background:`linear-gradient(135deg,rgba(192,0,192,0.12),rgba(107,15,110,0.18))`,
              border:`1px solid ${B.magenta}44`, borderRadius:'18px', padding:'22px 28px', marginBottom:'28px',
              display:'flex', alignItems:'center', justifyContent:'space-between', gap:'20px', flexWrap:'wrap' }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'6px' }}>
                  <span style={{ fontSize:'20px' }}>🚀</span>
                  <span style={{ fontFamily:'Georgia,serif', fontSize:'17px', fontWeight:'800', color:B.white }}>Campagne Complète</span>
                  <span style={{ padding:'2px 8px', background:`${B.magenta}18`, border:`1px solid ${B.magenta}44`,
                    borderRadius:'20px', fontSize:'8px', color:B.lilas, fontWeight:'600' }}>PIPELINE 5 AGENTS</span>
                </div>
                <p style={{ fontSize:'12px', color:'rgba(250,248,251,0.5)', margin:0 }}>
                  Un brief → 5 agents en séquence → 5 livrables · Analyse brand voice optionnelle via Debelvoix
                </p>
              </div>
              <button onClick={() => { setCampaignInitialBrief(null); setCampaignSelectedAgents(null); setShowCampaign(true) }} style={{
                padding:'12px 28px', flexShrink:0,
                background:`linear-gradient(135deg,${B.magenta},${B.violetDeep})`,
                border:`1px solid ${B.magenta}88`, borderRadius:'12px',
                color:B.white, fontSize:'13px', fontWeight:'800', cursor:'pointer',
                boxShadow:`0 4px 20px ${B.magenta}33`,
              }}>
                Lancer →
              </button>
            </div>

            <div style={{ display:'flex', alignItems:'center', gap:'14px', marginBottom:'14px' }}>
              <div style={{ height:'1px', flex:1, background:`linear-gradient(90deg,transparent,rgba(250,248,251,0.15))` }}/>
              <span style={{ fontSize:'9px', color:'rgba(250,248,251,0.4)', fontWeight:'600', letterSpacing:'0.2em' }}>AGENTS SUPPORT</span>
              <div style={{ height:'1px', flex:1, background:`linear-gradient(90deg,rgba(250,248,251,0.15),transparent)` }}/>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:'12px' }}>
              {SUPPORT_AGENTS.map(agent => <SupportCard key={agent.id} agent={agent} onActivate={setActiveSupportAgent}/>)}
            </div>
          </div>
        )}

        {/* ── TAB : HISTORIQUE ── */}
        {tab === 'historique' && (
          <div style={{ animation:'bfadein 0.35s ease' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'24px' }}>
              <div>
                <h2 style={{ fontFamily:'Georgia,serif', fontSize:'22px', fontWeight:'900', color:B.white, marginBottom:'4px' }}>
                  Historique des campagnes
                </h2>
                <p style={{ fontSize:'12px', color:'rgba(250,248,251,0.4)' }}>
                  {historyItems.length === 0 ? 'Aucune campagne sauvegardée.' : `${historyItems.length} campagne${historyItems.length > 1 ? 's' : ''} — 20 max`}
                </p>
              </div>
              {historyItems.length > 0 && (
                <button onClick={() => { localStorage.removeItem(HISTORY_KEY); setHistoryItems([]) }}
                  style={{ padding:'7px 14px', background:'rgba(255,107,107,0.08)',
                    border:'1px solid rgba(255,107,107,0.22)', borderRadius:'8px',
                    color:'rgba(255,107,107,0.7)', fontSize:'11px', cursor:'pointer' }}>
                  Tout effacer
                </button>
              )}
            </div>
            {historyItems.length === 0 && (
              <div style={{ textAlign:'center', padding:'60px 0', color:'rgba(250,248,251,0.2)', fontSize:'14px' }}>
                <div style={{ fontSize:'36px', marginBottom:'12px' }}>📭</div>
                Lance une campagne complète pour la voir apparaître ici.
              </div>
            )}
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              {historyItems.map(item => (
                <div key={item.id} style={{ background:B.surface, border:`1px solid ${B.border}`,
                  borderRadius:'14px', padding:'16px 20px', display:'flex', alignItems:'center', gap:'16px', flexWrap:'wrap' }}>
                  <div style={{ flex:1, minWidth:'200px' }}>
                    <div style={{ fontFamily:'Georgia,serif', fontSize:'16px', fontWeight:'800', color:B.white, marginBottom:'3px' }}>
                      {item.client}
                    </div>
                    <div style={{ fontSize:'11px', color:'rgba(250,248,251,0.4)' }}>
                      {item.date}
                      {item.objectif   && <span style={{ marginLeft:'10px', color:B.gold }}>{item.objectif}</span>}
                      {item.plateformes && <span style={{ marginLeft:'10px', color:'rgba(250,248,251,0.3)' }}>{item.plateformes}</span>}
                      {item.secteur    && <span style={{ marginLeft:'10px', color:'rgba(250,248,251,0.25)' }}>{item.secteur}</span>}
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:'8px', flexShrink:0 }}>
                    <div style={{ display:'flex', gap:'4px', alignItems:'center' }}>
                      {PIPELINE_STEPS.map(step => (
                        <div key={step.id} title={step.prenom}
                          style={{ width:'22px', height:'22px', borderRadius:'50%', overflow:'hidden',
                            border:`1.5px solid ${item.outputs[step.id] ? step.color+'88' : 'rgba(250,248,251,0.1)'}`,
                            opacity: item.outputs[step.id] ? 1 : 0.25 }}>
                          <img src={getAvatarPath(step.id)} alt={step.prenom}
                            style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'top' }}/>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => setViewingHistory(item)} style={{ padding:'7px 16px',
                      background:`linear-gradient(135deg,${B.magenta}cc,${B.violetDeep}cc)`,
                      border:`1px solid ${B.magenta}66`, borderRadius:'8px',
                      color:B.white, fontSize:'12px', fontWeight:'700', cursor:'pointer' }}>
                      Voir →
                    </button>
                    <button onClick={() => handleDeleteHistory(item.id)} style={{ padding:'7px 10px',
                      background:'transparent', border:'1px solid rgba(255,107,107,0.2)', borderRadius:'8px',
                      color:'rgba(255,107,107,0.5)', fontSize:'12px', cursor:'pointer' }}>
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB : STACK ── */}
        {tab === 'stack' && (
          <div style={{ animation:'bfadein 0.35s ease' }}>
            <h2 style={{ fontFamily:'Georgia,serif', fontSize:'26px', fontWeight:'900', margin:'0 0 8px', color:B.white }}>
              Stack <code style={{ fontFamily:'monospace', fontSize:'18px', color:B.gold, background:`${B.gold}10`, padding:'2px 9px', borderRadius:'5px' }}>naïom-platform</code>
            </h2>
            <p style={{ fontSize:'13px', color:'rgba(250,248,251,0.45)', margin:'0 0 24px' }}>
              13 agents · 3 API routes · streaming NDJSON · pipeline orchestré · Debelvoix pre-step · historique localStorage
            </p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:'12px' }}>
              {[
                { n:'Next.js 14',               r:'Framework · App Router · React 18 · deploy Vercel' },
                { n:'Anthropic SDK',             r:'claude-opus-4-5 (Orchestrateur, Stratège, Analyste, Debelvoix) · claude-sonnet-4-5 (Lola, Zara, Naïa, Gmail, Repurpose, CV)' },
                { n:'API Routes',               r:'/api/brief · /api/orchestrate · /api/agents/support — clé serveur sécurisée' },
                { n:'Orchestrateur intelligent', r:'Analyse le projet, sélectionne les agents, déclenche le pipeline sur mesure — JSON structured output' },
                { n:'Pipeline orchestré',        r:'Séquentiel NDJSON — pré-step Debelvoix (brand analysis) — contexte passé de step en step' },
                { n:'Agents support (×6)',        r:'Gmail · Fireflies · Content Vault · Debelvoix · Repurpose · Calendrier Éditorial' },
                { n:'Historique localStorage',   r:'Sauvegarde auto après chaque pipeline · 20 campagnes max · viewer intégré · export .md' },
              ].map((s,i)=>(
                <div key={i} style={{ background:B.surface, border:`1px solid ${B.border}`, borderRadius:'12px', padding:'16px 18px' }}>
                  <div style={{ fontSize:'13px', fontWeight:'700', color:B.goldLight, marginBottom:'5px' }}>{s.n}</div>
                  <div style={{ fontSize:'11.5px', color:'rgba(250,248,251,0.42)', lineHeight:'1.55' }}>{s.r}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
