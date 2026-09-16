import { loadBrand } from "@/lib/studio/brand";
import { loadStyleProfile, listInspirations, MIN_INSPIRATIONS } from "@/lib/studio/inspirations";
import { STYLES } from "@/lib/studio/styles";
import { aiBackgroundProvider } from "@/lib/studio/providers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/studio/content/brand → marque active, profil, inspirations, styles. Ne plante jamais. */
export async function GET() {
  const brand = await loadBrand();
  const provider = aiBackgroundProvider();
  const providerFast = aiBackgroundProvider(true);
  if (!brand) return Response.json({ brand: null, profile: null, inspirations: [], styles: STYLES, minInspirations: MIN_INSPIRATIONS, aiBackground: !!provider, aiProvider: provider?.label ?? null, aiProviderBatch: providerFast?.label ?? null });
  // Les lectures de stockage (Blob) ne doivent JAMAIS faire échouer la marque : on isole leurs erreurs.
  let profile = null; try { profile = await loadStyleProfile(brand); } catch { profile = null; }
  let inspirations: unknown[] = []; try { inspirations = await listInspirations(brand); } catch { inspirations = []; }
  return Response.json({
    brand: { slug: brand.slug, name: brand.name, handle: brand.handle, palette: brand.palette, fonts: brand.fonts, isTemplate: brand.isTemplate },
    profile, inspirations, styles: STYLES, minInspirations: MIN_INSPIRATIONS,
    aiBackground: !!provider, aiProvider: provider?.label ?? null, aiProviderBatch: providerFast?.label ?? null,
  });
}
