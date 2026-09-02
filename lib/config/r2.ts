// lib/config/r2.ts — lazy-init: never throws at import, only when actually used.
import { S3Client } from "@aws-sdk/client-s3";

const hasR2Env =
  !!process.env.R2_ACCOUNT_ID &&
  !!process.env.R2_ACCESS_KEY_ID &&
  !!process.env.R2_SECRET_ACCESS_KEY &&
  !!process.env.R2_BUCKET_NAME;

let _client: S3Client | null = null;

function getR2Client(): S3Client {
  if (_client) return _client;
  if (!hasR2Env) {
    throw new Error(
      "R2 not configured — missing R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET_NAME. Set them in .env or disable R2 features.",
    );
  }
  _client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
  return _client;
}

// Back-compat: `import { r2 } from "@/lib/config/r2"` still works but lazily.
// In routes that need R2, prefer `getR2Client()` so missing env is a runtime error, not a build crash.
export const r2: S3Client = new Proxy({} as S3Client, {
  get(_target, prop) {
    const c = getR2Client();
    const v = (c as unknown as Record<string, unknown>)[prop as string];
    return typeof v === "function" ? (v as (...a: unknown[]) => unknown).bind(c) : v;
  },
}) as S3Client;

export const R2_BUCKET = process.env.R2_BUCKET_NAME ?? "";

export { getR2Client, hasR2Env };

// Returns the public CDN URL for a given key
export function getPublicUrl(key: string): string {
  if (!hasR2Env) {
    console.warn("[R2] getPublicUrl called without R2 env — returning key as-is");
    return key;
  }
  if (process.env.R2_PUBLIC_URL) {
    return `${process.env.R2_PUBLIC_URL}/${key}`;
  }
  return `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET}/${key}`;
}
