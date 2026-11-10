import { getPost, updatePost, type ContentPost } from "@/lib/studio/store";
import { loadBrand } from "@/lib/studio/brand";
import { loadStyleProfile } from "@/lib/studio/inspirations";
import { renderVisuals } from "@/lib/studio/render";
import type { Slide, Format, Platform } from "@/lib/studio/generate";

export const runtime = "nodejs";
export const maxDuration = 300;

interface Fallback { platform?: string; format?: string; idea?: string; style?: string; brand?: string; slides?: Slide[]; cta?: string; headline?: string; body?: string; post?: ContentPost }

/** Formats qui portent un visuel, par réseau. Les autres (tweet, thread, post texte LinkedIn) sont du texte seul. */
const VISUAL_FORMATS: Record<Platform, Format[]> = {
  instagram: ["post", "carousel", "story"],
  linkedin: ["image", "carousel"],
  twitter: ["image"],
};

/**
 * POST { id, fast?, fallback? } → rend les visuels de marque (HTML → PNG) et
 * renvoie DIRECTEMENT les images. Le `fallback` (données du navigateur, dont le
 * post complet) sert si le post n'est pas encore relisible depuis le stockage.
 */
export async function POST(req: Request) {
  try {
    const { id, fast, fallback } = (await req.json()) as { id?: string; fast?: boolean; fallback?: Fallback };
    if (!id) return Response.json({ error: "id requis" }, { status: 400 });
    const fb = fallback ?? {};
    const base = fb.post && fb.post.id === id ? fb.post : null;
    // Le post renvoyé par le navigateur suffit pour rendre : on ne relit le stockage que s'il manque.
    const post = base ?? (await getPost(id));

    const platform = (post?.platform ?? fb.platform ?? "instagram") as Platform;
    const format = (post?.format ?? fb.format) as Format | undefined;
    const idea = post?.idea ?? fb.idea ?? "";
    const style = post?.style ?? fb.style;
    const brandSlug = post?.brandSlug ?? fb.brand;
    const slidesSrc = post?.result.slides ?? fb.slides;
    const cta = post?.result.cta ?? fb.cta;
    const headline = post?.result.headline ?? fb.headline;
    const body = post?.result.body ?? fb.body;

    if (!format) return Response.json({ error: "Post introuvable" }, { status: 404 });
    if (!VISUAL_FORMATS[platform]?.includes(format)) return Response.json({ error: "Ce format est du texte seul : il n'a pas de visuel." }, { status: 400 });
    const brand = await loadBrand(brandSlug);
    if (!brand) return Response.json({ error: "Marque introuvable." }, { status: 400 });
    // Hors Instagram, `body` est le texte complet du post : il n'a rien à faire sur le visuel, seule l'accroche y va.
    const single = headline ? [{ title: headline, body: platform === "instagram" ? body ?? "" : "" }] : [];
    const slides = (slidesSrc?.length ? slidesSrc : single) as Slide[];
    if (!slides.length) return Response.json({ error: "Ce post n'a pas de texte à mettre en visuel." }, { status: 400 });

    const profile = await loadStyleProfile(brand);
    const images = await renderVisuals({ postId: id, platform, format, idea, slides, cta, brand, profile, styleId: style, fast: !!fast });
    // Sauvegarde pour la bibliothèque et l'export. Si elle échoue, on le DIT : sinon le ZIP sortirait sans images, sans explication.
    let saved = true;
    try { saved = !!(await updatePost(id, { visuals: { jobs: [], images, done: true } }, base)); } catch { saved = false; }
    return Response.json({ success: true, count: images.length, images, done: true, saved });
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
