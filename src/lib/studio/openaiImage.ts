import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

/**
 * Connecteur OpenAI Images — GPT Image 2.5 (natif REST).
 *
 * Variables d'env :
 *   OPENAI_API_KEY      (obligatoire)  https://platform.openai.com/api-keys
 *   OPENAI_IMAGE_MODEL  (optionnel)    gpt-image-2.5-sunburst (défaut, qualité) | gpt-image-2.5-flare (rapide)
 *   OPENAI_IMAGE_MODEL_BATCH (optionnel) modèle utilisé en mode « Série » (défaut : gpt-image-2.5-flare)
 *   OPENAI_IMAGE_QUALITY (optionnel)   low | medium | high | xhigh | max | auto (défaut : medium)
 *
 * - Sans référence  → POST /v1/images/generations (JSON)
 * - Avec références → POST /v1/images/edits (multipart, champ image[]) : les visuels
 *   d'inspiration guident le style du fond généré.
 * Taille libre (multiples de 16, ratio entre 1:3 et 3:1). Réponse : data[0].b64_json.
 */
const GEN_ENDPOINT = "https://api.openai.com/v1/images/generations";
const EDIT_ENDPOINT = "https://api.openai.com/v1/images/edits";
export const DEFAULT_OPENAI_IMAGE_MODEL = "gpt-image-2.5-sunburst";
export const DEFAULT_OPENAI_IMAGE_MODEL_BATCH = "gpt-image-2.5-flare";

export const PUBLIC_IMAGES_DIR = path.join(os.tmpdir(), "bbold-studio-gen");
export const PUBLIC_IMAGES_URL = "/generated-images";

export function isOpenAIImageConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}
export function openAIImageModel(): string {
  return process.env.OPENAI_IMAGE_MODEL?.trim() || DEFAULT_OPENAI_IMAGE_MODEL;
}
/** Modèle pour les séries (plusieurs contenus d'affilée) : rapide et moins cher. */
export function openAIImageModelBatch(): string {
  return process.env.OPENAI_IMAGE_MODEL_BATCH?.trim() || DEFAULT_OPENAI_IMAGE_MODEL_BATCH;
}

/** Tailles portrait alignées sur nos formats (multiples de 16). */
export const OPENAI_SIZES: Record<"4:5" | "9:16" | "1:1", string> = { "4:5": "1024x1280", "9:16": "1024x1824", "1:1": "1024x1024" };

export interface ReferenceImage { data: Buffer; mimeType: string; name?: string }

interface GenerateResult { filename: string; publicUrl: string; absPath: string; bytes: number }

function slugifyName(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "image";
}

function explain(status: number, body: string, model: string): Error {
  if (status === 401) return new Error("OPENAI_API_KEY invalide. Vérifie la clé dans « Connecter mes outils ».");
  if (status === 429) return new Error("Quota / crédit OpenAI épuisé pour la génération d'images (ajoute du crédit sur platform.openai.com → Billing).");
  if (status === 403 && /verif/i.test(body)) return new Error("Ton organisation OpenAI doit être vérifiée pour utiliser GPT Image (platform.openai.com → Settings → Organization → Verify).");
  if (status === 404 || /model/i.test(body) && /not (found|exist)/i.test(body)) return new Error(`Modèle « ${model} » indisponible sur ton compte. Change OPENAI_IMAGE_MODEL / OPENAI_IMAGE_MODEL_BATCH (ex. gpt-image-2.5-flare).`);
  return new Error(`OpenAI Images ${status} : ${body.slice(0, 400)}`);
}

/**
 * Génère une image (PNG) à partir d'un prompt et, optionnellement, d'images de
 * référence (style / sujet à conserver). Sauvegarde dans public/generated-images/.
 */
export async function generateImageOpenAI(
  prompt: string,
  opts?: { slug?: string; references?: ReferenceImage[]; size?: string; quality?: string; model?: string }
): Promise<GenerateResult> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error("OPENAI_API_KEY manquante. Ajoute-la via « Connecter mes outils » (ou dans .env.local).");
  const model = opts?.model ?? openAIImageModel();
  const size = opts?.size ?? OPENAI_SIZES["1:1"];
  const quality = opts?.quality ?? process.env.OPENAI_IMAGE_QUALITY?.trim() ?? "medium";
  const refs = opts?.references ?? [];

  let res: Response;
  if (refs.length) {
    const fd = new FormData();
    fd.append("model", model);
    fd.append("prompt", prompt);
    fd.append("size", size);
    fd.append("quality", quality);
    fd.append("output_format", "png");
    refs.forEach((r, i) => fd.append("image[]", new Blob([new Uint8Array(r.data)], { type: r.mimeType }), r.name ?? `ref-${i + 1}.${r.mimeType.includes("png") ? "png" : r.mimeType.includes("webp") ? "webp" : "jpg"}`));
    res = await fetch(EDIT_ENDPOINT, { method: "POST", headers: { Authorization: `Bearer ${apiKey}` }, body: fd });
  } else {
    res = await fetch(GEN_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, prompt, size, quality, output_format: "png", n: 1 }),
    });
  }
  if (!res.ok) throw explain(res.status, await res.text(), model);

  const data = (await res.json()) as { data?: { b64_json?: string }[] };
  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) throw new Error("Aucune image renvoyée par OpenAI.");
  const buf = Buffer.from(b64, "base64");

  const filename = `${new Date().toISOString().slice(0, 10)}-${opts?.slug || slugifyName(prompt.slice(0, 60))}-${Date.now()}.png`;
  const absPath = path.join(PUBLIC_IMAGES_DIR, filename);
  await fs.mkdir(PUBLIC_IMAGES_DIR, { recursive: true });
  await fs.writeFile(absPath, buf);
  return { filename, publicUrl: `${PUBLIC_IMAGES_URL}/${filename}`, absPath, bytes: buf.length };
}
