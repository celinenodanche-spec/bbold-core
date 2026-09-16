import { NextResponse } from 'next/server'

// Toutes les routes /api passent par ici. Un seul point de contrôle : impossible
// d'oublier une route, et celles qu'on ajoutera demain sont protégées d'office.
export const config = { matcher: '/api/:path*' }

// Comparaison à temps constant. Un `a === b` sort au premier caractère qui
// diffère : le temps de réponse laisse alors deviner le code, caractère par
// caractère. Ici on parcourt tout, quoi qu'il arrive.
function memeCode(fourni, attendu) {
  const enc = new TextEncoder()
  const a = enc.encode(fourni)
  const b = enc.encode(attendu)
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i]
  return diff === 0
}

export function middleware(request) {
  const attendu = process.env.ACCESS_CODE

  // Pas de code configuré côté serveur → on ferme. Laisser passer serait pire
  // que de ne rien faire : l'app aurait l'air protégée sans l'être.
  if (!attendu) {
    return NextResponse.json(
      { error: "ACCESS_CODE n'est pas configurée sur le serveur." },
      { status: 503 },
    )
  }

  // Deux façons de présenter le code. L'en-tête pour tout ce qui passe par
  // fetch(). Le paramètre ?k= pour ce qui ne peut pas porter d'en-tête : un
  // <img src>, un lien de téléchargement ZIP.
  const fourni =
    request.headers.get('x-bbold-access') ||
    request.nextUrl.searchParams.get('k') ||
    ''

  if (!memeCode(fourni, attendu)) {
    return NextResponse.json({ error: "Code d'accès invalide." }, { status: 401 })
  }

  return NextResponse.next()
}
