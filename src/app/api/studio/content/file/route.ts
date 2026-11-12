import { getData, getVisual, mimeOf } from "@/lib/studio/storage";

export const runtime = "nodejs";

/**
 * GET /api/studio/content/file?key=content-out/<nom>.png
 * Sert un fichier du stockage quand le bucket S3 n'a pas d'URL publique.
 * Protégé par le middleware (code d'accès), comme toutes les routes /api.
 * Seuls les visuels rendus et les images d'inspiration sont servis : jamais les JSON internes.
 */
export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get("key") || "";
  if (!key || key.includes("..") || key.startsWith("/") || key.includes("\\")) return new Response("Bad request", { status: 400 });
  if (!/\.(png|jpe?g|webp)$/i.test(key)) return new Response("Not found", { status: 404 });
  const buf = key.startsWith("content-out/")
    ? await getVisual(key.slice("content-out/".length))
    : /^[a-z0-9._-]+\/inspirations\/[^/]+$/i.test(key) ? await getData(key) : null;
  if (!buf) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(buf), { headers: { "Content-Type": mimeOf(key), "Cache-Control": "private, max-age=3600" } });
}
