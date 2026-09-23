import { getPost, updatePost } from "@/lib/studio/store";
import { loadBrand } from "@/lib/studio/brand";
import { loadStyleProfile } from "@/lib/studio/inspirations";
import { renderInstagram } from "@/lib/studio/render";
import type { Slide } from "@/lib/studio/generate";

export const runtime = "nodejs";
export const maxDuration = 300;

interface Fallback { platform?: string; format?: string; idea?: string; style?: string; brand?: string; slides?: Slide[]; cta?: string; headline?: string; body?: string }

/**
 * POST { id, fast?, fallback? } → rend les visuels Instagram (HTML → PNG) et
 * renvoie DIRECTEMENT les images. Le `fallback` (données du client) sert si le
 * post n'est pas encore lisible depuis le stockage (indexation Blob différée).
 */
export async function POST(req: Request) {
  try {
    const { id, fast, fallback } = (await req.json()) as { id?: string; fast?: boolean; fallback?: Fallback };
    if (!id) return Response.json({ error: "id requis" }, { status: 400 });
    const post = await getPost(id); // avec retry interne
    const fb = fallback ?? {};

    const platform = post?.platform ?? fb.platform ?? "instagram";
    const format = post?.format ?? fb.format;
    const idea = post?.idea ?? fb.idea ?? "";
    const style = post?.style ?? fb.style;
    const brandSlug = post?.brandSlug ?? fb.brand;
    const slidesSrc = post?.result.slides ?? fb.slides;
    const cta = post?.result.cta ?? fb.cta;
    const headline = post?.result.headline ?? fb.headline;
    const body = post?.result.body ?? fb.body;

    if (!format) return Response.json({ error: "Post introuvable" }, { status: 404 });
    if (platform !== "instagram") return Response.json({ error: "Le rendu des visuels de marque est disponible pour Instagram." }, { status: 400 });
    const brand = await loadBrand(brandSlug);
    if (!brand) return Response.json({ error: "Marque introuvable." }, { status: 400 });
    const slides = (slidesSrc?.length ? slidesSrc : (headline ? [{ title: headline, body: body ?? "" }] : [])) as Slide[];
    if (!slides.length) return Response.json({ error: "Ce post n'a pas de texte à mettre en visuel." }, { status: 400 });

    const profile = await loadStyleProfile(brand);
    const images = await renderInstagram({ postId: id, format: format as import("@/lib/studio/generate").Format, idea, slides, cta, brand, profile, styleId: style, fast: !!fast });
    // sauvegarde best-effort (pour la bibliothèque) — n'échoue jamais le rendu
    try { await updatePost(id, { visuals: { jobs: [], images, done: true } }); } catch { /* stockage lent : on renvoie quand même les images */ }
    return Response.json({ success: true, count: images.length, images, done: true });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}

/** GET ?id=... — état des visuels (poll de secours). */
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return Response.json({ error: "id requis" }, { status: 400 });
  const post = await getPost(id);
  if (!post?.visuals) return Response.json({ error: "Aucune génération." }, { status: 404 });
  return Response.json({ images: post.visuals.images, done: post.visuals.done });
}
