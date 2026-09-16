import { loadBrand } from "@/lib/studio/brand";
import { readInspirationFile } from "@/lib/studio/inspirations";

export const runtime = "nodejs";

/** GET /api/studio/content/inspirations/file/<name>?brand=slug — sert un visuel d'inspiration. */
export async function GET(req: Request, { params }: { params: { name: string } }) {
  const slug = new URL(req.url).searchParams.get("brand") || undefined;
  const brand = await loadBrand(slug);
  if (!brand) return new Response("Not found", { status: 404 });
  const f = await readInspirationFile(brand, decodeURIComponent(params.name));
  if (!f) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(f.buf), { headers: { "Content-Type": f.mime, "Cache-Control": "private, max-age=3600" } });
}
