import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const AGENTS = {
  gmail: {
    model: 'claude-sonnet-4-5',
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
    max_tokens: 1500,
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
