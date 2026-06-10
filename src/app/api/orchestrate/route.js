import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Pipeline séquentiel — chaque step passe son output au suivant via context
const PIPELINE = [
  {
    id: 'stratege', prenom: 'Maeva', emoji: '🎯',
    model: 'claude-opus-4-5',
    max_tokens: 4000,
    folder: 'briefs/',
    system: `Tu es Maeva, Stratège & Brief de B.BOLD Agency, experte en brand strategy pour les territoires insulaires français (Martinique, Guadeloupe, Guyane). Style : cash, structuré, bullet points pour les insights. Sois précise et directe.`,
    buildPrompt: (b, _ctx) =>
      `CLIENT : ${b.client || '—'}
SECTEUR : ${b.secteur || '—'}
OBJECTIF : ${b.objectif || '—'}
CIBLE / ICP : ${b.cible || '—'}
BUDGET : ${b.budget || '—'}
PLATEFORMES : ${b.plateformes || '—'}
TON DE MARQUE : ${b.ton || '—'}

Mission :
1. 3 insights clés sur ce marché local (data + observation terrain)
2. ICP détaillé (profil, douleurs profondes, aspirations, déclencheurs d'achat)
3. Positionnement différenciant en 1 phrase percutante
4. Value Proposition Canvas (6 blocs : jobs, pains, gains, products, pain relievers, gain creators)
5. 3 piliers éditoriaux avec 3 sujets de post par pilier`,
    outputKey: 'strategie',
  },
  {
    id: 'createur', prenom: 'Lola', emoji: '✍️',
    model: 'claude-sonnet-4-5',
    max_tokens: 2800,
    folder: 'content/',
    system: `Tu es Lola, Créatrice de Contenu de B.BOLD Agency. Hook = 15 mots max. Jamais de listes à puces dans le corps des posts. Prose fluide, 3 paragraphes max. Style authentique et territorial si pertinent. Pas de clichés.`,
    buildPrompt: (b, ctx) =>
      `STRATÉGIE DE MAEVA :
${ctx.strategie || ''}

CLIENT : ${b.client || '—'} | PLATEFORMES : ${b.plateformes || '—'} | TON : ${b.ton || '—'}

Mission :
1. 3 posts (hooks différents — 1 provocateur, 1 émotionnel, 1 éducatif)
2. 1 intro newsletter courte (150 mots max)
3. 5-8 hashtags optimisés par post (mix large + niche)`,
    outputKey: 'contenu',
  },
  {
    id: 'designer', prenom: 'Zara', emoji: '🎨',
    model: 'claude-sonnet-4-5',
    max_tokens: 2800,
    folder: 'prompts-images/',
    system: `Tu es Zara, Designer de B.BOLD Agency, experte en direction artistique et prompts génératifs (Midjourney v6, Flux, DALL-E 3). Fournis des prompts techniques précis avec tous les paramètres.`,
    buildPrompt: (b, ctx) =>
      `CONTENU CRÉÉ PAR LOLA :
${ctx.contenu || ''}

CLIENT : ${b.client || '—'} | SECTEUR : ${b.secteur || '—'}

Mission : Pour chacun des 3 posts de Lola :
- 1 prompt Midjourney v6 complet (EN, --ar adapté au format, --v 6 --style raw, paramètres qualité)
- 1 prompt Flux/DALL-E (FR, description détaillée)
- Description du layout visuel recommandé (composition, texte overlay, placement logo)`,
    outputKey: 'visuels',
  },
  {
    id: 'analyste', prenom: 'Inès', emoji: '📊',
    model: 'claude-opus-4-5',
    max_tokens: 4000,
    folder: 'analytics/',
    system: `Tu es Inès, Analyste & Architecte du Plan 3D de B.BOLD Agency. Tableaux clairs, chiffres précis, actions SMART. Plan 4 semaines avec 3 actions par semaine.`,
    buildPrompt: (b, ctx) =>
      `STRATÉGIE (extrait) : ${(ctx.strategie || '').slice(0, 500)}

CONTENU PRODUIT : ${(ctx.contenu || '').slice(0, 400)}

CLIENT : ${b.client || '—'} | OBJECTIF : ${b.objectif || '—'} | BUDGET : ${b.budget || '—'} | PLATEFORMES : ${b.plateformes || '—'}

Mission :
1. Plan 4 semaines — tableau (Semaine | Type contenu | Fréquence | Format | Responsable)
2. KPI cibles par semaine avec seuils d'alerte rouge/orange/vert
3. Budget ads recommandé avec répartition par plateforme
4. 3 quick wins immédiats (actions < 48h, impact fort)`,
    outputKey: 'analytics',
  },
  {
    id: 'presentateur', prenom: 'Naïa', emoji: '🎤',
    model: 'claude-sonnet-4-5',
    max_tokens: 2800,
    folder: 'decks/',
    system: `Tu es Naïa, Présentatrice de B.BOLD Agency. Experte en storytelling (SOZA, Pyramide de Minto, Before/After). Structure narrative claire, slide-par-slide avec notes speaker.`,
    buildPrompt: (b, ctx) =>
      `LIVRABLES DE LA CAMPAGNE :
- Stratégie Maeva : ${(ctx.strategie || '').slice(0, 400)}...
- Contenu Lola : ${(ctx.contenu || '').slice(0, 300)}...
- Plan Inès : ${(ctx.analytics || '').slice(0, 300)}...

CLIENT : ${b.client || '—'} | AUDIENCE : Dirigeants / décideurs

Mission : Deck pitch commercial 10-12 slides.
Pour chaque slide : titre + message clé + contenu détaillé + visuel recommandé.
Notes speaker pour les slides 1 (ouverture), 5 (pivot), et closing.
Framework narratif à préciser en introduction.`,
    outputKey: 'deck',
  },
]

export async function POST(request) {
  const brief = await request.json()
  const encoder = new TextEncoder()
  const context = {}

  const readable = new ReadableStream({
    async start(controller) {
      const send = (obj) => {
        try {
          controller.enqueue(encoder.encode(JSON.stringify(obj) + '\n'))
        } catch (_) {}
      }

      send({ type: 'pipeline_start', total: PIPELINE.length })

      for (let i = 0; i < PIPELINE.length; i++) {
        const step = PIPELINE[i]
        send({ type: 'step_start', index: i, agent: step.id, prenom: step.prenom, emoji: step.emoji, folder: step.folder })

        try {
          const stream = await client.messages.stream({
            model: step.model,
            max_tokens: step.max_tokens || 2800,
            system: step.system,
            messages: [{ role: 'user', content: step.buildPrompt(brief, context) }],
          })

          let fullText = ''
          for await (const chunk of stream) {
            if (chunk.type === 'content_block_delta' && chunk.delta?.text) {
              fullText += chunk.delta.text
              send({ type: 'step_chunk', index: i, agent: step.id, text: chunk.delta.text })
            }
          }

          context[step.outputKey] = fullText
          send({ type: 'step_done', index: i, agent: step.id, prenom: step.prenom, folder: step.folder })

        } catch (err) {
          send({ type: 'step_error', index: i, agent: step.id, error: err.message || 'Erreur inconnue' })
          controller.close()
          return
        }
      }

      send({ type: 'pipeline_done' })
      controller.close()
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Transfer-Encoding': 'chunked',
    },
  })
}
