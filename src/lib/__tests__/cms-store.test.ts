import { describe, it, expect } from "vitest";
import {
  getMedia,
  addMedia,
  deleteMedia,
  getPageContent,
  savePageContent,
  getAllPageContent,
  mergePageDefinitions,
  customSectionKey,
  type MediaItem,
  type PageContent,
  type PageDefinition,
  type CmsCustomSection,
} from "../cms-store";

function makeMediaItem(overrides: Partial<MediaItem> = {}): MediaItem {
  return {
    id: "media-1",
    name: "photo.jpg",
    type: "image/jpeg",
    data: "data:image/jpeg;base64,abc123",
    size: 1024,
    uploadedAt: "2025-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("Media Library", () => {
  it("returns empty array when no media", () => {
    expect(getMedia()).toEqual([]);
  });

  it("adds and retrieves media", () => {
    const item = makeMediaItem();
    addMedia(item);
    const all = getMedia();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe("media-1");
  });

  it("prepends new items (most recent first)", () => {
    addMedia(makeMediaItem({ id: "first" }));
    addMedia(makeMediaItem({ id: "second" }));
    const all = getMedia();
    expect(all[0].id).toBe("second");
    expect(all[1].id).toBe("first");
  });

  it("deletes media by id", () => {
    addMedia(makeMediaItem({ id: "keep" }));
    addMedia(makeMediaItem({ id: "delete-me" }));
    deleteMedia("delete-me");
    const all = getMedia();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe("keep");
  });
});

describe("Page Content", () => {
  it("returns null for non-existent page", () => {
    expect(getPageContent("non-existent")).toBeNull();
  });

  it("saves and retrieves page content", () => {
    const page: PageContent = {
      pageId: "homepage",
      sections: [
        { id: "hero-title", label: "Hero Title", type: "text", content: "Bienvenue" },
      ],
      updatedAt: "2025-01-01",
    };
    savePageContent(page);
    const result = getPageContent("homepage");
    expect(result).not.toBeNull();
    expect(result!.sections[0].content).toBe("Bienvenue");
  });

  it("updates existing page content", () => {
    savePageContent({
      pageId: "contact",
      sections: [{ id: "email", label: "Email", type: "text", content: "old@gaspe.fr" }],
      updatedAt: "2025-01-01",
    });
    savePageContent({
      pageId: "contact",
      sections: [{ id: "email", label: "Email", type: "text", content: "new@gaspe.fr" }],
      updatedAt: "2025-01-02",
    });
    const result = getPageContent("contact");
    expect(result!.sections[0].content).toBe("new@gaspe.fr");
  });

  it("stores multiple pages independently", () => {
    savePageContent({
      pageId: "homepage",
      sections: [{ id: "s1", label: "S1", type: "text", content: "Home" }],
      updatedAt: "2025-01-01",
    });
    savePageContent({
      pageId: "footer",
      sections: [{ id: "s2", label: "S2", type: "text", content: "Footer" }],
      updatedAt: "2025-01-01",
    });
    const all = getAllPageContent();
    expect(Object.keys(all)).toHaveLength(2);
    expect(all["homepage"]).toBeDefined();
    expect(all["footer"]).toBeDefined();
  });

  it("sets updatedAt automatically on save", () => {
    savePageContent({
      pageId: "test",
      sections: [],
      updatedAt: "old-date",
    });
    const result = getPageContent("test");
    expect(result!.updatedAt).not.toBe("old-date");
  });
});

/* ──────────────────────────────────────────────
   Phase 1+2 hybride CMS — mergePageDefinitions + customSectionKey
   ────────────────────────────────────────────── */

function makeCustom(overrides: Partial<CmsCustomSection> = {}): CmsCustomSection {
  return {
    id: 1,
    pageId: "homepage",
    sectionId: "extra",
    label: "Extra",
    type: "text",
    sortOrder: 1,
    createdBy: null,
    createdAt: "2026-05-12T00:00:00Z",
    ...overrides,
  };
}

