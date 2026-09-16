/**
 * Stockage du studio, à double détente :
 *  - LOCAL (dev) : système de fichiers (public/content-out pour les visuels,
 *    studio-data/ pour les inspirations et le store).
 *  - VERCEL (prod) : Vercel Blob (le disque des fonctions serverless est en
 *    lecture seule et éphémère). Activé dès que BLOB_READ_WRITE_TOKEN est présent
 *    — Vercel l'injecte automatiquement quand un store Blob est lié au projet.
 *
 * Une seule API pour les deux mondes ; le studio ne sait pas où il tourne.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { put, list, del } from "@vercel/blob";

const blobToken = (): string | undefined => process.env.BLOB_READ_WRITE_TOKEN;
export const useBlob = (): boolean => !!blobToken();
export const storageStatus = () => ({ onVercel: !!process.env.VERCEL, blob: useBlob() });

const PUBLIC_DIR = path.join(process.cwd(), "public");
const DATA_DIR = path.join(process.cwd(), "studio-data");
const BLOB_PREFIX = "bbold-studio";

const NO_STORE = "Stockage non configuré sur Vercel : ajoute la variable BLOB_READ_WRITE_TOKEN (Vercel → Storage → ton Blob → connecte le projet), puis redéploie.";
function assertWritable(): void { if (!useBlob() && process.env.VERCEL) throw new Error(NO_STORE); }

const mime = (name: string) => (/\.png$/i.test(name) ? "image/png" : /\.webp$/i.test(name) ? "image/webp" : /\.jpe?g$/i.test(name) ? "image/jpeg" : "application/octet-stream");

/* ─── VISUELS (rendus PNG servis publiquement) ─────────────────────────── */

/** Enregistre un visuel `content-out/<name>` et renvoie son URL affichable. */
export async function putVisual(name: string, buf: Buffer): Promise<string> {
  assertWritable();
  if (useBlob()) {
    const { url } = await put(`${BLOB_PREFIX}/content-out/${name}`, buf, { access: "public", token: blobToken(), contentType: "image/png", addRandomSuffix: false, allowOverwrite: true });
    return url;
  }
  const abs = path.join(PUBLIC_DIR, "content-out", name);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, buf);
  return `/content-out/${name}?v=${Date.now()}`;
}

/* ─── DONNÉES (inspirations, style.json, store.json) ───────────────────── */

export async function putData(key: string, buf: Buffer, contentType: string): Promise<string> {
  assertWritable();
  if (useBlob()) {
    const { url } = await put(`${BLOB_PREFIX}/data/${key}`, buf, { access: "public", token: blobToken(), contentType, addRandomSuffix: false, allowOverwrite: true });
    return url;
  }
  const abs = path.join(DATA_DIR, key);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, buf);
  return abs;
}

export async function getData(key: string): Promise<Buffer | null> {
  if (useBlob()) {
    const { blobs } = await list({ prefix: `${BLOB_PREFIX}/data/${key}`, token: blobToken(), limit: 1 });
    const hit = blobs.find((b) => b.pathname === `${BLOB_PREFIX}/data/${key}`) ?? blobs[0];
    if (!hit) return null;
    const r = await fetch(hit.url, { cache: "no-store" });
    return r.ok ? Buffer.from(await r.arrayBuffer()) : null;
  }
  try { return await fs.readFile(path.join(DATA_DIR, key)); } catch { return null; }
}

export interface DataEntry { name: string; url: string; size: number; addedAt: string }

/** Liste les fichiers sous `prefix/` (ex. "inspirations"). */
export async function listData(prefix: string): Promise<DataEntry[]> {
  if (useBlob()) {
    const { blobs } = await list({ prefix: `${BLOB_PREFIX}/data/${prefix}/`, token: blobToken() });
    return blobs.map((b) => ({ name: b.pathname.split("/").pop() || b.pathname, url: b.url, size: b.size, addedAt: (b.uploadedAt instanceof Date ? b.uploadedAt : new Date(b.uploadedAt)).toISOString() }));
  }
  const dir = path.join(DATA_DIR, prefix);
  let names: string[] = [];
  try { names = await fs.readdir(dir); } catch { return []; }
  const out: DataEntry[] = [];
  for (const n of names) {
    const st = await fs.stat(path.join(dir, n));
    if (st.isFile()) out.push({ name: n, url: "", size: st.size, addedAt: st.mtime.toISOString() });
  }
  return out;
}

export async function delData(key: string): Promise<void> {
  if (useBlob()) {
    const { blobs } = await list({ prefix: `${BLOB_PREFIX}/data/${key}`, token: blobToken(), limit: 1 });
    const hit = blobs.find((b) => b.pathname === `${BLOB_PREFIX}/data/${key}`);
    if (hit) await del(hit.url, { token: blobToken() });
    return;
  }
  await fs.rm(path.join(DATA_DIR, key), { force: true });
}

/* ─── LECTURE générique (URL http ou chemin local) ─────────────────────── */

export async function readBytes(urlOrPath: string): Promise<Buffer> {
  const clean = urlOrPath.split("?")[0];
  if (/^https?:\/\//.test(clean)) {
    const r = await fetch(clean, { cache: "no-store" });
    if (!r.ok) throw new Error(`Lecture ${clean} : HTTP ${r.status}`);
    return Buffer.from(await r.arrayBuffer());
  }
  if (clean.startsWith("/content-out/")) return fs.readFile(path.join(PUBLIC_DIR, clean.replace(/^\//, "")));
  return fs.readFile(clean);
}

export const mimeOf = mime;
