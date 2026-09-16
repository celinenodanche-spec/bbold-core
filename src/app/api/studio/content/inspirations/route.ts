import { loadBrand } from "@/lib/studio/brand";
import { addInspiration, listInspirations, removeInspiration, loadStyleProfile, clearStyleProfile } from "@/lib/studio/inspirations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const slugOf = (req: Request) => new URL(req.url).searchParams.get("brand") || undefined;

/** GET ?brand=slug → inspirations + profil de la marque. */
export async function GET(req: Request) {
  const brand = await loadBrand(slugOf(req));
  if (!brand) return Response.json({ error: "Aucune marque." }, { status: 404 });
  return Response.json({ inspirations: await listInspirations(brand), profile: await loadStyleProfile(brand) });
}

/** POST multipart (files[], brand) → ajoute des visuels. Le profil est invalidé. */
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const slug = (form.get("brand") as string) || slugOf(req);
    const brand = await loadBrand(slug);
    if (!brand) return Response.json({ error: "Aucune marque." }, { status: 404 });
    const files = form.getAll("files").filter((f): f is File => f instanceof File);
    if (!files.length) return Response.json({ error: "Aucun fichier reçu." }, { status: 400 });
    for (const f of files) await addInspiration(brand, f);
    await clearStyleProfile(brand);
    return Response.json({ success: true, inspirations: await listInspirations(brand), profile: null });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}

/** DELETE ?name=…&brand=slug → retire un visuel. */
export async function DELETE(req: Request) {
  const brand = await loadBrand(slugOf(req));
  if (!brand) return Response.json({ error: "Aucune marque." }, { status: 404 });
  const name = new URL(req.url).searchParams.get("name");
  if (!name) return Response.json({ error: "name requis" }, { status: 400 });
  await removeInspiration(brand, name);
  await clearStyleProfile(brand);
  return Response.json({ success: true, inspirations: await listInspirations(brand), profile: null });
}
