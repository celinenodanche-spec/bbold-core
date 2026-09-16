import { loadBrand } from "@/lib/studio/brand";
import { analyzeInspirations } from "@/lib/studio/inspirations";

export const runtime = "nodejs";
export const maxDuration = 90;
export const dynamic = "force-dynamic";

/** POST → Léa analyse les visuels d'inspiration (≥ 3) et sauvegarde le profil de style. */
export async function POST(req: Request) {
  try {
    const brand = await loadBrand(new URL(req.url).searchParams.get("brand") || undefined);
    if (!brand) return Response.json({ error: "Aucune marque dans clients/." }, { status: 404 });
    const profile = await analyzeInspirations(brand);
    return Response.json({ success: true, profile });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}
