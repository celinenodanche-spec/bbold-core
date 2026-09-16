export const runtime = 'edge'

// Le middleware a déjà validé le code avant d'arriver ici. Si cette ligne
// s'exécute, c'est que le code est bon — d'où la réponse vide.
// Un mauvais code n'atteint jamais ce fichier : il est refusé en 401 plus haut.
export async function POST() {
  return Response.json({ ok: true })
}
