import { loadBrand } from "@/lib/studio/brand";
import { readInspirationFile } from "@/lib/studio/inspirations";

export const runtime = "nodejs";

/** GET /api/studio/content/inspirations/file/<name> — sert le visuel d'inspiration. */
export async function GET(_req: Request, { params }: { params: { name: string } }) {
  const brand = await loadBrand();
  if (!brand) return new Response("Not found", { status: 404 });
  const f = await readInspirationFile(brand, decodeURIComponent(params.name));
  if (!f) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(f.buf), { headers: { "Content-Type": f.mime, "Cache-Control": "private, max-age=3600" } });
}
