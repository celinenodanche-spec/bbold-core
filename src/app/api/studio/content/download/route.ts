import { launchBrowser } from "@/lib/studio/browser";
import { readBytes } from "@/lib/studio/storage";
import { getPost } from "@/lib/studio/store";

export const runtime = "nodejs";
export const maxDuration = 90;

/** POST /api/studio/content/download { id } → PDF des visuels rendus (4:5 ou 9:16). */
export async function POST(req: Request) {
  try {
    const { id } = (await req.json()) as { id?: string };
    if (!id) return Response.json({ error: "id requis" }, { status: 400 });
    const post = await getPost(id);
    if (!post) return Response.json({ error: "Post introuvable" }, { status: 404 });
    const imgs = (post.visuals?.images ?? []).filter((x): x is string => !!x);
    if (!imgs.length) return Response.json({ error: "Génère d'abord les visuels." }, { status: 400 });

    const pages: string[] = [];
    for (const u of imgs) {
      const buf = await readBytes(u);
      pages.push(`data:image/png;base64,${buf.toString("base64")}`);
    }
    const { w, h } = post.format === "story" ? { w: 1080, h: 1920 } : { w: 1080, h: 1350 };
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>@page{size:${w}px ${h}px;margin:0}*{margin:0;padding:0}img{display:block;width:${w}px;height:${h}px;page-break-after:always}</style></head><body>${pages.map((p) => `<img src="${p}"/>`).join("")}</body></html>`;
    const browser = await launchBrowser();
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 30000 });
      await new Promise((r) => setTimeout(r, 300));
      const pdf = Buffer.from(await page.pdf({ width: `${w}px`, height: `${h}px`, printBackground: true }));
      return new Response(new Uint8Array(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="bbold-${post.format}-${post.id}.pdf"` } });
    } finally { await browser.close(); }
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}
