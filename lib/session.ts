// Edge-safe session token logic (Web Crypto only) — used by middleware and server routes.
// The signing key is HMAC(SHA-256) derived from the admin password + service role key, never sent to the browser.

export const ADMIN_COOKIE = "at_admin";
export const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours

const enc = new TextEncoder();
const dec = new TextDecoder();

function toB64Url(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64Url(str: string) {
  const s = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = s.length % 4 ? "=".repeat(4 - (s.length % 4)) : "";
  return Uint8Array.from(atob(s + pad), (c) => c.charCodeAt(0));
}

async function derivedKey(): Promise<CryptoKey> {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) throw new Error("ADMIN_PASSWORD is not configured");
  const base = await crypto.subtle.importKey("raw", enc.encode(password), "HKDF", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt: enc.encode(process.env.SUPABASE_SERVICE_ROLE_KEY ?? "AsianTiers"), info: enc.encode("AsianTiers-admin-session-v1") },
    base,
    { name: "HMAC", hash: "SHA-256", length: 256 },
    false,
    ["sign", "verify"],
  );
}

export async function createSessionToken(): Promise<string> {
  const payload = toB64Url(enc.encode(JSON.stringify({ exp: Date.now() + SESSION_TTL_SECONDS * 1000 })));
  const sig = await crypto.subtle.sign("HMAC", await derivedKey(), enc.encode(payload));
  return `${payload}.${toB64Url(new Uint8Array(sig))}`;
}

export async function isValidToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  try {
    const ok = await crypto.subtle.verify("HMAC", await derivedKey(), fromB64Url(sig), enc.encode(payload));
    if (!ok) return false;
    const { exp } = JSON.parse(dec.decode(fromB64Url(payload)));
    return typeof exp === "number" && exp > Date.now();
  } catch {
    return false;
  }
}

export async function verifyPassword(candidate: unknown): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || typeof candidate !== "string" || candidate.length === 0) return false;
  // Compare HMAC digests to keep the comparison constant-time.
  const a = await crypto.subtle.sign("HMAC", await derivedKey(), enc.encode(`pw:${candidate}`));
  const b = await crypto.subtle.sign("HMAC", await derivedKey(), enc.encode(`pw:${expected}`));
  const av = new Uint8Array(a);
  const bv = new Uint8Array(b);
  if (av.length !== bv.length) return false;
  let diff = 0;
  for (let i = 0; i < av.length; i++) diff |= av[i] ^ bv[i];
  return diff === 0;
}
