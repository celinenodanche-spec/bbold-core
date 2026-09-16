'use client'

/**
 * Code d'accès, côté navigateur.
 *
 * Stockage local, pas un cookie. L'app est destinée à tourner dans une iframe
 * Systeme.io, donc en contexte tiers : Safari y bloque les cookies purement et
 * simplement. Le stockage local est cloisonné par site parent, mais il
 * fonctionne. Un cookie nous aurait fait perdre les visiteurs iPhone.
 */

const CLE = 'bbold_access_code'

/** Émis quand le serveur refuse le code : la porte d'entrée se rouvre. */
export const EVENEMENT_REFUS = 'bbold:acces-refuse'

// localStorage jette en navigation privée sur certains navigateurs, et quand le
// site parent interdit le stockage tiers. On ne casse jamais l'app pour ça.
export function lireCode(): string {
  try { return localStorage.getItem(CLE) || '' } catch { return '' }
}

export function ecrireCode(code: string): void {
  try { localStorage.setItem(CLE, code) } catch { /* stockage indisponible */ }
}

export function effacerCode(): void {
  try { localStorage.removeItem(CLE) } catch { /* stockage indisponible */ }
}

/**
 * Remplace fetch() pour tout appel à /api. Seul endroit qui attache le code.
 * Un 401 vide le code mémorisé et fait réapparaître la porte d'entrée.
 */
export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const res = await fetch(url, {
    ...options,
    headers: { ...(options.headers || {}), 'x-bbold-access': lireCode() },
  })
  if (res.status === 401) {
    effacerCode()
    window.dispatchEvent(new Event(EVENEMENT_REFUS))
  }
  return res
}

/**
 * Ajoute le code à une URL qui ne peut pas porter d'en-tête : `<img src>`,
 * lien de téléchargement. Sans effet sur tout le reste — une URL Blob, une
 * data:URI ou un fichier statique ressort telle quelle.
 */
export function withAccess(url: string): string {
  if (!url || !url.startsWith('/api/')) return url
  const code = lireCode()
  if (!code) return url
  return `${url}${url.includes('?') ? '&' : '?'}k=${encodeURIComponent(code)}`
}
