/**
 * Stockage du studio. Trois moteurs, une seule API, choisis automatiquement :
 *
 *  1. S3 (recommandé en prod) : tout stockage compatible S3.
 *     Cloudflare R2, Backblaze B2, Scaleway, AWS S3, ou MinIO sur un VPS Hostinger.
 *     Activé dès que S3_BUCKET + S3_ACCESS_KEY_ID + S3_SECRET_ACCESS_KEY sont présents.
 *  2. VERCEL BLOB (historique) : activé si BLOB_READ_WRITE_TOKEN est présent
 *     et qu'aucun S3 n'est configuré. Forcer avec STORAGE_DRIVER=blob.
 *  3. LOCAL (dev) : système de fichiers (public/content-out, studio-data/).
 *
 * STORAGE_DRIVER=s3|blob|local force un moteur.
 *
 * Point clé côté coûts : les LECTURES ne listent jamais (GET direct par clé).
 * Sur Vercel Blob, chaque list() est une « opération avancée » facturée,
 * et c'est ce qui épuise le quota gratuit puis suspend le store.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { put, list, del, head, BlobNotFoundError } from "@vercel/blob";
import {
  S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command,
  type ListObjectsV2CommandOutput,
} from "@aws-sdk/client-s3";

/* ─── CONFIG ───────────────────────────────────────────────────────────── */

