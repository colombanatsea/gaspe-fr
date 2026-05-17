import { describe, it, expect } from "vitest";
import {
  validateMagicBytes,
  validateMediaMagicBytes,
  deriveMimeType,
  MAGIC_BYTES,
  IMAGE_MAGIC_BYTES,
} from "../uploads";

function bufferFrom(bytes: number[]): ArrayBuffer {
  return new Uint8Array(bytes).buffer;
}

describe("validateMagicBytes (documents)", () => {
  it("accepte un PDF (%PDF magic bytes)", () => {
    expect(
      validateMagicBytes(bufferFrom([0x25, 0x50, 0x44, 0x46]), "application/pdf"),
    ).toBe(true);
  });

  it("accepte un DOC (OLE2)", () => {
    expect(
      validateMagicBytes(bufferFrom([0xd0, 0xcf, 0x11, 0xe0]), "application/msword"),
    ).toBe(true);
  });

  it("accepte un DOCX (PK/ZIP magic bytes)", () => {
    expect(
      validateMagicBytes(
        bufferFrom([0x50, 0x4b, 0x03, 0x04]),
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ),
    ).toBe(true);
  });

  it("refuse un buffer dont les bytes ne matchent pas le MIME", () => {
    expect(
      validateMagicBytes(bufferFrom([0x00, 0x00, 0x00, 0x00]), "application/pdf"),
    ).toBe(false);
  });

  it("refuse un MIME non listé", () => {
    expect(
      validateMagicBytes(bufferFrom([0x25, 0x50, 0x44, 0x46]), "image/png"),
    ).toBe(false);
  });

  it("refuse un buffer trop court", () => {
    expect(validateMagicBytes(bufferFrom([0x25, 0x50]), "application/pdf")).toBe(false);
  });
});

describe("validateMediaMagicBytes (images + docs)", () => {
  it("accepte un PNG", () => {
    expect(
      validateMediaMagicBytes(bufferFrom([0x89, 0x50, 0x4e, 0x47]), "image/png"),
    ).toBe(true);
  });

  it("accepte un JPEG (3 bytes signature)", () => {
    expect(
      validateMediaMagicBytes(bufferFrom([0xff, 0xd8, 0xff, 0xe0]), "image/jpeg"),
    ).toBe(true);
  });

  it("accepte un GIF", () => {
    expect(
      validateMediaMagicBytes(bufferFrom([0x47, 0x49, 0x46, 0x38]), "image/gif"),
    ).toBe(true);
  });

  it("accepte un WEBP", () => {
    expect(
      validateMediaMagicBytes(bufferFrom([0x52, 0x49, 0x46, 0x46]), "image/webp"),
    ).toBe(true);
  });

  it("bypass magic bytes pour SVG (text-based)", () => {
    // SVG est XML pur, pas de magic bytes binaires fiables → accepter d'office.
    expect(validateMediaMagicBytes(bufferFrom([0x3c, 0x73, 0x76, 0x67]), "image/svg+xml")).toBe(
      true,
    );
    // Même un buffer arbitraire passe pour SVG car bypass.
    expect(validateMediaMagicBytes(bufferFrom([0x00, 0x00, 0x00, 0x00]), "image/svg+xml")).toBe(
      true,
    );
  });

  it("retombe sur MAGIC_BYTES (PDF) pour les docs Office", () => {
    expect(
      validateMediaMagicBytes(bufferFrom([0x25, 0x50, 0x44, 0x46]), "application/pdf"),
    ).toBe(true);
  });

  it("refuse un buffer image incohérent avec le MIME", () => {
    expect(
      validateMediaMagicBytes(bufferFrom([0x00, 0x00, 0x00, 0x00]), "image/png"),
    ).toBe(false);
  });
});

describe("deriveMimeType (Windows DOCX fallback)", () => {
  function fakeFile(name: string, type: string): File {
    return new File([""], name, { type });
  }

  it("retourne le type déclaré si présent et non octet-stream", () => {
    expect(deriveMimeType(fakeFile("doc.pdf", "application/pdf"))).toBe(
      "application/pdf",
    );
  });

  it("fallback sur extension .docx si type vide", () => {
    expect(deriveMimeType(fakeFile("doc.docx", ""))).toBe(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
  });

  it("fallback sur extension .docx si type octet-stream (Windows)", () => {
    expect(deriveMimeType(fakeFile("doc.docx", "application/octet-stream"))).toBe(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
  });

  it("fallback sur extension .doc", () => {
    expect(deriveMimeType(fakeFile("legacy.doc", ""))).toBe("application/msword");
  });

  it("fallback sur extension .pdf", () => {
    expect(deriveMimeType(fakeFile("contrat.pdf", ""))).toBe("application/pdf");
  });

  it("fallback sur extension .png", () => {
    expect(deriveMimeType(fakeFile("logo.png", ""))).toBe("image/png");
  });

  it("fallback sur extension .jpg / .jpeg", () => {
    expect(deriveMimeType(fakeFile("photo.jpg", ""))).toBe("image/jpeg");
    expect(deriveMimeType(fakeFile("photo.jpeg", ""))).toBe("image/jpeg");
  });

  it("fallback sur extension .svg", () => {
    expect(deriveMimeType(fakeFile("icon.svg", ""))).toBe("image/svg+xml");
  });

  it("retourne octet-stream pour extension inconnue avec type vide", () => {
    expect(deriveMimeType(fakeFile("data.xyz", ""))).toBe("application/octet-stream");
  });

  it("case-insensitive sur l'extension", () => {
    expect(deriveMimeType(fakeFile("FILE.DOCX", ""))).toBe(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
  });
});

describe("Constantes magic bytes", () => {
  it("MAGIC_BYTES contient les 3 types documents attendus", () => {
    expect(Object.keys(MAGIC_BYTES).sort()).toEqual([
      "application/msword",
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]);
  });

  it("IMAGE_MAGIC_BYTES contient PNG/JPEG/GIF/WEBP", () => {
    expect(Object.keys(IMAGE_MAGIC_BYTES).sort()).toEqual([
      "image/gif",
      "image/jpeg",
      "image/png",
      "image/webp",
    ]);
  });
});
