/**
 * Brief de secours (client ET serveur, aucune dépendance Node) : utilisé quand le
 * résumé automatique de la discussion avec Zara n'aboutit pas.
 *
 * - Si Zara a rédigé un récap (« 📋 RÉCAP BRIEF », « Récap : »…), on part de la
 *   DERNIÈRE ligne qui l'annonce : c'est le travail validé, pas le bavardage autour.
 * - Le markdown est retiré : le champ « idée de contenu » est du texte brut.
 * - Aucune coupure en plein mot : on garde tout, dans la limite large de MAX.
 */
const MAX = 6000;

export function briefFromMessage(text: string): string {
  let t = (text ?? "").replace(/\r\n/g, "\n").trim();
  if (!t) return "";

  const heads = [...t.matchAll(/^[^\n]*r[ée]cap[^\n]*$/gim)];
  const last = heads[heads.length - 1];
  if (last?.index !== undefined) {
    const after = t.slice(last.index + last[0].length).trim();
    if (after.length >= 40) t = after; // récap vide ou quasi vide : on garde le message entier
  }

  t = t
    .replace(/\*\*([^*\n]+)\*\*/g, "$1")
    .replace(/__([^_\n]+)__/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (t.length <= MAX) return t;
  // coupe propre : à la dernière fin de ligne avant la limite
  const cut = t.slice(0, MAX);
  const nl = cut.lastIndexOf("\n");
  return (nl > MAX * 0.6 ? cut.slice(0, nl) : cut).trim();
}
