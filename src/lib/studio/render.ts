/**
 * Rendu des visuels Instagram (post 4:5, carrousel 4:5, story 9:16) en HTML → PNG.
 * 100 % déterministe : le texte est composé par le navigateur (zéro faute, zéro
 * hallucination), la mise en page suit la marque (brand.md), le profil de style
 * déduit des visuels d'inspiration, et le style éditorial choisi dans le studio.
 * Si une clé image est présente (OPENAI_API_KEY → GPT Image 2.5, sinon GEMINI_API_KEY),
 * un fond image (sans texte) est généré à partir des inspirations pour le post /
 * la couverture / la 1re story ; sinon fond palette.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { launchBrowser } from "./browser";
import type { Brand } from "./brand";
import type { StyleProfile } from "./inspirations";
import { listInspirations, readInspirationFile } from "./inspirations";
import { styleById, type EditorialStyle } from "./styles";
import type { Slide, Format } from "./generate";
import { putVisual } from "./storage";
import { generateImage, isNanoBananaConfigured } from "./nanoBanana";
import { generateImageOpenAI, isOpenAIImageConfigured, openAIImageModel, openAIImageModelBatch, OPENAI_SIZES } from "./openaiImage";

/** Fournisseur de fond IA actif (OpenAI prioritaire, Gemini en secours), ou null. */
export function aiBackgroundProvider(fast = false): { id: "openai" | "gemini"; label: string } | null {
  if (isOpenAIImageConfigured()) return { id: "openai", label: `GPT Image 2.5 (${(fast ? openAIImageModelBatch() : openAIImageModel()).replace("gpt-image-2.5-", "")})` };
  if (isNanoBananaConfigured()) return { id: "gemini", label: "Gemini (Nano Banana)" };
  return null;
}

export const SIZES: Record<string, { w: number; h: number }> = { "4:5": { w: 1080, h: 1350 }, "9:16": { w: 1080, h: 1920 } };
export const ratioFor = (format: Format): "4:5" | "9:16" => (format === "story" ? "9:16" : "4:5");

