import { describe, it, expect, beforeEach } from "vitest";
import {
  DOCUMENTS_SEED,
  DOCUMENT_CATEGORIES,
  DOCUMENT_CATEGORY_LABELS,
  type GaspeDocument,
} from "@/data/documents-seed";

function resetStorage() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem("gaspe_documents");
  }
}

describe("documents-seed", () => {
  it("has at least one seed document", () => {
    expect(DOCUMENTS_SEED.length).toBeGreaterThan(0);
  });

  it("has unique ids", () => {
    const ids = DOCUMENTS_SEED.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("uses only allowed categories", () => {
    const allowed = new Set(DOCUMENT_CATEGORIES);
    for (const d of DOCUMENTS_SEED) {
      expect(allowed.has(d.category), `invalid category on ${d.id}: ${d.category}`).toBe(true);
    }
  });

  it("exposes a label for every category", () => {
    for (const cat of DOCUMENT_CATEGORIES) {
      expect(DOCUMENT_CATEGORY_LABELS[cat]).toBeTruthy();
    }
  });

  it("uses only allowed shape (required fields populated)", () => {
    for (const d of DOCUMENTS_SEED) {
      expect(d.title.length).toBeGreaterThan(3);
      expect(typeof d.isPublic).toBe("boolean");
      expect(typeof d.published).toBe("boolean");
      expect(Number.isInteger(d.sortOrder)).toBe(true);
    }
  });

  it("does not ship live PDF URLs (all seed points to '#')", () => {
    for (const d of DOCUMENTS_SEED) {
      expect(d.fileUrl, `seed "${d.id}" should not embed live URL`).toBe("#");
    }
  });
});

describe("documents-store (localStorage mode)", () => {
  beforeEach(() => {
    resetStorage();
  });

  it("seeds localStorage on first read when empty", async () => {
    const { listDocuments } = await import("@/lib/documents-store");
    const docs = await listDocuments(true);
    expect(docs.length).toBe(DOCUMENTS_SEED.length);
  });

  it("only returns public + published when includePrivate=false", async () => {
    // Pré-injecter un doc privé + un brouillon
    const docs: GaspeDocument[] = [
      ...DOCUMENTS_SEED,
      {
        ...DOCUMENTS_SEED[0],
        id: "private-doc",
        isPublic: false,
      },
      {
        ...DOCUMENTS_SEED[0],
        id: "draft-doc",
        published: false,
      },
    ];
    window.localStorage.setItem("gaspe_documents", JSON.stringify(docs));

    const { listDocuments } = await import("@/lib/documents-store");
    const visible = await listDocuments(false);
    const ids = visible.map((d) => d.id);
    expect(ids).not.toContain("private-doc");
    expect(ids).not.toContain("draft-doc");
  });

  it("saveDocument persists and retrieves", async () => {
    const { saveDocument, getDocument } = await import("@/lib/documents-store");
    const doc: GaspeDocument = {
      id: "test-doc",
      title: "Doc de test",
      description: "Description test",
      category: "rapports",
      fileUrl: "/assets/test.pdf",
      fileName: "test.pdf",
      publishedAt: "2026-04-01",
      sortOrder: 0,
      isPublic: true,
      published: true,
    };
    await saveDocument(doc);
    const loaded = await getDocument("test-doc");
    expect(loaded?.title).toBe("Doc de test");
    expect(loaded?.fileUrl).toBe("/assets/test.pdf");
  });

  it("deleteDocument removes from store", async () => {
    const { saveDocument, deleteDocument, listDocuments } = await import(
      "@/lib/documents-store"
    );
    const doc: GaspeDocument = {
      id: "to-delete",
      title: "À supprimer",
      description: "",
      category: "rapports",
      fileUrl: "#",
      fileName: "",
      publishedAt: null,
      sortOrder: 0,
      isPublic: true,
      published: true,
    };
    await saveDocument(doc);
    await deleteDocument("to-delete");
    const all = await listDocuments(true);
    expect(all.find((d) => d.id === "to-delete")).toBeUndefined();
  });
});
