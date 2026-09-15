import { generateContent, type Platform, type Format } from "@/lib/studio/generate";
import { addPost } from "@/lib/studio/store";
import { loadBrand } from "@/lib/studio/brand";
import { loadStyleProfile } from "@/lib/studio/inspirations";

export const runtime = "nodejs";
export const maxDuration = 90;

/** POST /api/studio/content/generate { platform, format, idea, template?, refId?, tools?, style? } */
export async function POST(req: Request) {
  try {
    const { platform, format, idea, template, refId, tools, style } = (await req.json()) as {
      platform?: Platform; format?: Format; idea?: string; template?: string; refId?: string; tools?: string[]; style?: string;
    };
    if (!platform || !format || !idea?.trim())
      return Response.json({ error: "platform, format et idea requis" }, { status: 400 });

    const brand = await loadBrand();
    const profile = brand ? await loadStyleProfile(brand) : null;

    const result = await generateContent(platform, format, idea.trim(), template, { brand, profile, styleId: style });
    if (platform === "instagram" && format === "post" && result.headline && !result.slides?.length) {
      result.slides = [{ title: result.headline, body: result.body ?? "" }];
    }
    const post = await addPost({ platform, format, idea: idea.trim(), template, refId, tools, style, result });
    return Response.json({ success: true, id: post.id, ...result });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}
