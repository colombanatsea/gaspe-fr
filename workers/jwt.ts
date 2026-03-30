/**
 * JWT utilities for Cloudflare Workers
 * Uses Web Crypto API (HMAC-SHA256) — no external dependencies
 */

interface JwtPayload {
  sub: string;       // user ID
  email: string;
  role: string;
  iat: number;       // issued at (seconds)
  exp: number;       // expiration (seconds)
}

const ALGORITHM = { name: "HMAC", hash: "SHA-256" } as const;
const TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days in seconds

function base64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlDecode(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function getKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey("raw", enc.encode(secret), ALGORITHM, false, ["sign", "verify"]);
}

export async function signJwt(
  payload: { sub: string; email: string; role: string },
  secret: string,
): Promise<string> {
  const enc = new TextEncoder();
  const now = Math.floor(Date.now() / 1000);

  const header = base64url(enc.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const body = base64url(enc.encode(JSON.stringify({
    ...payload,
    iat: now,
    exp: now + TOKEN_EXPIRY,
  })));

  const key = await getKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(`${header}.${body}`));
  return `${header}.${body}.${base64url(signature)}`;
}

export async function verifyJwt(token: string, secret: string): Promise<JwtPayload | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [header, body, sig] = parts;
  const enc = new TextEncoder();

  try {
    const key = await getKey(secret);
    const signatureBytes = base64urlDecode(sig);
    const valid = await crypto.subtle.verify("HMAC", key, signatureBytes, enc.encode(`${header}.${body}`));
    if (!valid) return null;

    const payload: JwtPayload = JSON.parse(new TextDecoder().decode(base64urlDecode(body)));

    // Check expiration
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload;
  } catch {
    return null;
  }
}
