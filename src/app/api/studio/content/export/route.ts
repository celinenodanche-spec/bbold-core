import { getPost, type ContentPost } from "@/lib/studio/store";
import { buildZip, type ZipEntry } from "@/lib/studio/zip";
import { loadBrand } from "@/lib/studio/brand";
import { readBytes } from "@/lib/studio/storage";

export const runtime = "nodejs";
export const maxDuration = 60;

const slug = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "post";
const FORMAT_LABEL: Record<string, string> = { post: "post-4x5", carousel: "carrousel-4x5", story: "story-9x16", image: "post-visuel", tweet: "tweet", thread: "thread" };

/** Texte prêt à coller sur Instagram / LinkedIn / X. */
function legende(p: ContentPost): string {
  const r = p.result;
  const lines: string[] = [];
  lines.push(`# ${p.idea}`, `Réseau : ${p.platform} · Format : ${p.format}${p.style ? ` · Style : ${p.style}` : ""}`, "");
  const text = r.caption ?? r.body ?? r.tweets?.join("\n\n") ?? "";
  if (text) lines.push(text, "");
  if (r.hashtags?.length) lines.push(r.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" "), "");
  if (r.cta) lines.push(`CTA visuel : ${r.cta}`, "");
  if (r.slides?.length) {
    lines.push("--- Texte des visuels ---");
    r.slides.forEach((s, i) => lines.push(`${i + 1}. ${s.title}${s.body ? ` — ${s.body}` : ""}`));
  }
  return lines.join("\n");
}

async function entriesFor(p: ContentPost, prefix: string): Promise<ZipEntry[]> {
  const out: ZipEntry[] = [];
  const imgs = (p.visuals?.images ?? []).filter((x): x is string => !!x);
  let n = 0;
  for (const u of imgs) {
    try {
      const data = await readBytes(u);
      n += 1;
      out.push({ name: `${prefix}${String(n).padStart(2, "0")}.png`, data });
    } catch { /* image manquante : on continue */ }
  }
  out.push({ name: `${prefix}legende.txt`, data: Buffer.from(legende(p), "utf-8") });
  return out;
}

/** GET /api/content/export?ids=a,b,c → ZIP (PNG + légende par post). Un seul id → fichiers à la racine. */
export async function GET(req: Request) {
  try {
    const ids = (new URL(req.url).searchParams.get("ids") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    if (!ids.length) return Response.json({ error: "ids requis" }, { status: 400 });
    const posts = (await Promise.all(ids.map(getPost))).filter((p): p is ContentPost => !!p);
    if (!posts.length) return Response.json({ error: "Aucun post trouvé" }, { status: 404 });
    const brand = await loadBrand();
    const entries: ZipEntry[] = [];
    if (posts.length === 1) {
      entries.push(...(await entriesFor(posts[0], "")));
    } else {
      for (let i = 0; i < posts.length; i++) {
        const p = posts[i];
        entries.push(...(await entriesFor(p, `${String(i + 1).padStart(2, "0")}-${FORMAT_LABEL[p.format] ?? p.format}-${slug(p.idea)}/`)));
      }
    }
    const single = posts.length === 1 ? posts[0] : null;
    const name = single
      ? `${brand?.slug ?? "contenu"}-${FORMAT_LABEL[single.format] ?? single.format}-${slug(single.idea)}.zip`
      : `${brand?.slug ?? "contenu"}-serie-${new Date().toISOString().slice(0, 10)}-${posts.length}-posts.zip`;
    return new Response(new Uint8Array(buildZip(entries)), {
      headers: { "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="${name}"` },
    });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}