/* ---------- couleurs ---------- */
const esc = (s: string) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
function rgb(hex: string): [number, number, number] { const h = hex.replace("#", ""); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number]; }
function lum(hex: string): number {
  const [r, g, b] = rgb(hex).map((c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a: string, b: string): number { const la = lum(a), lb = lum(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); }
function alpha(hex: string, a: number): string { const [r, g, b] = rgb(hex); return `rgba(${r},${g},${b},${a})`; }

export interface Theme {
  bg: string; fg: string; accent: string; accent2: string; muted: string;
  displayFont: string; bodyFont: string; dark: boolean; style: EditorialStyle; brandName: string; handle: string;
}

/** Fusion marque + profil d'inspiration + style éditorial → thème de rendu. */
export function buildTheme(brand: Brand, profile: StyleProfile | null, styleId?: string | null): Theme {
  const style = styleById(styleId);
  const pal = profile?.palette ?? brand.palette;
  const fonts = profile?.fonts ?? brand.fonts;
  const wantDark = profile ? profile.layout.dark : style.visual.dark;
  const palIsDark = lum(pal.bg) < 0.35;
  let bg = pal.bg, fg = pal.fg;
  if (wantDark !== palIsDark) [bg, fg] = [fg, bg]; // on inverse fond/texte pour respecter le mode voulu
  if (contrast(bg, fg) < 4) fg = lum(bg) < 0.35 ? "#faf8fb" : "#111111";
  // accent lisible sur le fond : on prend le premier candidat suffisamment contrasté
  const pick = (cands: string[], min: number) => cands.find((c) => contrast(bg, c) >= min) ?? fg;
  const accent = pick([pal.accent, pal.accent2, pal.muted], 3);
  const accent2 = pick([pal.accent2, pal.muted, pal.accent].filter((c) => c !== accent), 2.5);
  const muted = contrast(bg, pal.muted) >= 3 ? pal.muted : alpha(fg, 0.62);
  const serifWanted = style.visual.display === "serif";
  const displayFont = serifWanted ? fonts.display : fonts.body;
  return { bg, fg, accent, accent2, muted, displayFont, bodyFont: fonts.body, dark: lum(bg) < 0.35, style, brandName: brand.name, handle: brand.handle };
}

/* ---------- typographie ---------- */
function titleSize(t: string, ratio: "4:5" | "9:16", cover: boolean): number {
  const n = t.length;
  const base = ratio === "9:16" ? 8 : 0;
  if (cover) return (n <= 28 ? 104 : n <= 48 ? 88 : n <= 72 ? 74 : n <= 100 ? 62 : 52) + base;
  return (n <= 28 ? 84 : n <= 48 ? 72 : n <= 72 ? 62 : n <= 100 ? 54 : 46) + base;
}
function bodySize(t: string, ratio: "4:5" | "9:16"): number {
  const n = t.length; const base = ratio === "9:16" ? 4 : 0;
  return (n <= 60 ? 40 : n <= 120 ? 36 : n <= 200 ? 32 : 28) + base;
}
function titleHTML(t: string, th: Theme): string {
  const txt = th.style.visual.upper ? t.toUpperCase() : t;
  if (!th.style.visual.accentItalic) {
    // mot final en couleur accent (sans italique) pour les styles sans/bold
    const w = esc(txt).split(" "); if (w.length < 3) return esc(txt);
    const last = w.pop(); return `${w.join(" ")} <span class="acc">${last}</span>`;
  }
  const w = esc(txt).split(" "); if (w.length < 2) return `<em class="acc">${w.join(" ")}</em>`;
  const last = w.pop(); return `${w.join(" ")} <em class="acc">${last}</em>`;
}

/* ---------- décors ---------- */
function decor(th: Theme, i: number, total: number, kind: "cover" | "content" | "cta" | "post" | "story"): string {
  const d = th.style.visual.decor;
  const num = String(kind === "content" ? i : i + 1).padStart(2, "0");
  if (d === "lines") return `<div class="deco-line"></div><div class="deco-vline"></div>`;
  if (d === "blocks") return `<div class="deco-block"></div>${kind === "content" ? `<div class="deco-num-block">${num}</div>` : ""}`;
  if (d === "numbers") return kind === "content" ? `<div class="deco-bignum">${num}</div>` : `<div class="deco-dots">${Array.from({ length: Math.min(total, 10) }, (_, k) => `<i class="${k === i ? "on" : ""}"></i>`).join("")}</div>`;
  if (d === "grid") return `<div class="deco-grid"></div><div class="deco-frame"></div>`;
  return "";
}

/* ---------- page ---------- */
interface Frame { slide: Slide; i: number; total: number; kind: "cover" | "content" | "cta" | "post" | "story"; cta?: string; bgImage?: string }

/** Axes disponibles sur Google Fonts (une requête invalide = 400 = AUCUNE police chargée). */
const FONT_AXES: Record<string, { ital: boolean; weights: number[] }> = {
  "Playfair Display": { ital: true, weights: [400, 700, 900] }, Inter: { ital: false, weights: [400, 500, 600, 700, 800] },
  "DM Serif Display": { ital: true, weights: [400] }, "Space Grotesk": { ital: false, weights: [400, 500, 700] },
  "Cormorant Garamond": { ital: true, weights: [400, 600, 700] }, Montserrat: { ital: true, weights: [400, 600, 800, 900] },
  "Bebas Neue": { ital: false, weights: [400] }, Fraunces: { ital: true, weights: [400, 700, 900] },
  Manrope: { ital: false, weights: [400, 600, 800] }, Lora: { ital: true, weights: [400, 700] },
  "Archivo Black": { ital: false, weights: [400] }, Poppins: { ital: true, weights: [400, 600, 800, 900] },
};
function fontLink(name: string): string {
  const ax = FONT_AXES[name] ?? { ital: false, weights: [400, 700] };
  const fam = name.trim().replace(/\s+/g, "+");
  const spec = ax.ital ? `ital,wght@${ax.weights.map((w) => `0,${w}`).join(";")};${ax.weights.map((w) => `1,${w}`).join(";")}` : `wght@${ax.weights.join(";")}`;
  return `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${fam}:${spec}&display=swap">`;
}
export function fontLinks(th: Theme): string {
  const fams = [...new Set([th.displayFont, th.bodyFont])];
  return `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>${fams.map(fontLink).join("")}`;
}

function css(th: Theme, ratio: "4:5" | "9:16"): string {
  const { w, h } = SIZES[ratio];
  const pad = ratio === "9:16" ? 96 : 88;
  const safeTop = ratio === "9:16" ? 220 : 0, safeBot = ratio === "9:16" ? 260 : 0;
  const airy = th.style.visual.density === "airy";
  const center = th.style.visual.align === "center";
  const serif = th.style.visual.display === "serif";
  const dispStack = `'${th.displayFont}',${serif ? "Georgia,serif" : "system-ui,sans-serif"}`;
  return `*{margin:0;padding:0;box-sizing:border-box}
  html,body{width:${w}px;height:${h}px;overflow:hidden;background:${th.bg}}
  .slide{position:relative;width:${w}px;height:${h}px;background:${th.bg};color:${th.fg};font-family:'${th.bodyFont}',system-ui,sans-serif;padding:${pad + safeTop}px ${pad}px ${pad + safeBot}px;display:flex;flex-direction:column;justify-content:space-between;overflow:hidden}
  .slide.hasimg{background:${th.bg}}
  .bgimg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0}
  .scrim{position:absolute;inset:0;z-index:1;background:linear-gradient(180deg,${alpha(th.bg, 0.55)} 0%,${alpha(th.bg, 0.25)} 40%,${alpha(th.bg, 0.92)} 100%)}
  .head,.mid,.foot{position:relative;z-index:2}
  .head{display:flex;justify-content:space-between;align-items:center;font-size:24px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:${th.accent}}
  .head .pg{color:${th.muted};letter-spacing:.08em}
  .mid{flex:1;display:flex;flex-direction:column;justify-content:${center || ratio === "9:16" ? "center" : "flex-end"};align-items:${center ? "center" : "flex-start"};text-align:${center ? "center" : "left"};padding:${airy ? 60 : 36}px 0}
  .title{font-family:${dispStack};font-weight:${th.style.visual.display === "serif" ? 700 : 800};line-height:${th.style.visual.upper ? 1.0 : 1.06};letter-spacing:${th.style.visual.upper ? ".01em" : "-.015em"};max-width:${center ? "100%" : "96%"}}
  .title .acc{color:${th.accent};font-style:${th.style.visual.accentItalic ? "italic" : "normal"}}
  .body{margin-top:${airy ? 34 : 26}px;line-height:1.32;color:${th.muted};font-weight:500;max-width:${center ? "92%" : "90%"}}
  .foot{display:flex;justify-content:space-between;align-items:center;font-size:24px;font-weight:600;color:${th.muted};letter-spacing:.02em}
  .foot .cta{color:${th.accent};font-weight:700}
  .num{display:inline-flex;align-items:center;justify-content:center;width:72px;height:72px;border-radius:${th.style.visual.decor === "blocks" ? "10px" : "999px"};border:3px solid ${th.accent};color:${th.accent};font-family:'${th.displayFont}',serif;font-size:32px;font-weight:700;margin-bottom:34px}
  .pill{display:inline-block;margin-top:44px;padding:22px 40px;border-radius:999px;background:${th.accent};color:${contrast(th.accent, "#111111") >= 4.5 ? "#111111" : "#ffffff"};font-size:30px;font-weight:700;letter-spacing:.02em}
  .bars{position:absolute;top:70px;left:${pad}px;right:${pad}px;display:flex;gap:8px;z-index:2}
  .bars i{flex:1;height:5px;border-radius:3px;background:${alpha(th.fg, 0.28)}}.bars i.on{background:${th.fg}}
  .deco-line{position:absolute;left:${pad - 30}px;right:${pad}px;top:${pad + safeTop + 64}px;height:2px;background:${alpha(th.accent, 0.55)};z-index:1}
  .deco-vline{position:absolute;left:${pad - 30}px;top:${pad + safeTop + 64}px;bottom:${pad + safeBot + 60}px;width:2px;background:${alpha(th.accent, 0.25)};z-index:1}
  .deco-block{position:absolute;left:0;top:0;bottom:0;width:26px;background:${th.accent};z-index:1}
  .deco-num-block{position:absolute;right:${pad}px;top:${pad + safeTop + 70}px;padding:10px 22px;background:${th.accent};color:${contrast(th.accent, "#111111") >= 4.5 ? "#111111" : "#ffffff"};font-family:'${th.displayFont}',serif;font-size:40px;font-weight:800;z-index:1}
  .deco-bignum{position:absolute;right:${pad - 20}px;top:${pad + safeTop + 30}px;font-family:'${th.displayFont}',serif;font-size:360px;font-weight:900;line-height:1;color:${alpha(th.accent, 0.13)};z-index:1}
  .deco-dots{position:absolute;left:${pad}px;top:${pad + safeTop + 64}px;display:flex;gap:10px;z-index:1}.deco-dots i{width:12px;height:12px;border-radius:999px;background:${alpha(th.fg, 0.25)}}.deco-dots i.on{background:${th.accent}}
  .deco-grid{position:absolute;inset:0;z-index:1;background-image:linear-gradient(${alpha(th.fg, 0.06)} 1px,transparent 1px),linear-gradient(90deg,${alpha(th.fg, 0.06)} 1px,transparent 1px);background-size:72px 72px}
  .deco-frame{position:absolute;inset:${Math.round(pad * 0.5)}px;border:2px solid ${alpha(th.accent, 0.6)};z-index:1;pointer-events:none}
  .mark{display:inline-block;width:14px;height:14px;border-radius:999px;background:${th.accent};margin-right:14px;vertical-align:middle}`;
}

function frameHTML(f: Frame, th: Theme, ratio: "4:5" | "9:16"): string {
  const { slide, i, total, kind } = f;
  const cover = kind === "cover" || kind === "post" || (kind === "story" && i === 0);
  const tSize = titleSize(slide.title, ratio, cover);
  const bSize = bodySize(slide.body ?? "", ratio);
  const showNum = kind === "content" && th.style.visual.decor !== "numbers" && th.style.visual.decor !== "blocks";
  const foot = kind === "cover" ? `<span class="cta">Glisse →</span>`
    : kind === "cta" ? `<span class="cta">${esc(f.cta || "Écris-moi en DM")}</span>`
    : kind === "story" ? `<span class="cta">${i < total - 1 ? "Suite →" : ""}</span>`
    : kind === "post" ? `<span class="cta">${esc(f.cta || "")}</span>`
    : `<span>→</span>`;
  const bars = kind === "story" && total > 1 ? `<div class="bars">${Array.from({ length: total }, (_, k) => `<i class="${k <= i ? "on" : ""}"></i>`).join("")}</div>` : "";
  const pill = kind === "story" && i === total - 1 && f.cta ? `<div class="pill">${esc(f.cta)}</div>` : "";
  return `<div class="slide ${f.bgImage ? "hasimg" : ""}">
    ${f.bgImage ? `<img class="bgimg" src="${f.bgImage}"/><div class="scrim"></div>` : decor(th, i, total, kind)}
    ${bars}
    <div class="head"><span><span class="mark"></span>${esc(th.brandName)}</span>${kind === "content" || kind === "cta" ? `<span class="pg">${i + 1}/${total}</span>` : ""}</div>
    <div class="mid">
      ${showNum ? `<span class="num">${i}</span>` : ""}
      <div class="title" style="font-size:${tSize}px">${titleHTML(slide.title, th)}</div>
      ${slide.body ? `<div class="body" style="font-size:${bSize}px">${esc(slide.body)}</div>` : ""}
      ${pill}
    </div>
    <div class="foot"><span>${esc(th.handle)}</span>${foot}</div>
  </div>`;
}

/* ---------- fond IA optionnel (OpenAI GPT Image 2.5, sinon Gemini) ---------- */
async function aiBackground(brand: Brand, profile: StyleProfile | null, th: Theme, idea: string, ratio: "4:5" | "9:16", fast: boolean): Promise<string | null> {
  const provider = aiBackgroundProvider(fast);
  if (!provider) return null;
  try {
    const refs: { buf: Buffer; mime: string; name: string }[] = [];
    for (const f of (await listInspirations(brand)).slice(0, 4)) {
      const r = await readInspirationFile(brand, f.name);
      if (r) refs.push({ buf: r.buf, mime: r.mime, name: f.name });
    }
    const prompt = `Crée un FOND VISUEL abstrait ou photographique pour un post Instagram ${ratio === "9:16" ? "story vertical 9:16" : "portrait 4:5"}, dans le style exact des images de référence (couleurs, textures, ambiance : ${profile?.summary ?? "premium, éditorial"}). Palette dominante ${th.bg} / ${th.accent}. Sujet suggéré : « ${idea} ». Composition avec de larges zones calmes (surtout en bas) pour poser du texte par-dessus. AUCUN texte, aucune lettre, aucun logo, aucun filigrane, aucune personne identifiable.`;
    const r = provider.id === "openai"
      ? await generateImageOpenAI(prompt, { slug: "bg", size: OPENAI_SIZES[ratio], model: fast ? openAIImageModelBatch() : openAIImageModel(), references: refs.map((x) => ({ data: x.buf, mimeType: x.mime, name: x.name })) })
      : await generateImage(prompt, { slug: "bg", references: refs.map((x) => ({ data: x.buf.toString("base64"), mimeType: x.mime })) });
    // data URI : Chrome (Puppeteer) refuse les file:// depuis une page composée en mémoire
    const buf = await fs.readFile(r.absPath);
    const mime = r.absPath.endsWith(".jpg") ? "image/jpeg" : "image/png";
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch (err) {
    console.warn("[render] fond IA ignoré :", err instanceof Error ? err.message : err);
    return null;
  }
}

/* ---------- pipeline ---------- */
export interface RenderInput {
  postId: string; format: Format; idea: string;
  slides: Slide[]; cta?: string;
  brand: Brand; profile: StyleProfile | null; styleId?: string | null;
  aiBackground?: boolean; // par défaut : oui si une clé image (OpenAI / Gemini) est configurée
  fast?: boolean;         // mode « Série » : modèle rapide (OPENAI_IMAGE_MODEL_BATCH, défaut gpt-image-2.5-flare)
}

export async function renderInstagram(inp: RenderInput): Promise<string[]> {
  const ratio = ratioFor(inp.format);
  const { w, h } = SIZES[ratio];
  const th = buildTheme(inp.brand, inp.profile, inp.styleId);
  const total = inp.slides.length;
  const frames: Frame[] = inp.slides.map((slide, i) => ({
    slide, i, total, cta: inp.cta,
    kind: inp.format === "post" ? "post" : inp.format === "story" ? "story" : i === 0 ? "cover" : i === total - 1 ? "cta" : "content",
  }));
  if (inp.aiBackground !== false && frames.length) {
    const bg = await aiBackground(inp.brand, inp.profile, th, inp.idea, ratio, !!inp.fast);
    if (bg) frames[0].bgImage = bg; // post / couverture / 1re story
  }

  const browser = await launchBrowser();
  const urls: string[] = [];
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
    const style = css(th, ratio);
    for (const f of frames) {
      const html = `<!doctype html><html><head><meta charset="utf-8">${fontLinks(th)}<style>${style}</style></head><body>${frameHTML(f, th, ratio)}</body></html>`;
      await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 30000 });
      // polices Google : on attend qu'elles soient prêtes (cap 6 s, ensuite on rend avec le fallback)
      await Promise.race([
        page.evaluate(() => (document as Document & { fonts: FontFaceSet }).fonts.ready.then(() => true)),
        new Promise((r) => setTimeout(r, 6000)),
      ]).catch(() => {});
      await new Promise((r) => setTimeout(r, 250));
      const shot = Buffer.from(await page.screenshot({ type: "png" }));
      urls.push(await putVisual(`${inp.postId}-${f.i}.png`, shot));
    }
  } finally { await browser.close(); }
  return urls;
}
