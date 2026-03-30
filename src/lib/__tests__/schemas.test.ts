import { describe, it, expect } from "vitest";
import {
  safeParse,
  userSchema,
  usersArraySchema,
  mediaItemSchema,
  mediaArraySchema,
  memberSchema,
  membersArraySchema,
  pageContentSchema,
  pagesRecordSchema,
} from "../schemas";
import { z } from "zod";

describe("safeParse", () => {
  it("returns parsed data for valid JSON", () => {
    const result = safeParse(z.array(z.number()), "[1,2,3]", []);
    expect(result).toEqual([1, 2, 3]);
  });

  it("returns fallback for null input", () => {
    expect(safeParse(z.string(), null, "default")).toBe("default");
  });

  it("returns fallback for malformed JSON", () => {
    expect(safeParse(z.object({}), "{broken", {})).toEqual({});
  });

  it("returns fallback when schema validation fails", () => {
    expect(safeParse(z.number(), '"not a number"', 42)).toBe(42);
  });
});

describe("userSchema", () => {
  const validUser = {
    id: "candidat-123",
    email: "test@test.fr",
    name: "Jean Dupont",
    role: "candidat",
    approved: true,
    createdAt: "2025-01-01T00:00:00.000Z",
  };

  it("accepts a valid minimal user", () => {
    const result = userSchema.safeParse(validUser);
    expect(result.success).toBe(true);
  });

  it("accepts a full user with all optional fields", () => {
    const fullUser = {
      ...validUser,
      role: "adherent",
      company: "Test Co",
      phone: "0123456789",
      companyRole: "dirigeant",
      vessels: [{ id: "v1", name: "Le Corsaire" }],
      membershipStatus: "paid",
      savedOffers: ["offer-1"],
      applications: [{ offerId: "o1", date: "2025-01-01", status: "pending" }],
      structuredCertifications: [{ certId: "capitaine-200" }],
      seaService: [{ id: "s1", vesselName: "Yacht", rank: "Capitaine", startDate: "2020-01-01" }],
    };
    expect(userSchema.safeParse(fullUser).success).toBe(true);
  });

  it("rejects user with invalid role", () => {
    const result = userSchema.safeParse({ ...validUser, role: "pirate" });
    expect(result.success).toBe(false);
  });

  it("rejects user missing required fields", () => {
    expect(userSchema.safeParse({ id: "x" }).success).toBe(false);
  });
});

describe("usersArraySchema", () => {
  it("validates an array of users", () => {
    const users = [
      { id: "1", email: "a@b.fr", name: "A", role: "admin", createdAt: "2025-01-01" },
      { id: "2", email: "c@d.fr", name: "B", role: "candidat", createdAt: "2025-01-01" },
    ];
    expect(usersArraySchema.safeParse(users).success).toBe(true);
  });

  it("rejects if one user is invalid", () => {
    const users = [
      { id: "1", email: "a@b.fr", name: "A", role: "admin", createdAt: "2025-01-01" },
      { id: "2", role: "invalid" },
    ];
    expect(usersArraySchema.safeParse(users).success).toBe(false);
  });
});

describe("mediaItemSchema", () => {
  it("accepts valid media", () => {
    const item = {
      id: "m1",
      name: "photo.jpg",
      type: "image/jpeg",
      data: "data:image/jpeg;base64,abc",
      size: 1024,
      uploadedAt: "2025-01-01",
    };
    expect(mediaItemSchema.safeParse(item).success).toBe(true);
  });

  it("rejects missing required fields", () => {
    expect(mediaItemSchema.safeParse({ id: "m1" }).success).toBe(false);
  });
});

describe("memberSchema", () => {
  it("accepts valid member", () => {
    const member = {
      name: "Compagnie Océane",
      slug: "compagnie-oceane",
      city: "Lorient",
      latitude: 47.75,
      longitude: -3.37,
      region: "Bretagne",
      territory: "metropole",
      category: "titulaire",
    };
    expect(memberSchema.safeParse(member).success).toBe(true);
  });

  it("rejects invalid territory", () => {
    const member = {
      name: "X",
      slug: "x",
      city: "Y",
      latitude: 0,
      longitude: 0,
      region: "Z",
      territory: "invalid",
      category: "titulaire",
    };
    expect(memberSchema.safeParse(member).success).toBe(false);
  });
});

describe("pageContentSchema", () => {
  it("validates page content", () => {
    const page = {
      pageId: "homepage",
      sections: [
        { id: "hero-title", label: "Hero", type: "text", content: "Bienvenue" },
      ],
      updatedAt: "2025-01-01",
    };
    expect(pageContentSchema.safeParse(page).success).toBe(true);
  });

  it("rejects invalid section type", () => {
    const page = {
      pageId: "test",
      sections: [
        { id: "s1", label: "S1", type: "invalid_type", content: "" },
      ],
      updatedAt: "2025-01-01",
    };
    expect(pageContentSchema.safeParse(page).success).toBe(false);
  });
});

describe("pagesRecordSchema", () => {
  it("validates a record of pages", () => {
    const pages = {
      homepage: {
        pageId: "homepage",
        sections: [{ id: "s1", label: "S", type: "text", content: "OK" }],
        updatedAt: "2025-01-01",
      },
    };
    expect(pagesRecordSchema.safeParse(pages).success).toBe(true);
  });
});
