import { getPost, updatePost } from "@/lib/studio/store";
import { loadBrand } from "@/lib/studio/brand";
import { loadStyleProfile } from "@/lib/studio/inspirations";
import { renderInstagram } from "@/lib/studio/render";

export const runtime = "nodejs";
export const maxDuration = 300;

/** POST /api/studio/content/visuals { id, fast? } → rend les visuels Instagram (HTML → PNG). */
export async function POST(req: Request) {
  try {
    const { id, fast } = (await req.json()) as { id?: string; fast?: boolean };
    if (!id) return Response.json({ error: "id requis" }, { status: 400 });
    const post = await getPost(id);
    if (!post) return Response.json({ error: "Post introuvable" }, { status: 404 });
    if (post.platform !== "instagram")
      return Response.json({ error: "Le rendu des visuels de marque est disponible pour Instagram." }, { status: 400 });

    const brand = await loadBrand();
    if (!brand) return Response.json({ error: "Marque introuvable." }, { status: 400 });
    const slides = post.result.slides ?? (post.result.headline ? [{ title: post.result.headline, body: post.result.body ?? "" }] : []);
    if (!slides.length) return Response.json({ error: "Ce post n'a pas de texte à mettre en visuel." }, { status: 400 });
    const profile = await loadStyleProfile(brand);
    const images = await renderInstagram({ postId: id, format: post.format, idea: post.idea, slides, cta: post.result.cta, brand, profile, styleId: post.style, fast: !!fast });
    await updatePost(id, { visuals: { jobs: [], images, done: true } });
    return Response.json({ success: true, count: images.length });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}

/** GET /api/studio/content/visuals?id=... — état des visuels. */
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return Response.json({ error: "id requis" }, { status: 400 });
  const post = await getPost(id);
  if (!post?.visuals) return Response.json({ error: "Aucune génération." }, { status: 404 });
  return Response.json({ images: post.visuals.images, done: post.visuals.done });
}