const builtin: PageDefinition[] = [
  {
    id: "homepage",
    label: "Accueil",
    sections: [
      { id: "hero-title", label: "Hero – Titre", type: "text" },
      { id: "hero-subtitle", label: "Hero – Sous-titre", type: "text" },
    ],
  },
  {
    id: "contact",
    label: "Contact",
    sections: [{ id: "email", label: "Email", type: "text" }],
  },
];

describe("customSectionKey", () => {
  it("concatène pageId et sectionId avec un séparateur stable", () => {
    expect(customSectionKey("homepage", "extra")).toBe("homepage::extra");
  });

  it("différencie deux paires de même sectionId sur pages différentes", () => {
    expect(customSectionKey("a", "x")).not.toBe(customSectionKey("b", "x"));
  });
});

describe("mergePageDefinitions", () => {
  it("retourne les builtin tels quels si aucune custom section", () => {
    const result = mergePageDefinitions(builtin, []);
    expect(result).toBe(builtin);
  });

  it("ajoute une section custom à la fin de la page concernée", () => {
    const custom = [makeCustom({ pageId: "homepage", sectionId: "extra" })];
    const result = mergePageDefinitions(builtin, custom);
    expect(result[0].sections).toHaveLength(3);
    expect(result[0].sections[2].id).toBe("extra");
  });

  it("ne touche pas une page sans section custom", () => {
    const custom = [makeCustom({ pageId: "homepage", sectionId: "extra" })];
    const result = mergePageDefinitions(builtin, custom);
    expect(result[1].sections).toHaveLength(1);
    expect(result[1].sections[0].id).toBe("email");
  });

  it("respecte sortOrder croissant pour les sections custom multiples", () => {
    const custom = [
      makeCustom({ id: 10, pageId: "homepage", sectionId: "z-section", sortOrder: 3 }),
      makeCustom({ id: 11, pageId: "homepage", sectionId: "a-section", sortOrder: 1 }),
      makeCustom({ id: 12, pageId: "homepage", sectionId: "m-section", sortOrder: 2 }),
    ];
    const result = mergePageDefinitions(builtin, custom);
    const customIds = result[0].sections.slice(2).map((s) => s.id);
    expect(customIds).toEqual(["a-section", "m-section", "z-section"]);
  });

  it("départage par id ascendant si même sortOrder", () => {
    const custom = [
      makeCustom({ id: 20, pageId: "homepage", sectionId: "second", sortOrder: 1 }),
      makeCustom({ id: 19, pageId: "homepage", sectionId: "first", sortOrder: 1 }),
    ];
    const result = mergePageDefinitions(builtin, custom);
    const customIds = result[0].sections.slice(2).map((s) => s.id);
    expect(customIds).toEqual(["first", "second"]);
  });

  it("ignore les custom sections référençant une page non builtin (scope Phase 3)", () => {
    const custom = [makeCustom({ pageId: "page-inexistante", sectionId: "x" })];
    const result = mergePageDefinitions(builtin, custom);
    expect(result).toHaveLength(builtin.length);
    expect(result.find((p) => p.id === "page-inexistante")).toBeUndefined();
  });

  it("préserve le type et itemFields de la section custom", () => {
    const custom = [
      makeCustom({
        pageId: "homepage",
        sectionId: "items",
        type: "list",
        itemFields: [{ id: "name", label: "Nom", type: "text" }],
      }),
    ];
    const result = mergePageDefinitions(builtin, custom);
    const added = result[0].sections[result[0].sections.length - 1];
    expect(added.type).toBe("list");
    expect(added.itemFields).toEqual([{ id: "name", label: "Nom", type: "text" }]);
  });

  it("ne mute pas le builtin d'origine", () => {
    const builtinCopy = JSON.parse(JSON.stringify(builtin));
    const custom = [makeCustom({ pageId: "homepage", sectionId: "extra" })];
    mergePageDefinitions(builtin, custom);
    expect(builtin).toEqual(builtinCopy);
  });
});
