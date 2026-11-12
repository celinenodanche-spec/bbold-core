/**
 * Copie tout le préfixe bbold-studio/ de Vercel Blob vers le bucket S3 (R2, MinIO…).
 * Idempotent : relançable sans risque, écrase à l'identique.
 *
 * Usage (variables Blob ET S3 dans l'environnement) :
 *   node --env-file=.env.local scripts/migrate-blob-to-s3.mjs
 *
 * Si le store Blob est suspendu, le listing échouera : réactive-le le temps de
 * la copie (ou recharge simplement tes inspirations dans le studio).
 */
import { list } from "@vercel/blob";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const env = (k) => process.env[k]?.trim().replace(/^["'`]+|["'`]+$/g, "") || undefined;
const token = env("BLOB_READ_WRITE_TOKEN");
const bucket = env("S3_BUCKET");
if (!token || !bucket || !env("S3_ACCESS_KEY_ID") || !env("S3_SECRET_ACCESS_KEY")) {
  console.error("Il faut BLOB_READ_WRITE_TOKEN, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY (+ S3_ENDPOINT).");
  process.exit(1);
}
const endpoint = env("S3_ENDPOINT");
const s3 = new S3Client({
  region: env("S3_REGION") || "auto", endpoint, forcePathStyle: !!endpoint,
  credentials: { accessKeyId: env("S3_ACCESS_KEY_ID"), secretAccessKey: env("S3_SECRET_ACCESS_KEY") },
  requestChecksumCalculation: "WHEN_REQUIRED", responseChecksumValidation: "WHEN_REQUIRED",
});

let cursor, n = 0, bytes = 0, failed = 0;
do {
  const page = await list({ prefix: "bbold-studio/", token, cursor, limit: 1000 });
  for (const b of page.blobs) {
    try {
      const r = await fetch(b.url, { cache: "no-store" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const body = Buffer.from(await r.arrayBuffer());
      await s3.send(new PutObjectCommand({ Bucket: bucket, Key: b.pathname, Body: body, ContentType: r.headers.get("content-type") || "application/octet-stream" }));
      n++; bytes += body.length;
      console.log(`✓ ${b.pathname}`);
    } catch (e) { failed++; console.error(`✗ ${b.pathname} : ${e.message}`); }
  }
  cursor = page.hasMore ? page.cursor : undefined;
} while (cursor);
console.log(`\n${n} fichiers copiés (${(bytes / 1e6).toFixed(1)} Mo), ${failed} échec(s).`);
process.exit(failed ? 1 : 0);
