/**
 * Helpers crypto Worker : hash / verify mot de passe via PBKDF2.
 *
 * bcrypt non disponible dans le runtime CF Workers, on utilise PBKDF2
 * (Web Crypto API) avec 100 000 itérations + salt 16 bytes + SHA-256.
 *
 * Format de stockage : `pbkdf2$iterations$salt_hex$hash_hex`.
 *
 * Extrait de `workers/api.ts` en J1 vague 3.
 */

export async function hashPasswordServer(password: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const hash = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
    keyMaterial,
    256,
  );
  const saltHex = Array.from(salt).map((b) => b.toString(16).padStart(2, "0")).join("");
  const hashHex = Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `pbkdf2$100000$${saltHex}$${hashHex}`;
}

export async function verifyPasswordServer(password: string, stored: string): Promise<boolean> {
  // Hashes SHA-256 legacy (64 hex chars) ne sont pas vérifiables sans salt
  // côté email. Refuser, l'utilisateur devra reset son mot de passe.
  if (/^[a-f0-9]{64}$/.test(stored)) {
    return false;
  }

  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;

  const iterations = parseInt(parts[1], 10);
  const saltHex = parts[2];
  const expectedHash = parts[3];

  const enc = new TextEncoder();
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map((h) => parseInt(h, 16)));
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const hash = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    keyMaterial,
    256,
  );
  const hashHex = Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex === expectedHash;
}
