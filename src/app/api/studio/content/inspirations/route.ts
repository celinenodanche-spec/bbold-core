import { loadBrand } from "@/lib/studio/brand";
import { addInspiration, listInspirations, removeInspiration, loadStyleProfile, clearStyleProfile } from "@/lib/studio/inspirations";

export const runtime = "nodejs";

/** GET /api/content/inspirations → liste + profil. */
export async function GET() {
  const brand = await loadBrand();
  if (!brand) return Response.json({ error: "Aucune marque dans clients/." }, { status: 404 });
  return Response.json({ inspirations: await listInspirations(brand), profile: await loadStyleProfile(brand) });
}

/** POST multipart (files[]) → ajoute des visuels d'inspiration. Le profil précédent est invalidé. */
export async function POST(req: Request) {
  try {
    const brand = await loadBrand();
    if (!brand) return Response.json({ error: "Aucune marque dans clients/." }, { status: 404 });
    const form = await req.formData();
    const files = form.getAll("files").filter((f): f is File => f instanceof File);
    if (!files.length) return Response.json({ error: "Aucun fichier reçu." }, { status: 400 });
    for (const f of files) await addInspiration(brand, f);
    await clearStyleProfile(brand); // le style devra être ré-analysé avec les nouveaux visuels
    return Response.json({ success: true, inspirations: await listInspirations(brand), profile: null });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}

/** DELETE ?name=… → retire un visuel. */
export async function DELETE(req: Request) {
  const brand = await loadBrand();
  if (!brand) return Response.json({ error: "Aucune marque dans clients/." }, { status: 404 });
  const name = new URL(req.url).searchParams.get("name");
  if (!name) return Response.json({ error: "name requis" }, { status: 400 });
  await removeInspiration(brand, name);
  await clearStyleProfile(brand);
  return Response.json({ success: true, inspirations: await listInspirations(brand), profile: null });
}
