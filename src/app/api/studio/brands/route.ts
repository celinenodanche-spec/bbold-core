import { listBrands, saveBrand, deleteBrand, getBrand, slugify, type Brand } from "@/lib/studio/brand";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const info = (b: Brand) => ({ slug: b.slug, name: b.name, handle: b.handle, palette: b.palette, fonts: b.fonts, markdown: b.markdown, isTemplate: b.isTemplate });
const HEX = /^#[0-9a-fA-F]{6}$/;
const hex = (v: unknown, fb: string) => (typeof v === "string" && HEX.test(v.trim()) ? v.trim() : fb);
const str = (v: unknown, fb: string) => (typeof v === "string" && v.trim() ? v.trim() : fb);

/** GET → liste des marques. */
export async function GET() {
  try { return Response.json({ brands: (await listBrands()).map(info) }); }
  catch (e) { return Response.json({ error: e instanceof Error ? e.message : "Erreur" }, { status: 500 }); }
}

/** POST → crée ou met à jour une marque. { slug?, name, handle?, palette?, fonts?, markdown? } */
export async function POST(req: Request) {
  try {
    const b = (await req.json()) as Record<string, unknown>;
    const name = str(b.name, "").trim();
    if (!name) return Response.json({ error: "Le nom de la marque est requis." }, { status: 400 });
    const slug = str(b.slug, "") || slugify(name);
    const existing = await getBrand(slug);
    const p = (b.palette ?? {}) as Record<string, unknown>;
    const f = (b.fonts ?? {}) as Record<string, unknown>;
    const brand: Brand = {
      slug, name,
      handle: str(b.handle, existing?.handle ?? "@" + slug.replace(/[^a-z0-9]/gi, "")),
      palette: {
        bg: hex(p.bg, existing?.palette.bg ?? "#0a0008"), fg: hex(p.fg, existing?.palette.fg ?? "#faf8fb"),
        accent: hex(p.accent, existing?.palette.accent ?? "#c9a84c"), accent2: hex(p.accent2, existing?.palette.accent2 ?? "#7c3aed"),
        muted: hex(p.muted, existing?.palette.muted ?? "#c4b5fd"),
      },
      fonts: { display: str(f.display, existing?.fonts.display ?? "Playfair Display"), body: str(f.body, existing?.fonts.body ?? "Inter") },
      markdown: str(b.markdown, existing?.markdown ?? ""),
      isTemplate: false,
    };
    await saveBrand(brand);
    return Response.json({ success: true, brand: info(brand) });
  } catch (e) { return Response.json({ error: e instanceof Error ? e.message : "Erreur" }, { status: 500 }); }
}

/** DELETE ?slug=... → supprime une marque (jamais la dernière). */
export async function DELETE(req: Request) {
  try {
    const slug = new URL(req.url).searchParams.get("slug");
    if (!slug) return Response.json({ error: "slug requis" }, { status: 400 });
    const brands = await listBrands();
    if (brands.length <= 1) return Response.json({ error: "Impossible de supprimer la dernière marque." }, { status: 400 });
    await deleteBrand(slug);
    return Response.json({ success: true, brands: (await listBrands()).map(info) });
  } catch (e) { return Response.json({ error: e instanceof Error ? e.message : "Erreur" }, { status: 500 }); }
}
