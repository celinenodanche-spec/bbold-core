// ─── Capture Le Rituel 3 Minutes — enregistre prénom + e-mail ───────────────
//
// Route publique (voir l'exception dans middleware.js) : les visiteurs de la
// page de capture n'ont pas le code d'accès interne de l'outil agence.
//
// Stockage : même mécanisme que le reste du studio (src/lib/studio/storage.ts)
// — Vercel Blob en prod, système de fichiers en local — un fichier JSON unique
// sous leads/. Volume d'un lead magnet, pas besoin d'une base de données.

import { getData, putData } from '@/lib/studio/storage'

const CLE = 'leads/rituel-3-minutes.json'
const EMAIL_VALIDE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

async function lireLeads() {
  const buf = await getData(CLE)
  if (!buf) return []
  try {
    const data = JSON.parse(buf.toString('utf-8'))
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

async function ecrireLeads(leads) {
  await putData(CLE, Buffer.from(JSON.stringify(leads, null, 2), 'utf-8'), 'application/json')
}

export async function POST(request) {
  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ erreur: 'Requête invalide.' }, { status: 400 })
  }

  const { prenom, email, piege } = body || {}

  // Piège à robots rempli : une personne ne voit ni ne remplit jamais ce
  // champ. On répond « succès » sans rien enregistrer, pour ne pas leur dire
  // qu'ils se sont fait repérer.
  if (typeof piege === 'string' && piege.trim() !== '') {
    return Response.json({ ok: true })
  }

  const prenomPropre = typeof prenom === 'string' ? prenom.trim().slice(0, 60) : ''
  const emailPropre = typeof email === 'string' ? email.trim().toLowerCase().slice(0, 254) : ''

  if (!prenomPropre) {
    return Response.json({ erreur: 'Votre prénom, pour vous appeler par votre nom.' }, { status: 400 })
  }
  if (!EMAIL_VALIDE.test(emailPropre)) {
    return Response.json({ erreur: 'Une adresse e-mail valide, pour recevoir le rituel.' }, { status: 400 })
  }

  try {
    const leads = await lireLeads()
    const dejaInscrite = leads.some((l) => l.email === emailPropre)

    if (!dejaInscrite) {
      leads.push({
        prenom: prenomPropre,
        email: emailPropre,
        source: 'rituel-3-minutes',
        inscritLe: new Date().toISOString(),
      })
      await ecrireLeads(leads)
    }

    return Response.json({ ok: true })
  } catch (err) {
    console.error('[api/leads/rituel-3-minutes]', err)
    return Response.json(
      { erreur: "Le rituel ne part pas pour l'instant. Réessayez dans un instant." },
      { status: 500 },
    )
  }
}
