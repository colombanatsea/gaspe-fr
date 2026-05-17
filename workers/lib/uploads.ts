/**
 * Helpers communs aux uploads (R2) :
 * - validation par magic bytes (PDF / DOC / DOCX / images PNG-JPG-GIF-WEBP),
 * - fallback de MIME via extension (Windows / Office),
 * - validation côté media (images + docs Office).
 *
 * Extrait de `workers/api.ts` en J1 vague 5.f. Utilisé par les handlers
 * `/api/upload` (documents CV / candidat) et `/api/media` (CMS, R2 public).
 */

/** Magic bytes pour les documents Office / PDF (CV, pièces jointes). */
export const MAGIC_BYTES: Record<string, Uint8Array[]> = {
  "application/pdf": [new Uint8Array([0x25, 0x50, 0x44, 0x46])], // %PDF
  "application/msword": [new Uint8Array([0xd0, 0xcf, 0x11, 0xe0])], // OLE2
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    new Uint8Array([0x50, 0x4b, 0x03, 0x04]), // PK (ZIP)
  ],
};

/** Magic bytes pour les images (CMS media library). Étend MAGIC_BYTES. */
export const IMAGE_MAGIC_BYTES: Record<string, Uint8Array[]> = {
  "image/png": [new Uint8Array([0x89, 0x50, 0x4e, 0x47])],
  "image/jpeg": [new Uint8Array([0xff, 0xd8, 0xff])],
  "image/gif": [new Uint8Array([0x47, 0x49, 0x46, 0x38])],
  "image/webp": [new Uint8Array([0x52, 0x49, 0x46, 0x46])],
};

/** Valide magic bytes pour endpoint upload documents (CV, pièces). */
export function validateMagicBytes(buffer: ArrayBuffer, declaredType: string): boolean {
  const signatures = MAGIC_BYTES[declaredType];
  if (!signatures) return false;
  const header = new Uint8Array(buffer.slice(0, 4));
  return signatures.some((sig) => sig.every((byte, i) => header[i] === byte));
}

/**
 * Valide magic bytes pour endpoint media (images + docs Office).
 * SVG est text-based, donc bypass.
 */
export function validateMediaMagicBytes(buffer: ArrayBuffer, declaredType: string): boolean {
  if (declaredType === "image/svg+xml") return true;
  const signatures = IMAGE_MAGIC_BYTES[declaredType] ?? MAGIC_BYTES[declaredType];
  if (!signatures) return false;
  const header = new Uint8Array(buffer.slice(0, 4));
  return signatures.some((sig) => sig.every((byte, i) => header[i] === byte));
}

/**
 * Windows ne reconnaît pas toujours .docx → file.type vide ou octet-stream.
 * Fallback sur l'extension pour identifier le type réel (C20 post-launch).
 */
export function deriveMimeType(file: File): string {
  const declared = file.type;
  if (declared && declared !== "application/octet-stream") return declared;
  const name = (file.name ?? "").toLowerCase();
  if (name.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (name.endsWith(".doc")) return "application/msword";
  if (name.endsWith(".pdf")) return "application/pdf";
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  if (name.endsWith(".gif")) return "image/gif";
  if (name.endsWith(".webp")) return "image/webp";
  if (name.endsWith(".svg")) return "image/svg+xml";
  return declared || "application/octet-stream";
}
