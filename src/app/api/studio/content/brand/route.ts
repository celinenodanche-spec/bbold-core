import { loadBrand, listBrands, BBOLD_BRAND, type Brand } from "@/lib/studio/brand";
import { loadStyleProfile, listInspirations, MIN_INSPIRATIONS } from "@/lib/studio/inspirations";
import { STYLES } from "@/lib/studio/styles";
import { aiBackgroundProvider } from "@/lib/studio/providers";
import { storageStatus } from "@/lib/studio/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const info = (b: Brand) => ({ slug: b.slug, name: b.name, handle: b.handle, palette: b.palette, fonts: b.fonts, markdown: b.markdown, isTemplate: b.isTemplate });

/** GET /api/studio/content/brand?brand=slug → marque active + liste des marques + profil/inspirations de l'active. */
export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get("brand");
  const provider = aiBackgroundProvider();
  const providerFast = aiBackgroundProvider(true);
  let brands: Brand[] = [];
  try { brands = await listBrands(); } catch { brands = []; }
  const active = (slug ? await loadBrand(slug) : null) ?? brands[0] ?? BBOLD_BRAND;
  if (!brands.length) brands = [active];
  let profile = null, inspirations: unknown[] = [];
  if (active) {
    try { profile = await loadStyleProfile(active); } catch { profile = null; }
    try { inspirations = await listInspirations(active); } catch { inspirations = []; }
  }
  return Response.json({
    brand: active ? info(active) : null,
    brands: brands.map(info),
    profile, inspirations, styles: STYLES, minInspirations: MIN_INSPIRATIONS,
    aiBackground: !!provider, aiProvider: provider?.label ?? null, aiProviderBatch: providerFast?.label ?? null,
    storage: storageStatus(),
  });
}
