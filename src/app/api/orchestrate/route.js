import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export const runtime = 'edge'

// ─── Date du jour, injectée dans tous les prompts ────────────────────────────
// Sans elle, les agents se rabattent sur ce que leur modèle a appris et
// écrivent des années périmées. Un calendrier éditorial daté de l'an dernier
// est inutilisable.
function blocDate() {
  const maintenant = new Date()
  const fmt = (opts) => maintenant.toLocaleDateString('fr-FR', { timeZone: 'America/Martinique', ...opts })
  return `=== DATE DU JOUR ===
Nous sommes le ${fmt({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}.
Format court : ${fmt({ day: '2-digit', month: '2-digit', year: 'numeric' })}
Année en cours : ${fmt({ year: 'numeric' })}
Fuseau : Martinique (UTC-4)

Toute date, tout calendrier, toute échéance et toute référence temporelle que tu
produis part de cette date. Tu n'utilises jamais une autre année que celle-ci
sans raison explicite. Si tu cites un exemple daté, il est cohérent avec le
présent.
`
}


// Fetches clean text content from a URL — works for websites, not for JS-rendered social media
async function fetchUrlContent(url) {
  if (!url || !url.startsWith('http')) return ''
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 6000)
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BBold/1.0; +https://bbold-core.vercel.app)' },
    })
    clearTimeout(timeout)
    if (!res.ok) return ''
    const html = await res.text()
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/&[a-z]+;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 4000)
  } catch {
    return ''
  }
}

