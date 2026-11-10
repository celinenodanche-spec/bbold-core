/**
 * Store des posts créés par Zara.
 *
 * UN FICHIER PAR ÉCRITURE : `posts/<id>__<version>.json`. Rien n'est jamais
 * réécrit par-dessus. La version la plus récente d'un id fait foi.
 *
 * Pourquoi : l'ancien store tenait tous les posts dans un seul `content/store.json`
 * relu puis réécrit à chaque opération. Sur Vercel Blob, une lecture qui suit de
 * près une écriture peut encore voir l'ancienne version : en mode Série, le post
 * N+1 relisait un store périmé et écrasait les visuels du post N (d'où des ZIP
 * avec la légende mais sans image). Ici, deux posts ne partagent aucun fichier,
 * et un fichier neuf n'a pas de version périmée à servir.
 *
 * `content/store.json` reste LU (jamais réécrit sauf suppression) : les posts
 * créés avant ce changement restent dans la bibliothèque.
 */
import { getData, putData, listData, delData, readEntry, type DataEntry } from "./storage";
import type { ContentResult, Platform, Format } from "./generate";

const LEGACY_KEY = "content/store.json";
const DIR = "posts";

export interface SlideJob { index: number; jobId: string }
export interface ContentPost {
  id: string;
  brandSlug?: string;
  platform: Platform;
  format: Format;
  idea: string;
  template?: string; // nom DA (aperçu texte)
  refId?: string; // (hérité, plus utilisé)
  style?: string; // style éditorial (magazine, bold, minimal…)
  tools?: string[]; // (hérité, plus utilisé)
  t1?: unknown; // (non utilisé côté B.BOLD)
  result: ContentResult;
  visuals?: { jobs: SlideJob[]; images: (string | null)[]; done: boolean };
  status: "draft" | "scheduled" | "posted";
  schedule?: { at: string } | null;
  createdAt: string;
  deleted?: boolean; // pierre tombale : masque un post dont un fichier traînerait encore
}

/* ---------- versions ---------- */

/** `post-abc__0001xyz.json` → { id, version }. Les versions sont des horodatages base 36 à largeur fixe : l'ordre alphabétique est l'ordre du temps. */
function parseName(name: string): { id: string; version: string } | null {
  const m = /^(.+)__([0-9a-z]+)\.json$/.exec(name);
  return m ? { id: m[1], version: m[2] } : null;
}
let lastTick = 0;
/** Version strictement croissante, même pour deux écritures dans la même milliseconde. */
function nextVersion(): string {
  const now = Date.now();
  lastTick = now > lastTick ? now : lastTick + 1;
  return lastTick.toString(36).padStart(11, "0");
}
const fileKey = (id: string, version: string) => `${DIR}/${id}__${version}.json`;

/** Dernière version de chaque id + les versions dépassées (à nettoyer). */
function latestById(entries: DataEntry[]): { latest: Map<string, DataEntry>; stale: DataEntry[] } {
  const latest = new Map<string, DataEntry>();
  const best = new Map<string, string>();
  const stale: DataEntry[] = [];
  for (const e of entries) {
    const p = parseName(e.name);
    if (!p) continue;
    const cur = best.get(p.id);
    if (cur === undefined || p.version > cur) {
      const prev = latest.get(p.id);
      if (prev) stale.push(prev);
      latest.set(p.id, e); best.set(p.id, p.version);
    } else stale.push(e);
  }
  return { latest, stale };
}

async function parsePost(buf: Buffer | null): Promise<ContentPost | null> {
  if (!buf) return null;
  try {
    const p = JSON.parse(buf.toString("utf-8")) as ContentPost;
    return p && typeof p.id === "string" && p.result ? p : null;
  } catch { return null; }
}

/** Lit par paquets : une bibliothèque de 200 posts ne doit pas ouvrir 200 connexions d'un coup. */
async function mapLimit<T, R>(items: T[], limit: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    for (;;) { const i = next++; if (i >= items.length) return; out[i] = await fn(items[i]); }
  }));
  return out;
}

async function readLegacy(): Promise<ContentPost[]> {
  try {
    const buf = await getData(LEGACY_KEY);
    if (!buf) return [];
    const j = JSON.parse(buf.toString("utf-8")) as { posts?: ContentPost[] };
    return Array.isArray(j.posts) ? j.posts.filter((p) => p && typeof p.id === "string" && p.result) : [];
  } catch { return []; }
}

/* ---------- API ---------- */

const brandOf = (p: ContentPost) => p.brandSlug ?? "bbold-core";

