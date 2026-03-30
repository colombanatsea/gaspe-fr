import { describe, it, expect } from "vitest";

// JWT utils are in workers/ — test the core logic here via a copy
// since the Worker module uses Web Crypto which is available in Vitest

const ALGORITHM = { name: "HMAC", hash: "SHA-256" } as const;

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

async function signJwt(
  payload: { sub: string; email: string; role: string },
  secret: string,
  expirySeconds = 7 * 24 * 3600,
): Promise<string> {
  const enc = new TextEncoder();
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(enc.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const body = base64url(enc.encode(JSON.stringify({ ...payload, iat: now, exp: now + expirySeconds })));
  const key = await getKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(`${header}.${body}`));
  return `${header}.${body}.${base64url(signature)}`;
}

async function verifyJwt(token: string, secret: string) {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, body, sig] = parts;
  const enc = new TextEncoder();
  try {
    const key = await getKey(secret);
    const signatureBytes = base64urlDecode(sig);
    const valid = await crypto.subtle.verify("HMAC", key, signatureBytes, enc.encode(`${header}.${body}`));
    if (!valid) return null;
    const payload = JSON.parse(new TextDecoder().decode(base64urlDecode(body)));
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

const SECRET = "test-secret-key-for-jwt-signing";

describe("JWT signJwt", () => {
  it("produces a valid 3-part JWT string", async () => {
    const token = await signJwt({ sub: "user-1", email: "a@b.com", role: "admin" }, SECRET);
    expect(token.split(".")).toHaveLength(3);
  });

  it("different secrets produce different tokens", async () => {
    const payload = { sub: "user-1", email: "a@b.com", role: "admin" };
    const t1 = await signJwt(payload, "secret-1");
    const t2 = await signJwt(payload, "secret-2");
    expect(t1).not.toBe(t2);
  });
});

describe("JWT verifyJwt", () => {
  it("verifies a valid token", async () => {
    const token = await signJwt({ sub: "user-1", email: "test@gaspe.fr", role: "candidat" }, SECRET);
    const payload = await verifyJwt(token, SECRET);
    expect(payload).not.toBeNull();
    expect(payload!.sub).toBe("user-1");
    expect(payload!.email).toBe("test@gaspe.fr");
    expect(payload!.role).toBe("candidat");
  });

  it("rejects a token signed with different secret", async () => {
    const token = await signJwt({ sub: "user-1", email: "a@b.com", role: "admin" }, "secret-a");
    const payload = await verifyJwt(token, "secret-b");
    expect(payload).toBeNull();
  });

  it("rejects a tampered token", async () => {
    const token = await signJwt({ sub: "user-1", email: "a@b.com", role: "admin" }, SECRET);
    const tampered = token.slice(0, -3) + "xxx";
    const payload = await verifyJwt(tampered, SECRET);
    expect(payload).toBeNull();
  });

  it("rejects an expired token", async () => {
    const token = await signJwt({ sub: "user-1", email: "a@b.com", role: "admin" }, SECRET, -10);
    const payload = await verifyJwt(token, SECRET);
    expect(payload).toBeNull();
  });

  it("rejects malformed tokens", async () => {
    expect(await verifyJwt("", SECRET)).toBeNull();
    expect(await verifyJwt("a.b", SECRET)).toBeNull();
    expect(await verifyJwt("not-a-jwt", SECRET)).toBeNull();
  });

  it("contains iat and exp in payload", async () => {
    const token = await signJwt({ sub: "u1", email: "a@b.com", role: "admin" }, SECRET);
    const payload = await verifyJwt(token, SECRET);
    expect(payload!.iat).toBeTypeOf("number");
    expect(payload!.exp).toBeTypeOf("number");
    expect(payload!.exp).toBeGreaterThan(payload!.iat);
  });
});

describe("JWT base64url encoding", () => {
  it("handles special characters correctly", async () => {
    const payload = { sub: "user+special/chars=", email: "test+foo@bar.com", role: "admin" };
    const token = await signJwt(payload, SECRET);
    // Should not contain +, /, or = (base64url encoding)
    for (const part of token.split(".")) {
      expect(part).not.toMatch(/[+/=]/);
    }
    const verified = await verifyJwt(token, SECRET);
    expect(verified!.sub).toBe(payload.sub);
  });
});
