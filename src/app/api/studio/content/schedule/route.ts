import { updatePost, deletePost } from "@/lib/studio/store";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { id, at } = (await req.json()) as { id?: string; at?: string };
    if (!id) return Response.json({ error: "id requis" }, { status: 400 });
    const p = await updatePost(id, at ? { status: "scheduled", schedule: { at } } : { status: "draft", schedule: null });
    if (!p) return Response.json({ error: "Post introuvable" }, { status: 404 });
    return Response.json({ success: true, post: p });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}
export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return Response.json({ error: "id requis" }, { status: 400 });
  await deletePost(id);
  return Response.json({ success: true });
}