export async function listPosts(brandSlug?: string): Promise<ContentPost[]> {
  const [entries, legacy] = await Promise.all([listData(DIR).catch(() => [] as DataEntry[]), readLegacy()]);
  const { latest } = latestById(entries);
  const fresh = (await mapLimit([...latest.values()], 12, async (e) => parsePost(await readEntry(DIR, e)))).filter((p): p is ContentPost => !!p);
  const seen = new Set([...latest.keys()]); // un id présent dans posts/ masque sa copie de l'ancien store
  const all = [...fresh, ...legacy.filter((p) => !seen.has(p.id))].filter((p) => !p.deleted);
  const posts = brandSlug ? all.filter((p) => brandOf(p) === brandSlug) : all;
  return posts.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

/** Dernière version d'un post. Un seul listing ciblé sur son préfixe, puis lecture directe. */
async function readLatest(id: string): Promise<ContentPost | null | undefined> {
  const entries = (await listData(DIR, `${id}__`)).filter((e) => parseName(e.name)?.id === id);
  if (!entries.length) return undefined; // inconnu dans posts/
  const { latest } = latestById(entries);
  const e = latest.get(id);
  return e ? parsePost(await readEntry(DIR, e)) : null;
}

export async function getPost(id: string): Promise<ContentPost | null> {
  // Un post tout juste créé peut mettre un instant à apparaître dans le listing : on réessaie brièvement.
  for (let attempt = 0; attempt < 4; attempt++) {
    const p = await readLatest(id).catch(() => undefined);
    if (p) return p.deleted ? null : p;
    if (p === undefined) {
      const old = (await readLegacy()).find((x) => x.id === id);
      if (old) return old;
    }
    if (attempt < 3) await new Promise((r) => setTimeout(r, 400));
  }
  return null;
}

/** Écrit une nouvelle version complète du post, puis retire les anciennes (au mieux). */
export async function savePost(post: ContentPost): Promise<ContentPost> {
  const version = nextVersion();
  await putData(fileKey(post.id, version), Buffer.from(JSON.stringify(post, null, 2), "utf-8"), "application/json");
  await pruneOld(post.id, version);
  return post;
}

async function pruneOld(id: string, keep: string): Promise<void> {
  try {
    const old = (await listData(DIR, `${id}__`)).filter((e) => { const p = parseName(e.name); return p?.id === id && p.version < keep; });
    await Promise.all(old.map((e) => delData(`${DIR}/${e.name}`).catch(() => {})));
  } catch { /* nettoyage facultatif */ }
}

let lastId = 0;
function newId(): string {
  const now = Date.now();
  lastId = now > lastId ? now : lastId + 1;
  return `post-${lastId.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export async function addPost(p: Omit<ContentPost, "id" | "createdAt" | "status">): Promise<ContentPost> {
  return savePost({ ...p, id: newId(), status: "draft", createdAt: new Date().toISOString() });
}

/**
 * Applique un patch. `base` sert quand le post vient d'être créé et n'est pas
 * encore relisible : on écrit quand même, à partir de ce que l'appelant connaît.
 */
export async function updatePost(id: string, patch: Partial<ContentPost>, base?: ContentPost | null): Promise<ContentPost | null> {
  // `base` d'abord : c'est le post que l'appelant vient de créer, inutile d'attendre qu'il soit relisible.
  const current = (base && base.id === id ? base : null) ?? (await getPost(id));
  if (!current) return null;
  return savePost({ ...current, ...patch, id });
}

export async function deletePost(id: string): Promise<void> {
  // 1. ancien store : on retire l'entrée (seule réécriture qu'il subit encore)
  let wasLegacy = false;
  try {
    const buf = await getData(LEGACY_KEY);
    if (buf) {
      const j = JSON.parse(buf.toString("utf-8")) as { posts?: ContentPost[] };
      if (Array.isArray(j.posts) && j.posts.some((p) => p.id === id)) {
        wasLegacy = true;
        j.posts = j.posts.filter((p) => p.id !== id);
        await putData(LEGACY_KEY, Buffer.from(JSON.stringify(j, null, 2), "utf-8"), "application/json");
      }
    }
  } catch { /* on nettoie quand même posts/ */ }
  // 2. nouveau store : on supprime toutes les versions
  const mine = (await listData(DIR, `${id}__`)).filter((e) => parseName(e.name)?.id === id);
  await Promise.all(mine.map((e) => delData(`${DIR}/${e.name}`).catch(() => {})));
  // 3. l'ancien store peut être relu périmé juste après sa réécriture : une pierre tombale garantit que le post reste masqué
  if (wasLegacy) await savePostQuiet({ id, deleted: true, platform: "instagram", format: "post", idea: "", result: { platform: "instagram", format: "post" }, status: "draft", createdAt: new Date(0).toISOString() });
}

/** Écrit sans élaguer (utilisé pour la pierre tombale). */
async function savePostQuiet(post: ContentPost): Promise<void> {
  await putData(fileKey(post.id, nextVersion()), Buffer.from(JSON.stringify(post), "utf-8"), "application/json");
}
