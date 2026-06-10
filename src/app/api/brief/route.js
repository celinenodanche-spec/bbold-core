import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request) {
  const { agentId, systemPrompt, userPrompt, max_tokens: reqMaxTokens } = await request.json()

  const models = {
    orchestrateur: 'claude-opus-4-5',
    stratege:      'claude-opus-4-5',
    analyste:      'claude-opus-4-5',
    createur:      'claude-sonnet-4-5',
    designer:      'claude-sonnet-4-5',
    presentateur:  'claude-sonnet-4-5',
  }

  const stream = await client.messages.stream({
    model: models[agentId] || 'claude-sonnet-4-5',
    max_tokens: reqMaxTokens || 2048,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
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
