/**
 * Identité de l'installation (« tenant ») : nom, couleurs, logo, marché, studio.
 *
 * Un seul code, une installation Vercel par client. Chaque installation choisit
 * son identité avec UNE variable d'environnement :
 *
 *   NEXT_PUBLIC_TENANT=bbold        (défaut)
 *   NEXT_PUBLIC_TENANT=<id client>  → src/config/tenants/<id>.js
 *
 * Ajouter un client : copier tenants/_modele.js, le remplir, l'enregistrer
 * ci-dessous dans TENANTS. Le préfixe NEXT_PUBLIC_ rend la valeur lisible côté
 * navigateur comme côté serveur (elle est figée au build).
 */
import bbold from './tenants/bbold'

const TENANTS = { bbold }

function pick() {
  const id = (process.env.NEXT_PUBLIC_TENANT || 'bbold').trim()
  const t = TENANTS[id]
  // Un id inconnu ne doit JAMAIS retomber silencieusement sur B.BOLD : le client
  // verrait l'identité d'une autre agence. On casse le build, bruyamment.
  if (!t) throw new Error(`NEXT_PUBLIC_TENANT="${id}" inconnu. Tenants disponibles : ${Object.keys(TENANTS).join(', ')} (src/config/tenant.js).`)
  // Un champ oublié écrirait « undefined » au milieu des consignes des agents :
  // on compare la forme du tenant à celle de B.BOLD, la référence complète.
  const missing = missingKeys(bbold, t)
  if (missing.length) throw new Error(`Tenant "${id}" incomplet, champ(s) manquant(s) : ${missing.join(', ')} (src/config/tenants/${id}.js).`)
  return t
}

function missingKeys(ref, obj, path = '') {
  const out = []
  for (const k of Object.keys(ref)) {
    const p = path ? `${path}.${k}` : k
    if (!(k in (obj ?? {}))) { out.push(p); continue }
    const r = ref[k], v = obj[k]
    if (r && typeof r === 'object' && !Array.isArray(r)) out.push(...missingKeys(r, v, p))
    else if (r !== null && typeof v !== typeof r) out.push(`${p} (type attendu : ${Array.isArray(r) ? 'liste' : typeof r})`)
  }
  return out
}

/** Identité complète de l'installation. */
export const T = pick()

/** Couleurs de l'interface (hex). */
export const C = T.colors

const triplet = (hex) => {
  const h = hex.replace('#', '')
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(',')
}

/** Mêmes couleurs en « r,g,b » pour les rgba(…, alpha). */
export const RGB = Object.fromEntries(Object.entries(C).map(([k, v]) => [k, triplet(v)]))

/** Palette historique de l'interface (noms d'origine), dérivée du tenant. */
export const B = {
  violetDeep: C.primary, magenta: C.secondary, gold: C.accent,
  goldLight: C.accentLight, black: C.bg, lilas: C.soft,
  white: C.text, surface: `rgba(${RGB.primary},0.09)`, border: `rgba(${RGB.accent},0.2)`,
}
