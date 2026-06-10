// ─── Notion Save — append agent output to a client page ──────────────────────

const NOTION_VERSION = '2022-06-28'

function extractPageId(urlOrId) {
  // Handles:
  // https://www.notion.so/Title-abc123def456...
  // https://notion.so/workspace/Title-abc123def456...
  // abc123def456... (raw ID, with or without hyphens)
  const clean = urlOrId.trim()
  const match = clean.match(/([a-f0-9]{32}|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/)
  if (!match) return null
  // Normalize to UUID format with hyphens
  const raw = match[1].replace(/-/g, '')
  return `${raw.slice(0,8)}-${raw.slice(8,12)}-${raw.slice(12,16)}-${raw.slice(16,20)}-${raw.slice(20)}`
}

function textToNotionBlocks(content, agentEmoji, agentName, clientName) {
  const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
  const blocks = []

  // ── Divider
  blocks.push({ object: 'block', type: 'divider', divider: {} })

  // ── Callout header
  blocks.push({
    object: 'block',
    type: 'callout',
    callout: {
      rich_text: [{
        type: 'text',
        text: { content: `${agentEmoji} ${agentName} — ${clientName || 'B.BOLD'} · ${date}` },
        annotations: { bold: true },
      }],
      icon: { type: 'emoji', emoji: agentEmoji || '✦' },
      color: 'purple_background',
    },
  })

  // ── Content blocks
  const lines = content.split('\n')
  for (const raw of lines) {
    const line = raw.trimEnd()

    if (line.startsWith('# ')) {
      blocks.push({
        object: 'block', type: 'heading_1',
        heading_1: { rich_text: [{ type: 'text', text: { content: line.slice(2) } }] },
      })
    } else if (line.startsWith('## ')) {
      blocks.push({
        object: 'block', type: 'heading_2',
        heading_2: { rich_text: [{ type: 'text', text: { content: line.slice(3) } }] },
      })
    } else if (line.startsWith('### ')) {
      blocks.push({
        object: 'block', type: 'heading_3',
        heading_3: { rich_text: [{ type: 'text', text: { content: line.slice(4) } }] },
      })
    } else if (line.startsWith('━') || line.startsWith('---')) {
      blocks.push({ object: 'block', type: 'divider', divider: {} })
    } else if (line.startsWith('- ') || line.startsWith('• ')) {
      blocks.push({
        object: 'block', type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [{ type: 'text', text: { content: line.slice(2) } }],
        },
      })
    } else if (/^\d+\. /.test(line)) {
      blocks.push({
        object: 'block', type: 'numbered_list_item',
        numbered_list_item: {
          rich_text: [{ type: 'text', text: { content: line.replace(/^\d+\. /, '') } }],
        },
      })
    } else if (line.trim() === '') {
      // skip empty lines (Notion handles spacing)
    } else {
      // Parse bold (**text**) into annotated rich_text
      const richText = parseInlineBold(line)
      blocks.push({
        object: 'block', type: 'paragraph',
        paragraph: { rich_text: richText },
      })
    }
  }

  return blocks
}

function parseInlineBold(text) {
  // Split on **...** markers and produce annotated rich_text
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return parts.filter(Boolean).map(part => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return {
        type: 'text',
        text: { content: part.slice(2, -2) },
        annotations: { bold: true },
      }
    }
    return { type: 'text', text: { content: part } }
  })
}

export async function POST(request) {
  const { pageUrl, content, agentEmoji, agentName, clientName } = await request.json()

  if (!process.env.NOTION_API_KEY) {
    return Response.json(
      { error: 'NOTION_API_KEY non configurée. Ajoute-la dans les variables d\'environnement Vercel.' },
      { status: 500 }
    )
  }

  const pageId = extractPageId(pageUrl)
  if (!pageId) {
    return Response.json(
      { error: 'URL Notion invalide. Copie l\'URL complète de la page depuis ton navigateur.' },
      { status: 400 }
    )
  }

  const blocks = textToNotionBlocks(content, agentEmoji, agentName, clientName)

  // Notion API limit: 100 blocks per request — chunk if needed
  const CHUNK = 100
  for (let i = 0; i < blocks.length; i += CHUNK) {
    const chunk = blocks.slice(i, i + CHUNK)
    const res = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
        'Content-Type': 'application/json',
        'Notion-Version': NOTION_VERSION,
      },
      body: JSON.stringify({ children: chunk }),
    })
    if (!res.ok) {
      const err = await res.json()
      const msg = err?.message || `Erreur Notion ${res.status}`
      // Common errors
      if (res.status === 404) {
        return Response.json({ error: 'Page Notion introuvable. Vérifie que l\'intégration B.BOLD Core a accès à cette page (Connections dans la page Notion).' }, { status: 404 })
      }
      if (res.status === 401) {
        return Response.json({ error: 'Token Notion invalide ou expiré. Vérifie NOTION_API_KEY dans Vercel.' }, { status: 401 })
      }
      return Response.json({ error: msg }, { status: res.status })
    }
  }

  return Response.json({ success: true, pageId })
}
