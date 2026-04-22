import { describe, it, expect } from "vitest";
import {
  diffSections,
  previewContent,
  summarizeChanges,
  type CmsRevisionDetailSection,
} from "@/lib/cms-revision-diff";

/* -------------------------------------------------------------------- */
/*  previewContent                                                       */
/* -------------------------------------------------------------------- */

describe("previewContent", () => {
  it("returns '(vide)' for empty string", () => {
    expect(previewContent("")).toBe("(vide)");
  });

  it("returns '(vide)' for HTML that strips to nothing", () => {
    expect(previewContent("<br /><hr />")).toBe("(vide)");
    expect(previewContent("<p>   </p>")).toBe("(vide)");
  });

  it("strips HTML tags while keeping textual content", () => {
    expect(previewContent("<p>Hello <strong>world</strong></p>")).toBe(
      "Hello world",
    );
  });

  it("normalises runs of whitespace to single spaces", () => {
    expect(previewContent("a\n\nb\t c")).toBe("a b c");
  });

  it("truncates and appends ellipsis when above max", () => {
    const long = "a".repeat(500);
    const out = previewContent(long, 50);
    expect(out.endsWith("…")).toBe(true);
    expect(out.length).toBe(51);
  });

  it("does not truncate when below max", () => {
    expect(previewContent("short", 50)).toBe("short");
  });
});

/* -------------------------------------------------------------------- */
/*  diffSections                                                         */
/* -------------------------------------------------------------------- */

function sec(
  id: string,
  content: string,
  label = id,
  type = "text",
): CmsRevisionDetailSection {
  return { id, label, type, content };
}

describe("diffSections – statuses", () => {
  it("flags unchanged sections when content is identical", () => {
    const res = diffSections([sec("hero-title", "Hello")], [sec("hero-title", "Hello")]);
    expect(res).toHaveLength(1);
    expect(res[0].kind).toBe("unchanged");
    expect(res[0].beforeContent).toBe("Hello");
    expect(res[0].afterContent).toBe("Hello");
  });

  it("flags modified when content differs", () => {
    const res = diffSections([sec("a", "v1")], [sec("a", "v2")]);
    expect(res[0].kind).toBe("modified");
    expect(res[0].beforeContent).toBe("v1");
    expect(res[0].afterContent).toBe("v2");
  });

  it("flags added when a section exists only in the after snapshot", () => {
    const res = diffSections([], [sec("new", "hi")]);
    expect(res[0].kind).toBe("added");
    expect(res[0].beforeContent).toBeNull();
    expect(res[0].afterContent).toBe("hi");
  });

  it("flags removed when a section exists only in the before snapshot", () => {
    const res = diffSections([sec("gone", "bye")], []);
    expect(res[0].kind).toBe("removed");
    expect(res[0].beforeContent).toBe("bye");
    expect(res[0].afterContent).toBeNull();
  });

  it("handles empty-to-empty as empty list", () => {
    expect(diffSections([], [])).toEqual([]);
  });
});

describe("diffSections – ordering", () => {
  it("orders kinds : modified, added, removed, unchanged", () => {
    const before: CmsRevisionDetailSection[] = [
      sec("z-unchanged", "same"),
      sec("a-removed", "was here"),
      sec("c-modified", "before"),
    ];
    const after: CmsRevisionDetailSection[] = [
      sec("z-unchanged", "same"),
      sec("c-modified", "after"),
      sec("b-added", "new"),
    ];
    const res = diffSections(before, after);
    expect(res.map((r) => r.kind)).toEqual([
      "modified",
      "added",
      "removed",
      "unchanged",
    ]);
  });

  it("orders alphabetically by id within the same kind", () => {
    const before: CmsRevisionDetailSection[] = [sec("b", "old"), sec("a", "old")];
    const after: CmsRevisionDetailSection[] = [sec("b", "new"), sec("a", "new")];
    const res = diffSections(before, after);
    expect(res.every((r) => r.kind === "modified")).toBe(true);
    expect(res.map((r) => r.id)).toEqual(["a", "b"]);
  });
});

describe("diffSections – label and type", () => {
  it("prefers the label from `after` when both exist, falls back to before", () => {
    const res = diffSections(
      [sec("id1", "v1", "ancien label")],
      [sec("id1", "v2", "")],
    );
    expect(res[0].label).toBe("ancien label");
  });

  it("takes the type from `after` when both exist", () => {
    const res = diffSections(
      [sec("x", "h", "x", "text")],
      [sec("x", "<p>h</p>", "x", "richtext")],
    );
    expect(res[0].type).toBe("richtext");
  });

  it("takes label + type from `before` on removed", () => {
    const res = diffSections([sec("x", "h", "mon label", "richtext")], []);
    expect(res[0].label).toBe("mon label");
    expect(res[0].type).toBe("richtext");
  });
});

/* -------------------------------------------------------------------- */
/*  summarizeChanges                                                     */
/* -------------------------------------------------------------------- */

describe("summarizeChanges", () => {
  it("counts each kind and reports totalDiffs (excluding unchanged)", () => {
    const res = summarizeChanges([
      { id: "1", label: "", type: "text", kind: "modified", beforeContent: "a", afterContent: "b" },
      { id: "2", label: "", type: "text", kind: "added", beforeContent: null, afterContent: "c" },
      { id: "3", label: "", type: "text", kind: "added", beforeContent: null, afterContent: "d" },
      { id: "4", label: "", type: "text", kind: "removed", beforeContent: "e", afterContent: null },
      { id: "5", label: "", type: "text", kind: "unchanged", beforeContent: "f", afterContent: "f" },
    ]);
    expect(res).toEqual({
      modified: 1,
      added: 2,
      removed: 1,
      unchanged: 1,
      totalDiffs: 4,
    });
  });

  it("returns zeros on empty input", () => {
    expect(summarizeChanges([])).toEqual({
      modified: 0,
      added: 0,
      removed: 0,
      unchanged: 0,
      totalDiffs: 0,
    });
  });
});
