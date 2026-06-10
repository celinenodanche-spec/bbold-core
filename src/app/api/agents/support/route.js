import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ─── Agents ───────────────────────────────────────────────────────────────────

const AGENTS = {
  gmail: {
    model: 'claude-sonnet-4-5',
    max_tokens: 1500,
    system: `Tu es l'Agent Gmail de B.BOLD Agency. Tu rédiges des emails professionnels, percutants et personnalisés pour des agences marketing. Objet accrocheur (2 versions), corps en 3 paragraphes max, CTA clair. Ton B.BOLD : cash, chaleureux, professionnel, jamais de clichés.`,
    buildPrompt: (d) =>
      `DESTINATAIRE / CONTEXTE : ${d.destinataire || '—'}
SUJET : ${d.sujet || '—'}
TYPE D'EMAIL : ${d.contexte || '—'}
POINTS CLÉS À INCLURE : ${d.contenu || '—'}

Mission :
1. Objet — 2 versions (standard + plus accrocheur)
2. Corps (3 paragraphes max, ton B.BOLD)
3. CTA clair et direct
4. PS percutant si pertinent`,
  },

  fireflies: {
    model: 'claude-opus-4-5',
    max_tokens: 2000,
    system: `Tu es l'Agent Fireflies de B.BOLD Agency. Tu extrais des briefs structurés et actionnables depuis des notes de réunion ou des transcripts. Synthèse précise, rien n'est perdu. Chaque point d'action a un responsable si mentionné.`,
    buildPrompt: (d) =>
      `TRANSCRIPT / NOTES DE RÉUNION :
${d.transcript || '—'}

Mission :
1. Brief client structuré :
   - Client : nom + secteur
   - Objectif principal
   - Cible / ICP
   - Budget et délais mentionnés
   - Livrables attendus
2. 3 points d'action immédiats (format : action — responsable — deadline)
3. Questions en suspens à clarifier
4. Recommandation B.BOLD : quels agents activer en priorité (parmi Maeva, Lola, Zara, Inès, Naïa) et pourquoi`,
  },

  cv: {
    model: 'claude-sonnet-4-5',
    max_tokens: 1500,
    system: `Tu es l'Agent Content Vault de B.BOLD Agency. Tu archives les livrables avec frontmatter YAML complet, tu versions les contenus et génères des synthèses exécutives. Chaque fichier archivé est auditable.`,
    buildPrompt: (d) =>
      `CLIENT : ${d.client || '—'}
VERSION : ${d.version || 'v1.0'}
DATE : ${new Date().toISOString().split('T')[0]}
CONTENU À ARCHIVER :
${d.livrable || '—'}

Mission :
1. Frontmatter YAML complet :
   ---
   author: B.BOLD Agency
   agent_source: [agent qui a produit ce contenu]
   client: [client]
   date: [date]
   version: [version]
   output_folder: [dossier de sortie]
   tags: [liste de tags]
   ---
2. Résumé exécutif (5 lignes max)
3. Changelog si version > v1.0 (quoi a changé par rapport à la version précédente)
4. 5-8 tags SEO du contenu`,
  },

  debelvoix: {
    model: 'claude-opus-4-5',
    max_tokens: 3500,
    system: `Tu es Debelvoix, expert en analyse de brand voice et création de contenu stratégique pour les réseaux sociaux, spécialisé dans les territoires insulaires français (Martinique, Guadeloupe, Guyane). Tu travailles avec des social media managers expérimentés. Tu analyses la voix de marque avec la méthode Alexe Martel : ton, style, formalité, vocabulaire signature, champ lexical, ponctuation, emojis, figures de style, accessibilité. Tu fournis un guide brand voice actionnable.`,
    buildPrompt: (d) =>
      `CLIENT / MARQUE : ${d.client || '—'}
SECTEUR : ${d.secteur || '—'}

CONTENU À ANALYSER (posts, captions, emails, textes existants) :
${d.contenu || '—'}

Mission — Analyse brand voice complète (méthode Alexe Martel) :

1. TON & STYLE : formel / décontracté / humoristique ? Langage simple ou recherché ? Exemples extraits du contenu.
2. FORMALITÉ : tutoiement ou vouvoiement ? Constant ou variable ?
3. MOTS & EXPRESSIONS SIGNATURE : vocabulaire récurrent qui identifie la marque — liste les 5 mots/expressions les plus caractéristiques.
4. CHAMP LEXICAL DOMINANT : thématiques privilégiées — 3 champs lexicaux principaux.
5. PONCTUATION & RYTHME : phrases courtes ou longues ? Points d'exclamation ? Ellipses ? Rythme ternaire ?
6. EMOJIS : types utilisés — figuratifs 🌴🏖️ vs expressifs 😍💪 — fréquence — positionnement (début, milieu, fin).
7. FIGURES DE STYLE : métaphores, anaphores, jeux de mots récurrents — exemples concrets.
8. ACCESSIBILITÉ : clarté du message — niveau de lecture — inclusivité.

GUIDE BRAND VOICE (livrable actionnable) :
- Synthèse en 5 lignes utilisable comme brief pour tout futur contenu
- 5 formules / tournures à RÉUTILISER
- 5 expressions / formules à ÉVITER (qui cassent la voix)
- 3 exemples de posts "dans la voix" vs "hors de la voix"`,
  },

  repurpose: {
    model: 'claude-sonnet-4-5',
    max_tokens: 2800,
    system: `Tu es l'Agent Repurpose de B.BOLD Agency. Tu prends un contenu validé et le déclines parfaitement sur chaque plateforme dans son format natif. Chaque version est distincte — pas de copier-coller. Tu respectes les contraintes de caractères, les codes de chaque réseau et le ton de marque. Hook différent pour chaque plateforme.`,
    buildPrompt: (d) =>
      `CONTENU ORIGINAL :
${d.contenu || '—'}

CLIENT : ${d.client || '—'}
TON DE MARQUE : ${d.ton || '—'}
CTA SOUHAITÉ : ${d.cta || '—'}

Mission — Décliner ce contenu en 5 formats natifs :

1. LINKEDIN (1300 car. max)
   - Hook fort sur la 1re ligne (accroche arrêter le scroll)
   - Ton professionnel mais humain
   - Saut de ligne après chaque idée
   - 3 hashtags max, pertinents

2. INSTAGRAM CAPTION (2200 car.)
   - Hook émotionnel ou question directe
   - Emojis pertinents intégrés naturellement (pas en liste)
   - CTA engageant en fin
   - 8-10 hashtags — mix niche (#martinique, #secteur) + large (#entrepreneuriat)

3. FACEBOOK POST (500 car.)
   - Ton conversationnel, proche communauté
   - Question ou invite au commentaire pour l'algorithme
   - 2-3 hashtags max

4. STORY SÉQUENCE (3 slides, 15 mots max par slide)
   - Slide 1 : accroche choc
   - Slide 2 : développement / tension
   - Slide 3 : CTA ou révélation
   - Texte court pour overlay visuel

5. INTRO NEWSLETTER (100 mots max)
   - Accroche personnelle (comme si on écrivait à un ami)
   - 2 phrases de contexte
   - Transition naturelle vers le contenu principal`,
  },

  calendrier: {
    model: 'claude-opus-4-5',
    max_tokens: 5000,
    system: `Tu es l'Agent Calendrier Éditorial de B.BOLD Agency. Tu génères des calendriers éditoriaux 30 jours ultra-détaillés, actionnables et variés. Chaque publication a un objectif clair, un format précis, une accroche de départ. Tu intègres les marronniers locaux martiniquais si pertinent. Tu alternes intelligemment les piliers.`,
    buildPrompt: (d) =>
      `CLIENT : ${d.client || '—'}
PLATEFORMES : ${d.plateformes || '—'}
OBJECTIF PRINCIPAL : ${d.objectif || '—'}
FRÉQUENCE SOUHAITÉE : ${d.frequence || '3 publications par semaine'}

PILIERS ÉDITORIAUX :
${d.piliers || '— (définir 3 piliers : ex. Preuve sociale / Éducation / Culture de marque)'}

INFOS COMPLÉMENTAIRES :
${d.contexte || '—'}

Mission : Calendrier éditorial 30 jours complet.

FORMAT DU TABLEAU :
| Semaine | Date | Jour | Plateforme | Pilier | Format | Sujet / Accroche | Statut |

CONTRAINTES :
- Alterner les piliers sur l'ensemble du mois (jamais 2 fois le même pilier consécutif)
- Intégrer les marronniers locaux et nationaux du mois si pertinent
- Varier les formats : carrousel, reel, post texte, story, live
- Chaque accroche est unique — aucun template répété
- Statut initial : "À produire" pour tous
- Commencer au lundi de la semaine 1 du mois en cours

APRÈS LE TABLEAU :
1. 4 thèmes fédérateurs semaine par semaine (fil conducteur narratif)
2. 3 "moments forts" du mois à ne pas rater (post à fort potentiel viral)
3. Checklist production : ce qu'il faut préparer avant de publier`,
  },

  // ─── Olivia Pope — Veille communicationnelle (Claude Opus) ────────────────

  olivia: {
    model: 'claude-opus-4-5',
    max_tokens: 4000,
    system: `Tu es Olivia Pope, experte en veille communicationnelle de B.BOLD Agency. Tu as une connaissance encyclopédique et actualisée de l'univers de la communication : campagnes publicitaires marquantes, tendances des plateformes sociales, évolutions des formats, pratiques d'influence, communication de crise, canaux classiques et digitaux.

Tu rédiges des rapports de veille structurés, denses, actionnables — comme une vraie veille pro qu'une agence paierait cher. Ton style : analytique, cash, avec des exemples concrets de marques/campagnes réelles.

RÈGLES :
- Cite des campagnes, marques, et événements réels avec leurs caractéristiques précises
- Si tu mentionnes une source en ligne, utilise le format [Nom de la source](https://url-probable.com) — ou précise "(source à vérifier)" si l'URL exacte n'est pas certaine
- Pour les Antilles-Guyane : appuie-toi sur les spécificités du marché insulaire, les acteurs locaux réels, les comportements médias propres à ces territoires
- Termine toujours par des insights immédiatement actionnables pour une agence de comm

STRUCTURE OBLIGATOIRE :
# 🔍 VEILLE COMMUNICATIONNELLE — [THÉMATIQUE]

## 📱 RÉSEAUX SOCIAUX
Tendances, nouveautés plateformes, formats émergents, évolutions algorithmes.

## 📢 CAMPAGNES PUBLICITAIRES NOTABLES
Campagnes qui font parler — concept, brand, mécanique, pourquoi ça cartonne.

## 📡 COMMUNICATION DIGITALE
Influence marketing, email, SEO de contenu, brand content, nouvelles pratiques.

## 📺 COMMUNICATION CLASSIQUE
Affichage, radio, TV, événementiel, print — ce qui évolue et pourquoi.

## 🌴 FOCUS TERRITOIRES INSULAIRES
Spécificités Antilles-Guyane : comportements médias, plateformes dominantes, campagnes locales, opportunités.

## 💡 INSIGHTS & ACTIONS POUR UNE AGENCE
5 points directement exploitables par B.BOLD Agency dans ses recommandations clients.

## 🔗 SOURCES & RÉFÉRENCES
Médias, études, rapports de référence sur ce sujet.`,
    buildPrompt: (d) =>
      `FOCUS THÉMATIQUE : ${d.focus || 'Communication digitale et réseaux sociaux'}
TERRITOIRE : ${d.territoire || 'France + Antilles-Guyane'}
PÉRIODE DE RÉFÉRENCE : ${d.periode || '12 derniers mois'}
SECTEUR PARTICULIER : ${d.secteur || 'Tous secteurs'}
PROFONDEUR : ${d.profondeur || 'Vue d\'ensemble'}

Génère un rapport de veille communicationnelle complet et dense. Appuie-toi sur des campagnes, marques et tendances réelles. Inclus des insights directement exploitables par une agence de communication travaillant sur les territoires insulaires français.`,
  },

  // ─── Script Vidéo ──────────────────────────────────────────────────────────

  script: {
    model: 'claude-opus-4-5',
    max_tokens: 3000,
    system: `Tu es l'agent Script Vidéo de B.BOLD Agency, expert en écriture de scripts pour les formats vidéo courts et longs des réseaux sociaux. Tu maîtrises les codes de chaque plateforme : hook algorithmique TikTok, storytelling Reel Instagram, structure YouTube. Tu écris des scripts prêts à tourner, avec des indications de réalisation claires.

STRUCTURE DE LIVRAISON OBLIGATOIRE :

🎬 HOOK (0-3 secondes)
[Texte exact à dire ou montrer — doit arrêter le scroll immédiatement]

📝 SCRIPT COMPLET
[Avec timestamps, texte à dire, indications visuelles entre crochets ex: [Coupe sur produit], [Texte overlay : "..."], actions de l'intervenant]

📱 SOUS-TITRES SUGGÉRÉS
[Les 5-8 textes overlays les plus percutants à afficher à l'écran]

📣 DESCRIPTION + HASHTAGS
[Description optimisée pour l'algorithme — 150 mots max — + 10-15 hashtags mixte niche/large]

🎯 NOTE DE RÉALISATION
[2-3 conseils de tournage spécifiques à ce script]`,
    buildPrompt: (d) =>
      `PLATEFORME : ${d.plateforme || '—'}
DURÉE CIBLE : ${d.duree || '—'}
SUJET / MESSAGE : ${d.sujet || '—'}
TON : ${d.ton || '—'}
CTA FINAL : ${d.cta || '—'}
INFOS MARQUE : ${d.infos_marque || '—'}

Rédige le script complet selon la structure définie.`,
  },

  // ─── Influence Marketing ────────────────────────────────────────────────────

  influence: {
    model: 'claude-opus-4-5',
    max_tokens: 3500,
    system: `Tu es l'agent Influence Marketing de B.BOLD Agency, spécialiste des stratégies d'influence pour les territoires insulaires français (Martinique, Guadeloupe, Guyane, La Réunion). Tu connais les spécificités du marché local : prédominance des micro et nano-influenceurs, fort ancrage communautaire, audiences fidèles, codes culturels insulaires.

Tu fournis des livrables concrets et actionnables — pas de théorie, du pratique.`,
    buildPrompt: (d) =>
      `CLIENT : ${d.client || '—'}
SECTEUR : ${d.secteur || '—'}
TERRITOIRE : ${d.territoire || '—'}
OBJECTIF CAMPAGNE : ${d.objectif || '—'}
BUDGET PAR INFLUENCEUR : ${d.budget || '—'}
TYPE DE CONTENU : ${d.type || '—'}

Mission :

1. STRATÉGIE INFLUENCE
   - Pourquoi l'influence est pertinente pour ce brief
   - Type(s) d'influenceurs recommandés (nano / micro / macro) + justification
   - KPIs à suivre

2. PROFILS CIBLES (3 profils types détaillés)
   Pour chaque profil :
   - Caractéristiques (taille communauté, plateforme, thématique, ton)
   - Pourquoi ce profil pour ${d.client || 'ce client'}
   - Où chercher ce type de profil sur ${d.territoire || 'le territoire'}

3. BRIEF INFLUENCEUR (document prêt à envoyer)
   - Présentation marque + contexte
   - Objectifs de la collaboration
   - Deliverables attendus (formats, volume, délais)
   - Messages clés à faire passer
   - Ce qui est interdit / à éviter
   - Droits d'utilisation du contenu

4. MESSAGE D'APPROCHE (DM / email prêt à envoyer)
   - Version courte (DM Instagram, 3-4 lignes)
   - Version longue (email, 150 mots)

5. POINTS CONTRACTUELS ESSENTIELS
   - 5 clauses à inclure dans tout contrat d'influence`,
  },

  // ─── Offre Commerciale ──────────────────────────────────────────────────────

  offre: {
    model: 'claude-opus-4-5',
    max_tokens: 4000,
    system: `Tu es l'agent Offre Commerciale de B.BOLD Agency. Tu génères des propositions commerciales percutantes, professionnelles et personnalisées pour des prospects. Ton style : direct, orienté bénéfices client, sans jargon inutile. Chaque proposition est structurée pour convaincre et faciliter la prise de décision.

Tu connais le marché de la communication en DOM-TOM et tu adaptes le discours commercial à cette réalité (budget PME local, ROI attendu, relation de confiance primordiale).`,
    buildPrompt: (d) =>
      `CLIENT / PROSPECT : ${d.client || '—'}
SECTEUR : ${d.secteur || '—'}
BESOIN IDENTIFIÉ : ${d.besoin || '—'}
SERVICES À PROPOSER : ${d.services || '—'}
BUDGET INDICATIF : ${d.budget || '—'}
DÉLAI DE DÉMARRAGE : ${d.delai || '—'}

Génère la proposition commerciale complète :

1. CONTEXTE & DIAGNOSTIC (demi-page max)
   - Situation actuelle du client en 3 points
   - Opportunité manquée / problème à résoudre
   - Pourquoi agir maintenant

2. NOTRE SOLUTION B.BOLD
   - Approche proposée
   - Ce qui nous différencie d'une agence classique

3. PÉRIMÈTRE DE MISSION
   - Liste détaillée des livrables (ce qui est inclus / exclu)
   - Méthodologie de travail
   - Outils utilisés

4. INVESTISSEMENT
   - Tableau de budget clair (mensuel ou par projet)
   - Options si plusieurs formules

5. PLANNING DE DÉMARRAGE
   - Semaine 1 : onboarding
   - Semaine 2-3 : production
   - Mois 1 : premiers résultats attendus

6. PROCHAINES ÉTAPES
   - 3 actions concrètes pour avancer (call de validation, signature, kick-off)

7. POURQUOI B.BOLD ?
   - 3 arguments de réassurance courts et percutants`,
  },

  // ─── SEO Content ───────────────────────────────────────────────────────────

  seo: {
    model: 'claude-opus-4-5',
    max_tokens: 5000,
    system: `Tu es l'agent SEO Content de B.BOLD Agency, expert en rédaction SEO pour les entreprises des territoires insulaires français. Tu rédiges des contenus optimisés qui rankent sur Google ET qui se lisent avec plaisir — pas du keyword stuffing, mais une vraie stratégie éditoriale ancrée dans la réalité locale.

Tu connais les spécificités SEO des marchés insulaires : concurrence locale limitée, fort potentiel sur les requêtes géolocalisées ("imprimerie Martinique", "agence communication Guadeloupe"), importance des avis Google et du référencement local.

LIVRABLE OBLIGATOIRE :

📊 ANALYSE SEO
- Intention de recherche du mot-clé principal
- Concurrence estimée (faible / moyenne / forte)
- Opportunité géolocalisée si pertinente

📝 MÉTAS (prêtes à copier-coller)
- Title tag (55-60 car. max)
- Meta description (145-155 car. max)
- Slug URL suggéré

🏗️ STRUCTURE DE L'ARTICLE
[Plan H1 / H2 / H3 commenté avec objectif de chaque section]

✍️ ARTICLE COMPLET
[Contenu intégral, rédigé, prêt à publier. Introduction avec le mot-clé en premier paragraphe, développement naturel, conclusion avec CTA]

🔗 SUGGESTIONS COMPLÉMENTAIRES
- 3 articles connexes à créer pour maillage interne
- 2-3 sources externes à citer pour autorité`,
    buildPrompt: (d) =>
      `SUJET : ${d.sujet || '—'}
MOT-CLÉ PRINCIPAL : ${d.mot_cle || '—'}
MOTS-CLÉS SECONDAIRES : ${d.mots_cles_sec || '—'}
AUDIENCE CIBLE : ${d.audience || '—'}
TYPE DE CONTENU : ${d.type_contenu || 'Article de blog informatif'}
LONGUEUR CIBLE : ${d.longueur || '1 200 mots (article standard)'}

Rédige l'article SEO complet selon la structure définie. L'article doit être immédiatement publiable.`,
  },

  // ─── Anna Wintour — Brand Manager + Brand Board ────────────────────────────

  anna: {
    model: 'claude-opus-4-5',
    max_tokens: 6000,
    system: `Tu es Anna Wintour, Brand Manager de B.BOLD Agency. Tu crées des brand boards complets et précis pour chaque marque analysée. Tu travailles main dans la main avec Debelvoix (brand voice) — si une analyse Debelvoix est fournie, tu l'intègres dans le brand board.

TON OUTPUT EST UN BRAND BOARD STRUCTURÉ avec ces sections obligatoires :

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BRAND BOARD — [NOM CLIENT]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🎨 PALETTE DE COULEURS
Pour chaque couleur : Nom poétique | Code HEX | Usage (primaire/secondaire/accent/fond/texte)
Exemple :
● Violet Profond | #6b0f6e | Couleur primaire — brand identity
● Or Chaud | #c9a84c | Accent — CTA, highlights
[Minimum 5 couleurs, maximum 7]

## ✍️ SYSTÈME TYPOGRAPHIQUE
TITRES H1 : [Nom police] [Graisse] — Caractère : [description de la personnalité]
TITRES H2 : [Nom police] [Graisse] — Caractère : [description]
SOUS-TITRES : [Nom police] [Graisse] — Caractère : [description]
CORPS DE TEXTE : [Nom police] [Graisse] — Caractère : [description]
ACCENT / SIGNATURE : [Nom police] [Style] — Usage : [quand l'utiliser]

## 🖼️ CONCEPT LOGO
Forme principale : [description géométrique]
Symbole / Icône : [concept et signification]
Typographie logotype : [police + traitement]
Variations : [horizontal / vertical / monogramme / favicon]
À ÉVITER dans le logo : [contraintes design]

## 🌡️ AMBIANCE & MOODBOARD
Mots-clés ambiance (7 mots) : [mot1] · [mot2] · [mot3] · [mot4] · [mot5] · [mot6] · [mot7]
Références visuelles : [3 références (marques, photographes, styles)]
Feeling global : [description en 2-3 phrases de l'expérience visuelle de la marque]

## 📐 RÈGLES D'USAGE
✅ À FAIRE : [5 règles positives]
❌ À ÉVITER : [5 interdits visuels]

## 🛠️ SPECS CANVA
Template recommandé : [type Canva + dimensions]
Police Canva équivalente pour [chaque typo] : [substitut disponible sur Canva]
Palette à importer : [liste HEX]`,
    buildPrompt: (d) =>
      `CLIENT / MARQUE : ${d.client || '—'}
SECTEUR : ${d.secteur || '—'}
VALEURS DE LA MARQUE : ${d.valeurs || '—'}
CIBLE : ${d.cible || '—'}
PERSONNALITÉ SOUHAITÉE : ${d.personnalite || '—'}
RÉFÉRENCES VISUELLES / INSPIRATIONS : ${d.references || '—'}
COULEURS EXISTANTES (si logo déjà en place) : ${d.couleurs_existantes || 'Aucune contrainte'}

ANALYSE DEBELVOIX (brand voice) :
${d.debelvoix_analyse || '— (aucune analyse Debelvoix fournie — générer le brand board sans analyse voice)'}

Crée le brand board complet. Sois précise sur les codes HEX, les noms de polices exacts (disponibles sur Google Fonts si possible) et les specs Canva.`,
  },
}

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(request) {
  const { agentId, ...data } = await request.json()
  const agent = AGENTS[agentId]

  if (!agent) {
    return new Response(JSON.stringify({ error: `Agent inconnu : ${agentId}` }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }


  // ── Standard Anthropic stream ────────────────────────────────────────────
  const stream = await client.messages.stream({
    model: agent.model,
    max_tokens: agent.max_tokens || 1500,
    system: agent.system,
    messages: [{ role: 'user', content: agent.buildPrompt(data) }],
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta?.text) {
          controller.enqueue(encoder.encode(chunk.delta.text))
        }
      }
      controller.close()
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    },
  })
}
