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


export async function POST(request) {
  const {
    agentId,
    systemPrompt,
    userPrompt,
    max_tokens: reqMaxTokens,
    imageBase64,
    imageMediaType,
  } = await request.json()

  const models = {
    orchestrateur: 'claude-opus-4-5',
    stratege:      'claude-opus-4-5',
    analyste:      'claude-opus-4-5',
    createur:      'claude-sonnet-4-5',
    designer:      'claude-opus-4-5',   // upgraded for vision + Canva specs
    presentateur:  'claude-sonnet-4-5',
  }

  // Build message content — include image if provided (designer/vision)
  let messageContent
  if (imageBase64 && imageMediaType) {
    messageContent = [
      {
        type: 'image',
        source: {
          type: 'base64',
          media_type: imageMediaType,
          data: imageBase64,
        },
      },
      { type: 'text', text: userPrompt },
    ]
  } else {
    messageContent = userPrompt
  }

  const stream = await client.messages.stream({
    model: models[agentId] || 'claude-sonnet-4-5',
    max_tokens: reqMaxTokens || 10000,
    system: blocDate() + '\n' + systemPrompt,
    messages: [{ role: 'user', content: messageContent }],
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      // On surveille la raison d'arrêt : si Claude s'interrompt faute de place,
      // le texte s'arrête au milieu sans que rien ne le signale à l'écran.
      let raisonArret = null
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta?.text) {
          controller.enqueue(encoder.encode(chunk.delta.text))
        }
        if (chunk.type === 'message_delta' && chunk.delta?.stop_reason) {
          raisonArret = chunk.delta.stop_reason
        }
      }
      if (raisonArret === 'max_tokens') {
        controller.enqueue(encoder.encode(`\n\n---\n⚠ DOCUMENT INCOMPLET — la limite de longueur a été atteinte.\nCe texte s'arrête au milieu. Ne l'envoie pas tel quel : relance en demandant une partie à la fois, ou augmente max_tokens pour cet agent.`))
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