// Pipeline séquentiel — chaque step passe son output au suivant via context
const PIPELINE = [
  {
    id: 'stratege', prenom: 'Maeva', emoji: '🎯',
    model: 'claude-opus-4-5',
    max_tokens: 14000,
    folder: 'briefs/',
    system: `Tu es Maeva, Stratège & Brief de B.BOLD Agency, experte en brand strategy pour les territoires insulaires français (Martinique, Guadeloupe, Guyane). Style : cash, structuré, bullet points pour les insights. Sois précise et directe.`,
    buildPrompt: (b, ctx) => {
      const urls = [
        b.site_web  ? `Site web : ${b.site_web}` : '',
        b.instagram ? `Instagram : ${b.instagram}` : '',
        b.facebook  ? `Facebook : ${b.facebook}` : '',
        b.linkedin  ? `LinkedIn : ${b.linkedin}` : '',
        b.tiktok    ? `TikTok : ${b.tiktok}` : '',
      ].filter(Boolean).join('\n')

      return `CLIENT : ${b.client || '—'}
SECTEUR : ${b.secteur || '—'}
OBJECTIF : ${b.objectif || '—'}
CIBLE / ICP : ${b.cible || '—'}
BUDGET : ${b.budget || '—'}
PLATEFORMES : ${b.plateformes || '—'}
TON DE MARQUE : ${b.ton || '—'}
${urls ? `\nPRÉSENCE DIGITALE EXISTANTE :\n${urls}` : ''}
${ctx.debelvoix_pre ? `\n---\nANALYSE BRAND VOICE EXISTANTE (Debelvoix) :\n${ctx.debelvoix_pre}\n---` : ''}

Mission :
1. 3 insights clés sur ce marché local (data + observation terrain)
2. ICP détaillé (profil, douleurs profondes, aspirations, déclencheurs d'achat)
3. Positionnement différenciant en 1 phrase percutante
4. Value Proposition Canvas (6 blocs : jobs, pains, gains, products, pain relievers, gain creators)
5. 3 piliers éditoriaux avec 3 sujets de post par pilier`
    },
    outputKey: 'strategie',
  },
  {
    id: 'createur', prenom: 'Lola', emoji: '✍️',
    model: 'claude-sonnet-4-5',
    max_tokens: 12000,
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
    max_tokens: 12000,
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
    max_tokens: 14000,
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
    max_tokens: 12000,
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

const DEBELVOIX_SYSTEM = `Tu es Debelvoix, expert en analyse de brand voice pour les territoires insulaires français. Tu analyses la présence digitale existante d'une marque à partir des URLs et du contenu extrait. Tu fournis une analyse actionnable qui servira de contexte stratégique.`

export async function POST(request) {
  const corps = await request.json()

  // Le pipeline s'exécute désormais UNE ÉTAPE PAR REQUÊTE.
  // Avant, les 5 agents tournaient dans un seul appel : leurs durées
  // s'additionnaient et la dernière étape se faisait couper par la limite
  // de durée de Vercel. Une étape par requête, chacune reste très en deçà.
  //   mode 'prestep' -> analyse Debelvoix seule
  //   mode 'step'    -> l'étape numéro stepIndex, avec le contexte accumulé
  //   sans mode      -> ancien comportement, conservé par compatibilité
  const { mode, stepIndex, context: contexteRecu, ...brief } = corps
  const encoder = new TextEncoder()
  const context = contexteRecu && typeof contexteRecu === 'object' ? { ...contexteRecu } : {}

  // Determine effective pipeline (all steps or filtered by selected_agents)
  const effectivePipeline = (Array.isArray(brief.selected_agents) && brief.selected_agents.length > 0)
    ? PIPELINE.filter(step => brief.selected_agents.includes(step.id))
    : PIPELINE

  // Detect if any URL was provided
  const hasUrls = !!(brief.site_web || brief.instagram || brief.facebook || brief.linkedin || brief.tiktok)

  const readable = new ReadableStream({
    async start(controller) {
      const send = (obj) => {
        try {
          controller.enqueue(encoder.encode(JSON.stringify(obj) + '\n'))
        } catch (_) {}
      }

      send({ type: 'pipeline_start', total: effectivePipeline.length, hasPreStep: hasUrls })

      // ─── PRE-STEP : Debelvoix brand analysis (when URLs provided) ────────────
      if (hasUrls && mode !== 'step') {
        send({ type: 'pre_step_start', agent: 'debelvoix', prenom: 'Debelvoix', emoji: '🔍' })

        // Try fetching website content (social media pages are JS-rendered, won't return useful content)
        let webContent = ''
        if (brief.site_web) {
          webContent = await fetchUrlContent(brief.site_web)
        }

        const urlSummary = [
          brief.site_web  ? `Site web : ${brief.site_web}` : '',
          brief.instagram ? `Instagram : ${brief.instagram}` : '',
          brief.facebook  ? `Facebook : ${brief.facebook}` : '',
          brief.linkedin  ? `LinkedIn : ${brief.linkedin}` : '',
          brief.tiktok    ? `TikTok : ${brief.tiktok}` : '',
        ].filter(Boolean).join('\n')

        const debelvoixPrompt = `CLIENT : ${brief.client || '—'}
SECTEUR : ${brief.secteur || '—'}

PRÉSENCE DIGITALE DÉCLARÉE :
${urlSummary}

CONTENU EXTRAIT DU SITE WEB :
${webContent || 'Non disponible (réseau social ou site inaccessible côté serveur — analyse basée sur les informations disponibles)'}

Mission : Analyse la présence digitale existante de cette marque. Identifie :

1. TON & VOIX ACTUELLE — comment la marque se présente en ligne (formel, décontracté, expert, proche...) — avec exemples si contenu disponible
2. MESSAGES CLÉS VISIBLES — ce que la marque met en avant (produits, valeurs, bénéfices)
3. POSITIONNEMENT PERÇU — ce que les visiteurs comprennent en arrivant sur la marque
4. POINTS FORTS — ce qui fonctionne dans la communication actuelle
5. LACUNES ET OPPORTUNITÉS — ce qui manque, ce qui pourrait être renforcé
6. RECOMMANDATIONS PRIORITAIRES — 3 actions concrètes pour améliorer la présence digitale

Synthèse en 5 lignes utilisable comme brief stratégique.`

        try {
          const dvStream = await client.messages.stream({
            model: 'claude-opus-4-5',
            max_tokens: 8000,
            system: blocDate() + '\n' + DEBELVOIX_SYSTEM,
            messages: [{ role: 'user', content: debelvoixPrompt }],
          })

          let debelvoixOutput = ''
          for await (const chunk of dvStream) {
            if (chunk.type === 'content_block_delta' && chunk.delta?.text) {
              debelvoixOutput += chunk.delta.text
              send({ type: 'pre_step_chunk', agent: 'debelvoix', text: chunk.delta.text })
            }
          }

          context.debelvoix_pre = debelvoixOutput
          send({ type: 'pre_step_done', agent: 'debelvoix', output: debelvoixOutput })

        } catch (err) {
          // Non-fatal: continue pipeline even if Debelvoix pre-step fails
          send({ type: 'pre_step_error', agent: 'debelvoix', error: err.message || 'Erreur Debelvoix' })
        }
      }

      // En mode prestep, la requête s'arrête ici : l'analyse Debelvoix est
      // renvoyée au navigateur, qui la joindra au contexte des étapes suivantes.
      if (mode === 'prestep') {
        controller.close()
        return
      }

      // ─── PIPELINE ─────────────────────────────────────────────────────────────
      // Une seule étape si stepIndex est fourni, sinon toutes (ancien mode).
      const indices = (mode === 'step' && Number.isInteger(stepIndex))
        ? [stepIndex]
        : effectivePipeline.map((_, k) => k)

      for (const i of indices) {
        const step = effectivePipeline[i]
        if (!step) { send({ type: 'step_error', index: i, error: `Étape ${i} inconnue` }); break }
        send({ type: 'step_start', index: i, agent: step.id, prenom: step.prenom, emoji: step.emoji, folder: step.folder })

        try {
          const stream = await client.messages.stream({
            model: step.model,
            max_tokens: step.max_tokens || 10000,
            system: blocDate() + '\n' + step.system,
            messages: [{ role: 'user', content: step.buildPrompt(brief, context) }],
          })

          let fullText = ''
          let raisonArret = null
          for await (const chunk of stream) {
            if (chunk.type === 'content_block_delta' && chunk.delta?.text) {
              fullText += chunk.delta.text
              send({ type: 'step_chunk', index: i, agent: step.id, text: chunk.delta.text })
            }
            if (chunk.type === 'message_delta' && chunk.delta?.stop_reason) {
              raisonArret = chunk.delta.stop_reason
            }
          }
          // Livrable coupé : on le dit dans le flux, sinon l'étape suivante
          // repart d'un texte tronqué sans que personne ne s'en aperçoive.
          if (raisonArret === 'max_tokens') {
            const avis = `\n\n---\n⚠ DOCUMENT INCOMPLET — la limite de longueur a été atteinte.\nCe texte s'arrête au milieu. Ne l'envoie pas tel quel : relance en demandant une partie à la fois, ou augmente max_tokens pour cet agent.`
            fullText += avis
            send({ type: 'step_chunk', index: i, agent: step.id, text: avis })
          }

          context[step.outputKey] = fullText
          send({
            type: 'step_done', index: i, agent: step.id,
            prenom: step.prenom, folder: step.folder,
            // La sortie voyage avec l'événement : c'est le navigateur qui
            // conserve le contexte d'une étape à l'autre.
            output: fullText, outputKey: step.outputKey,
          })

        } catch (err) {
          send({ type: 'step_error', index: i, agent: step.id, error: err.message || 'Erreur inconnue' })
          controller.close()
          return
        }
      }

      if (mode === 'step') { controller.close(); return }

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
