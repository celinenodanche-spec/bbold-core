import { loadBrand } from "@/lib/studio/brand";
import { loadStyleProfile, listInspirations, MIN_INSPIRATIONS } from "@/lib/studio/inspirations";
import { STYLES } from "@/lib/studio/styles";
import { aiBackgroundProvider } from "@/lib/studio/render";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/studio/content/brand → marque active, profil de style, inspirations, styles éditoriaux. */
export async function GET() {
  const brand = await loadBrand();
  const provider = aiBackgroundProvider();
  const providerFast = aiBackgroundProvider(true);
  if (!brand) return Response.json({ brand: null, profile: null, inspirations: [], styles: STYLES, minInspirations: MIN_INSPIRATIONS, aiBackground: !!provider, aiProvider: provider?.label ?? null, aiProviderBatch: providerFast?.label ?? null });
  const [profile, inspirations] = await Promise.all([loadStyleProfile(brand), listInspirations(brand)]);
  return Response.json({
    brand: { slug: brand.slug, name: brand.name, handle: brand.handle, palette: brand.palette, fonts: brand.fonts, isTemplate: brand.isTemplate },
    profile, inspirations, styles: STYLES, minInspirations: MIN_INSPIRATIONS,
    aiBackground: !!provider, aiProvider: provider?.label ?? null, aiProviderBatch: providerFast?.label ?? null,
  });
}
