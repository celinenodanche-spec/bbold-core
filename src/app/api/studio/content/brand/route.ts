import { loadBrand, listBrands, BBOLD_BRAND, type Brand } from "@/lib/studio/brand";
import { loadStyleProfile, listInspirations, MIN_INSPIRATIONS } from "@/lib/studio/inspirations";
import { STYLES } from "@/lib/studio/styles";
import { aiBackgroundProvider } from "@/lib/studio/providers";
import { storageStatus } from "@/lib/studio/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const info = (b: Brand) => ({ slug: b.slug, name: b.name, handle: b.handle, palette: b.palette, fonts: b.fonts, markdown: b.markdown, isTemplate: b.isTemplate });

/** GET ?brand=slug → marque active + liste. Ne renvoie JAMAIS une marque vide (filet B.BOLD). */
export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get("brand");
  let provider = null, providerFast = null;
  try { provider = aiBackgroundProvider(); providerFast = aiBackgroundProvider(true); } catch { /* */ }
  const base = { styles: STYLES, minInspirations: MIN_INSPIRATIONS, aiBackground: !!provider, aiProvider: provider?.label ?? null, aiProviderBatch: providerFast?.label ?? null, storage: storageStatus() };
  try {
    let brands: Brand[] = [];
    try { brands = await listBrands(); } catch { brands = []; }
    let active: Brand | null = null;
    if (slug) { try { active = await loadBrand(slug); } catch { active = null; } }
    if (!active) active = brands[0] ?? BBOLD_BRAND;
    if (!brands.length) brands = [active];
    let profile = null, inspirations: unknown[] = [];
    try { profile = await loadStyleProfile(active); } catch { profile = null; }
    try { inspirations = await listInspirations(active); } catch { inspirations = []; }
    return Response.json({ brand: info(active), brands: brands.map(info), profile, inspirations, ...base });
  } catch {
    // filet ultime : le studio doit toujours avoir une marque
    return Response.json({ brand: info(BBOLD_BRAND), brands: [info(BBOLD_BRAND)], profile: null, inspirations: [], ...base });
  }
}
