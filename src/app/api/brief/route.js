import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export const runtime = 'edge'

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
    system: systemPrompt,
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
