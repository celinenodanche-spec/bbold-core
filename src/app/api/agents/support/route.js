import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

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
    system: `Tu es l'Agent Repurpose de B.BOLD Agency. Tu prends un contenu validé et le déclinesparfaitement sur chaque plateforme dans son format natif. Chaque version est distincte — pas de copier-coller. Tu respectes les contraintes de caractères, les codes de chaque réseau et le ton de marque. Hook différent pour chaque plateforme.`,
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
}

export async function POST(request) {
  const { agentId, ...data } = await request.json()
  const agent = AGENTS[agentId]

  if (!agent) {
    return new Response(JSON.stringify({ error: `Agent inconnu : ${agentId}` }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

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
