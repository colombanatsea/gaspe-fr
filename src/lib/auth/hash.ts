/* ------------------------------------------------------------------ */
/*  Password hashing – Web Crypto API (SHA-256 + salt)                 */
/*  Client-side hashing – prevents plaintext storage in localStorage   */
/*  When migrating to backend, replace with bcrypt/argon2              */
/* ------------------------------------------------------------------ */

const SALT_PREFIX = "gaspe_salt_v1_";

/** Hash a password with a deterministic salt (email-based) */
export async function hashPassword(password: string, email: string): Promise<string> {
  const salt = SALT_PREFIX + email.toLowerCase().trim();
  const data = new TextEncoder().encode(salt + password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Verify a password against a stored hash */
export async function verifyPassword(
  password: string,
  email: string,
  storedHash: string
): Promise<boolean> {
  const hash = await hashPassword(password, email);
  return hash === storedHash;
}

/** Check if a stored password is already hashed (64-char hex string) */
export function isHashed(value: string): boolean {
  return /^[a-f0-9]{64}$/.test(value);
}
