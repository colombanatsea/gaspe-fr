import { describe, it, expect } from "vitest";
import {
  getMedia,
  addMedia,
  deleteMedia,
  getPageContent,
  savePageContent,
  getAllPageContent,
  type MediaItem,
  type PageContent,
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