/** Nettoie une valeur d'env : enlève guillemets et espaces parasites (cause fréquente de jeton invalide). */
const clean = (v?: string): string | undefined => {
  const c = v?.trim().replace(/^["'`]+|["'`]+$/g, "").trim();
  return c || undefined;
};

/** Jeton Blob : d'abord BLOB_READ_WRITE_TOKEN, sinon n'importe quelle variable finissant par _READ_WRITE_TOKEN (Vercel préfixe le nom quand il y a plusieurs stores). */
const blobToken = (): string | undefined => {
  const direct = clean(process.env.BLOB_READ_WRITE_TOKEN);
  if (direct) return direct;
  for (const [k, v] of Object.entries(process.env)) {
    if (/_READ_WRITE_TOKEN$/.test(k)) { const c = clean(v); if (c) return c; }
  }
  return undefined;
};

interface S3Conf { bucket: string; accessKeyId: string; secretAccessKey: string; endpoint?: string; region: string; publicUrl?: string; forcePathStyle: boolean }

const s3Conf = (): S3Conf | null => {
  const bucket = clean(process.env.S3_BUCKET);
  const accessKeyId = clean(process.env.S3_ACCESS_KEY_ID);
  const secretAccessKey = clean(process.env.S3_SECRET_ACCESS_KEY);
  if (!bucket || !accessKeyId || !secretAccessKey) return null;
  const endpoint = clean(process.env.S3_ENDPOINT)?.replace(/\/+$/, "");
  const fps = clean(process.env.S3_FORCE_PATH_STYLE);
  return {
    bucket, accessKeyId, secretAccessKey, endpoint,
    region: clean(process.env.S3_REGION) || "auto",
    publicUrl: clean(process.env.S3_PUBLIC_URL)?.replace(/\/+$/, ""),
    // MinIO (VPS Hostinger) exige le path-style ; R2/B2 l'acceptent. AWS natif (pas d'endpoint) n'en a pas besoin.
    forcePathStyle: fps ? fps === "true" || fps === "1" : !!endpoint,
  };
};

export type StorageDriver = "s3" | "blob" | "local";

export function storageDriver(): StorageDriver {
  const forced = clean(process.env.STORAGE_DRIVER)?.toLowerCase();
  if (forced === "s3" || forced === "blob" || forced === "local") return forced;
  if (s3Conf()) return "s3";
  if (blobToken()) return "blob";
  return "local";
}

/** Vrai quand les données vivent hors du disque local (S3 ou Blob). */
export const useRemote = (): boolean => storageDriver() !== "local";
/** @deprecated garde la compatibilité : préférer useRemote(). */
export const useBlob = useRemote;
/** Vrai si les fichiers ont une URL publique directe (sinon passer par une route proxy). */
export const hasPublicUrls = (): boolean => {
  const d = storageDriver();
  return d === "blob" || (d === "s3" && !!s3Conf()?.publicUrl);
};

export const storageStatus = () => {
  const driver = storageDriver();
  return { onVercel: !!process.env.VERCEL, driver, blob: driver !== "local", publicUrls: hasPublicUrls() };
};

const PUBLIC_DIR = path.join(process.cwd(), "public");
const DATA_DIR = path.join(process.cwd(), "studio-data");
const PREFIX = "bbold-studio";

const NO_STORE = "Stockage non configuré sur Vercel : ajoute S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_ENDPOINT et S3_PUBLIC_URL (Cloudflare R2 conseillé), puis redéploie.";

function assertWritable(): void {
  const d = storageDriver();
  if (d === "local" && process.env.VERCEL) throw new Error(NO_STORE);
  if (d === "s3" && !s3Conf()) throw new Error("STORAGE_DRIVER=s3 mais S3_BUCKET / S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY manquent.");
  if (d === "blob" && !blobToken()) throw new Error("STORAGE_DRIVER=blob mais BLOB_READ_WRITE_TOKEN manque.");
}

const mime = (name: string) => (/\.png$/i.test(name) ? "image/png" : /\.webp$/i.test(name) ? "image/webp" : /\.jpe?g$/i.test(name) ? "image/jpeg" : /\.json$/i.test(name) ? "application/json" : "application/octet-stream");

/** Traduit les erreurs fournisseur en message lisible dans le studio. */
function explain(e: unknown, what: string): Error {
  const msg = e instanceof Error ? `${e.name} ${e.message}` : String(e);
  if (/suspended/i.test(msg)) return new Error(`Vercel Blob suspendu (quota gratuit dépassé). Configure un stockage S3 (Cloudflare R2) : voir docs/STOCKAGE.md. [${what}]`);
  if (/AccessDenied|InvalidAccessKeyId|SignatureDoesNotMatch|403/i.test(msg)) return new Error(`Stockage refusé : vérifie S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY et les droits du jeton sur le bucket. [${what}]`);
  if (/NoSuchBucket/i.test(msg)) return new Error(`Bucket introuvable : vérifie S3_BUCKET et S3_ENDPOINT. [${what}]`);
  return new Error(`Stockage (${what}) : ${e instanceof Error ? e.message : msg}`);
}

/* ─── S3 ───────────────────────────────────────────────────────────────── */

let _s3: { client: S3Client; key: string } | null = null;
function s3(): { client: S3Client; conf: S3Conf } {
  const conf = s3Conf();
  if (!conf) throw new Error("S3 non configuré.");
  const key = `${conf.endpoint}|${conf.region}|${conf.accessKeyId}|${conf.forcePathStyle}`;
  if (!_s3 || _s3.key !== key) {
    _s3 = {
      key,
      client: new S3Client({
        region: conf.region,
        endpoint: conf.endpoint,
        forcePathStyle: conf.forcePathStyle,
        credentials: { accessKeyId: conf.accessKeyId, secretAccessKey: conf.secretAccessKey },
        // R2 / MinIO ne gèrent pas toujours les checksums CRC32 ajoutés par défaut depuis le SDK 3.729.
        requestChecksumCalculation: "WHEN_REQUIRED",
        responseChecksumValidation: "WHEN_REQUIRED",
      }),
    };
  }
  return { client: _s3.client, conf };
}

const encodeKey = (k: string) => k.split("/").map(encodeURIComponent).join("/");
const s3PublicUrl = (key: string): string => {
  const { conf } = s3();
  return conf.publicUrl ? `${conf.publicUrl}/${encodeKey(key)}` : "";
};

async function s3Put(key: string, buf: Buffer, contentType: string, cacheControl: string): Promise<void> {
  const { client, conf } = s3();
  await client.send(new PutObjectCommand({ Bucket: conf.bucket, Key: key, Body: buf, ContentType: contentType, CacheControl: cacheControl }));
}

async function s3Get(key: string): Promise<Buffer | null> {
  const { client, conf } = s3();
  try {
    const r = await client.send(new GetObjectCommand({ Bucket: conf.bucket, Key: key }));
    if (!r.Body) return null;
    return Buffer.from(await r.Body.transformToByteArray());
  } catch (e) {
    const name = (e as { name?: string; $metadata?: { httpStatusCode?: number } });
    if (name.name === "NoSuchKey" || name.name === "NotFound" || name.$metadata?.httpStatusCode === 404) return null;
    throw e;
  }
}

async function s3List(prefix: string): Promise<{ key: string; size: number; lastModified: Date }[]> {
  const { client, conf } = s3();
  const out: { key: string; size: number; lastModified: Date }[] = [];
  let token: string | undefined;
  do {
    const page: ListObjectsV2CommandOutput = await client.send(new ListObjectsV2Command({ Bucket: conf.bucket, Prefix: prefix, ContinuationToken: token, MaxKeys: 1000 }));
    for (const o of page.Contents ?? []) if (o.Key) out.push({ key: o.Key, size: o.Size ?? 0, lastModified: o.LastModified ?? new Date() });
    token = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (token);
  return out;
}

async function s3Del(key: string): Promise<void> {
  const { client, conf } = s3();
  await client.send(new DeleteObjectCommand({ Bucket: conf.bucket, Key: key }));
}

/* ─── BLOB (lecture sans list : head() = opération simple) ─────────────── */

async function blobGet(pathname: string): Promise<Buffer | null> {
  let url: string;
  try { url = (await head(pathname, { token: blobToken() })).url; } catch (e) {
    if (e instanceof BlobNotFoundError) return null;
    throw e;
  }
  const r = await fetch(`${url}${url.includes("?") ? "&" : "?"}_=${Date.now()}`, { cache: "no-store" });
  return r.ok ? Buffer.from(await r.arrayBuffer()) : null;
}

/* ─── VISUELS (rendus PNG servis publiquement) ─────────────────────────── */

/** Enregistre un visuel `content-out/<name>` et renvoie son URL affichable. */
export async function putVisual(name: string, buf: Buffer): Promise<string> {
  assertWritable();
  const key = `${PREFIX}/content-out/${name}`;
  const d = storageDriver();
  try {
    if (d === "s3") {
      await s3Put(key, buf, "image/png", "public, max-age=30");
      const pub = s3PublicUrl(key);
      // Sans URL publique, on passe par la route proxy (authentifiée par la session du studio).
      return `${pub || `/api/studio/content/file?key=${encodeURIComponent(`content-out/${name}`)}`}${pub ? "?" : "&"}v=${Date.now()}`;
    }
    if (d === "blob") {
      const { url } = await put(key, buf, { access: "public", token: blobToken(), contentType: "image/png", addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: 30 });
      return url;
    }
  } catch (e) { throw explain(e, "enregistrement du visuel"); }
  const abs = path.join(PUBLIC_DIR, "content-out", name);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, buf);
  return `/content-out/${name}?v=${Date.now()}`;
}

/** Lit un visuel par son nom (utilisé par la route proxy quand le bucket n'est pas public). */
export async function getVisual(name: string): Promise<Buffer | null> {
  const key = `${PREFIX}/content-out/${name}`;
  const d = storageDriver();
  if (d === "s3") return s3Get(key);
  if (d === "blob") return blobGet(key);
  try { return await fs.readFile(path.join(PUBLIC_DIR, "content-out", name)); } catch { return null; }
}

/* ─── DONNÉES (inspirations, style.json, store.json) ───────────────────── */

/** Enregistre `key` et renvoie une URL publique (S3/Blob) ou un chemin local. "" si S3 sans URL publique. */
export async function putData(key: string, buf: Buffer, contentType: string): Promise<string> {
  assertWritable();
  const full = `${PREFIX}/data/${key}`;
  const d = storageDriver();
  try {
    if (d === "s3") { await s3Put(full, buf, contentType, "no-cache"); return s3PublicUrl(full); }
    if (d === "blob") {
      const { url } = await put(full, buf, { access: "public", token: blobToken(), contentType, addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: 0 });
      return url;
    }
  } catch (e) { throw explain(e, `écriture ${key}`); }
  const abs = path.join(DATA_DIR, key);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, buf);
  return abs;
}

export async function getData(key: string): Promise<Buffer | null> {
  const full = `${PREFIX}/data/${key}`;
  const d = storageDriver();
  try {
    if (d === "s3") return await s3Get(full);
    if (d === "blob") return await blobGet(full);
  } catch (e) { throw explain(e, `lecture ${key}`); }
  try { return await fs.readFile(path.join(DATA_DIR, key)); } catch { return null; }
}

export interface DataEntry { name: string; url: string; size: number; addedAt: string }

/** Liste les fichiers sous `prefix/` (ex. "inspirations"), éventuellement restreints à ceux dont le nom commence par `startsWith`. Suit la pagination jusqu'au bout. */
export async function listData(prefix: string, startsWith = ""): Promise<DataEntry[]> {
  const d = storageDriver();
  const full = `${PREFIX}/data/${prefix}/${startsWith}`;
  try {
    if (d === "s3") {
      const base = `${PREFIX}/data/${prefix}/`;
      // Uniquement les fichiers directs (pas les sous-dossiers), comme en local.
      return (await s3List(full))
        .filter((o) => !o.key.slice(base.length).includes("/"))
        .map((o) => ({ name: o.key.split("/").pop() || o.key, url: s3PublicUrl(o.key), size: o.size, addedAt: o.lastModified.toISOString() }));
    }
    if (d === "blob") {
      const out: DataEntry[] = [];
      let cursor: string | undefined;
      do {
        const page = await list({ prefix: full, token: blobToken(), cursor, limit: 1000 });
        for (const b of page.blobs) out.push({ name: b.pathname.split("/").pop() || b.pathname, url: b.url, size: b.size, addedAt: (b.uploadedAt instanceof Date ? b.uploadedAt : new Date(b.uploadedAt)).toISOString() });
        cursor = page.hasMore ? page.cursor : undefined;
      } while (cursor);
      return out;
    }
  } catch (e) { throw explain(e, `liste ${prefix}`); }
  const dir = path.join(DATA_DIR, prefix);
  let names: string[] = [];
  try { names = await fs.readdir(dir); } catch { return []; }
  const out: DataEntry[] = [];
  for (const n of names) {
    if (startsWith && !n.startsWith(startsWith)) continue;
    const st = await fs.stat(path.join(dir, n));
    if (st.isFile()) out.push({ name: n, url: "", size: st.size, addedAt: st.mtime.toISOString() });
  }
  return out;
}

/**
 * Lit un fichier déjà listé par `listData`, sans refaire d'appel de listing :
 * en S3 GET direct par clé, en Blob on va droit à son URL, en local on lit `prefix/name`.
 */
export async function readEntry(prefix: string, e: DataEntry): Promise<Buffer | null> {
  const d = storageDriver();
  if (d === "s3") {
    try { return await s3Get(`${PREFIX}/data/${prefix}/${e.name}`); } catch { return null; }
  }
  if (d === "blob") {
    if (!e.url) return null;
    try {
      const r = await fetch(`${e.url}${e.url.includes("?") ? "&" : "?"}_=${Date.now()}`, { cache: "no-store" });
      return r.ok ? Buffer.from(await r.arrayBuffer()) : null;
    } catch { return null; }
  }
  try { return await fs.readFile(path.join(DATA_DIR, prefix, e.name)); } catch { return null; }
}

export async function delData(key: string): Promise<void> {
  const full = `${PREFIX}/data/${key}`;
  const d = storageDriver();
  try {
    if (d === "s3") { await s3Del(full); return; }
    if (d === "blob") {
      // del() accepte directement le pathname : pas de list() (opération avancée) nécessaire.
      await del(full, { token: blobToken() }).catch((e) => { if (!(e instanceof BlobNotFoundError)) throw e; });
      return;
    }
  } catch (e) { throw explain(e, `suppression ${key}`); }
  await fs.rm(path.join(DATA_DIR, key), { force: true });
}

/* ─── LECTURE générique (URL http, route proxy ou chemin local) ────────── */

export async function readBytes(urlOrPath: string): Promise<Buffer> {
  // Route proxy interne : on lit directement le stockage, sans aller-retour HTTP.
  const proxy = urlOrPath.match(/^\/api\/studio\/content\/file\?key=([^&]+)/);
  if (proxy) {
    const key = decodeURIComponent(proxy[1]);
    const buf = key.startsWith("content-out/") ? await getVisual(key.slice("content-out/".length)) : await getData(key);
    if (!buf) throw new Error(`Fichier introuvable : ${key}`);
    return buf;
  }
  const bare = urlOrPath.split("?")[0];
  if (/^https?:\/\//.test(bare)) {
    // Fichier de notre propre bucket : GET signé (marche même si le domaine public a du cache ou est privé).
    const conf = storageDriver() === "s3" ? s3Conf() : null;
    if (conf?.publicUrl && bare.startsWith(conf.publicUrl + "/")) {
      const key = bare.slice(conf.publicUrl.length + 1).split("/").map(decodeURIComponent).join("/");
      const buf = await s3Get(key);
      if (buf) return buf;
    }
    const r = await fetch(bare, { cache: "no-store" });
    if (!r.ok) throw new Error(`Lecture ${bare} : HTTP ${r.status}`);
    return Buffer.from(await r.arrayBuffer());
  }
  if (bare.startsWith("/content-out/")) return fs.readFile(path.join(PUBLIC_DIR, bare.replace(/^\//, "")));
  return fs.readFile(bare);
}

export const mimeOf = mime;
