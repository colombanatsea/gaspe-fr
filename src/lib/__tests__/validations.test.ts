import { describe, it, expect } from "vitest";
import { jobSchema, articleSchema, contactSchema, eventSchema } from "../validations";

describe("jobSchema", () => {
  it("accepts valid job input", () => {
    const result = jobSchema.safeParse({
      title: "Capitaine de navire",
      description: "Recherche capitaine expérimenté pour liaison maritime",
      contractType: "CDI",
      location: "Marseille",
    });
    expect(result.success).toBe(true);
  });

  it("requires title of at least 3 characters", () => {
    const result = jobSchema.safeParse({ title: "ab", description: "Description valide ici" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("3 caracteres");
    }
  });

  it("requires description of at least 10 characters", () => {
    const result = jobSchema.safeParse({ title: "Capitaine", description: "Court" });
    expect(result.success).toBe(false);
  });

  it("validates contractType enum", () => {
    const valid = jobSchema.safeParse({ title: "Test Job", description: "A valid description here", contractType: "CDI" });
    expect(valid.success).toBe(true);

    const invalid = jobSchema.safeParse({ title: "Test Job", description: "A valid description here", contractType: "Freelance" });
    expect(invalid.success).toBe(false);
  });

  it("validates contactEmail format", () => {
    const valid = jobSchema.safeParse({ title: "Job", description: "Description ok ici", contactEmail: "test@test.com" });
    expect(valid.success).toBe(true);

    const invalid = jobSchema.safeParse({ title: "Job", description: "Description ok ici", contactEmail: "not-an-email" });
    expect(invalid.success).toBe(false);
  });

  it("allows empty string for contactEmail", () => {
    const result = jobSchema.safeParse({ title: "Job", description: "Description ok ici", contactEmail: "" });
    expect(result.success).toBe(true);
  });

  it("validates applicationUrl format", () => {
    const valid = jobSchema.safeParse({ title: "Job", description: "Description ok ici", applicationUrl: "https://example.com/apply" });
    expect(valid.success).toBe(true);

    const invalid = jobSchema.safeParse({ title: "Job", description: "Description ok ici", applicationUrl: "not-a-url" });
    expect(invalid.success).toBe(false);
  });
});

describe("articleSchema", () => {
  it("accepts valid article input", () => {
    const result = articleSchema.safeParse({
      title: "Actualité GASPE",
      content: "Le GASPE annonce ses nouveaux projets maritimes",
      category: "actualite",
    });
    expect(result.success).toBe(true);
  });

  it("requires content of at least 10 characters", () => {
    const result = articleSchema.safeParse({ title: "Article", content: "Court" });
    expect(result.success).toBe(false);
  });

  it("validates category enum", () => {
    const valid = articleSchema.safeParse({ title: "Art", content: "Contenu assez long ici", category: "position" });
    expect(valid.success).toBe(true);

    const invalid = articleSchema.safeParse({ title: "Art", content: "Contenu assez long ici", category: "blog" });
    expect(invalid.success).toBe(false);
  });

  it("validates coverImageUrl format", () => {
    const valid = articleSchema.safeParse({ title: "Art", content: "Contenu assez long ici", coverImageUrl: "https://img.com/photo.jpg" });
    expect(valid.success).toBe(true);

    const invalid = articleSchema.safeParse({ title: "Art", content: "Contenu assez long ici", coverImageUrl: "not-a-url" });
    expect(invalid.success).toBe(false);
  });
});

describe("contactSchema", () => {
  it("accepts valid contact input", () => {
    const result = contactSchema.safeParse({
      name: "Jean Dupont",
      email: "jean@example.com",
      subject: "Question adhésion",
      message: "Je souhaite en savoir plus sur l'adhésion au GASPE",
    });
    expect(result.success).toBe(true);
  });

  it("requires name of at least 2 characters", () => {
    const result = contactSchema.safeParse({
      name: "J",
      email: "j@t.com",
      subject: "Test sujet",
      message: "Message assez long",
    });
    expect(result.success).toBe(false);
  });

  it("requires valid email", () => {
    const result = contactSchema.safeParse({
      name: "Jean",
      email: "invalid",
      subject: "Test sujet",
      message: "Message assez long",
    });
    expect(result.success).toBe(false);
  });

  it("requires subject of at least 3 characters", () => {
    const result = contactSchema.safeParse({
      name: "Jean",
      email: "j@t.com",
      subject: "AB",
      message: "Message assez long",
    });
    expect(result.success).toBe(false);
  });

  it("requires message of at least 10 characters", () => {
    const result = contactSchema.safeParse({
      name: "Jean",
      email: "j@t.com",
      subject: "Sujet",
      message: "Court",
    });
    expect(result.success).toBe(false);
  });

  it("allows optional company", () => {
    const result = contactSchema.safeParse({
      name: "Jean",
      email: "j@t.com",
      subject: "Sujet ok",
      message: "Message assez long ici",
      company: "Maritime SA",
    });
    expect(result.success).toBe(true);
  });
});

describe("eventSchema", () => {
  it("accepts valid event input", () => {
    const result = eventSchema.safeParse({
      title: "Assemblée générale GASPE",
      startDate: "2025-09-15T09:00:00Z",
      location: "Paris",
    });
    expect(result.success).toBe(true);
  });

  it("requires title of at least 3 characters", () => {
    const result = eventSchema.safeParse({
      title: "AG",
      startDate: "2025-09-15T09:00:00Z",
    });
    expect(result.success).toBe(false);
  });

  it("requires a valid startDate", () => {
    const result = eventSchema.safeParse({
      title: "Événement",
      startDate: "not-a-date",
    });
    expect(result.success).toBe(false);
  });

  it("coerces string dates to Date objects", () => {
    const result = eventSchema.safeParse({
      title: "Événement test",
      startDate: "2025-06-01",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.startDate).toBeInstanceOf(Date);
    }
  });

  it("validates eventUrl format", () => {
    const valid = eventSchema.safeParse({
      title: "Événement",
      startDate: "2025-06-01",
      eventUrl: "https://gaspe.fr/event",
    });
    expect(valid.success).toBe(true);

    const invalid = eventSchema.safeParse({
      title: "Événement",
      startDate: "2025-06-01",
      eventUrl: "not-url",
    });
    expect(invalid.success).toBe(false);
  });

  it("allows empty string for eventUrl", () => {
    const result = eventSchema.safeParse({
      title: "Événement",
      startDate: "2025-06-01",
      eventUrl: "",
    });
    expect(result.success).toBe(true);
  });
});
