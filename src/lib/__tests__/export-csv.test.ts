import { describe, it, expect, vi, beforeEach } from "vitest";
import { exportAccountsCsv, exportMembershipsCsv, exportApplicationsCsv } from "../export-csv";

const revokeObjectURLSpy = vi.fn();
const createObjectURLSpy = vi.fn(() => "blob:mock-url");
let clickedLink: { href: string; download: string; click: () => void } | null = null;

beforeEach(() => {
  clickedLink = null;
  revokeObjectURLSpy.mockReset();
  createObjectURLSpy.mockReset().mockReturnValue("blob:mock-url");

  URL.createObjectURL = createObjectURLSpy;
  URL.revokeObjectURL = revokeObjectURLSpy;

  vi.spyOn(document, "createElement").mockImplementation(() => {
    clickedLink = { href: "", download: "", click: vi.fn() } as unknown as HTMLElement;
    return clickedLink as unknown as HTMLElement;
  });
});

describe("exportAccountsCsv", () => {
  it("generates CSV with correct headers and data", async () => {
    exportAccountsCsv([
      {
        name: "Jean Dupont",
        email: "jean@example.com",
        role: "adherent",
        company: "Compagnie Maritime",
        phone: "0102030405",
        approved: true,
        archived: false,
        companyRole: "directeur",
        membershipStatus: "paid",
        createdAt: "2025-06-15T10:00:00.000Z",
      },
    ]);

    expect(createObjectURLSpy).toHaveBeenCalledOnce();
    const blobArg = createObjectURLSpy.mock.calls[0][0] as Blob;
    expect(blobArg).toBeInstanceOf(Blob);

    const text = await blobArg.text();
    expect(text).toContain("Nom,Email,Rôle,Compagnie");
    expect(text).toContain("Jean Dupont");
    expect(text).toContain("jean@example.com");
    expect(text).toContain("Actif");
    expect(clickedLink?.download).toMatch(/^gaspe-comptes-/);
    expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:mock-url");
  });

  it("shows 'En attente' for unapproved users", async () => {
    exportAccountsCsv([
      {
        name: "Pending User",
        email: "pending@test.com",
        role: "adherent",
        approved: false,
        createdAt: "2025-01-01T00:00:00Z",
      },
    ]);

    const blobArg = createObjectURLSpy.mock.calls[0][0] as Blob;
    const text = await blobArg.text();
    expect(text).toContain("En attente");
  });
});

describe("exportMembershipsCsv", () => {
  it("filters only non-archived adherents", async () => {
    exportMembershipsCsv([
      { name: "Adherent1", email: "a@a.com", role: "adherent", archived: false, createdAt: "2025-01-01T00:00:00Z" },
      { name: "Admin", email: "b@b.com", role: "admin", archived: false, createdAt: "2025-01-01T00:00:00Z" },
      { name: "Archived", email: "c@c.com", role: "adherent", archived: true, createdAt: "2025-01-01T00:00:00Z" },
    ]);

    const blobArg = createObjectURLSpy.mock.calls[0][0] as Blob;
    const text = await blobArg.text();
    expect(text).toContain("Adherent1");
    expect(text).not.toContain("Admin");
    expect(text).not.toContain("Archived");
  });

  it("maps membership status labels correctly", async () => {
    exportMembershipsCsv([
      { name: "Paid", email: "p@p.com", role: "adherent", membershipStatus: "paid", createdAt: "2025-01-01T00:00:00Z" },
      { name: "Pending", email: "pe@p.com", role: "adherent", membershipStatus: "pending", createdAt: "2025-01-01T00:00:00Z" },
      { name: "Due", email: "d@d.com", role: "adherent", membershipStatus: "other", createdAt: "2025-01-01T00:00:00Z" },
    ]);

    const blobArg = createObjectURLSpy.mock.calls[0][0] as Blob;
    const text = await blobArg.text();
    expect(text).toContain("Payée");
    expect(text).toContain("En cours");
    expect(text).toContain("Due");
  });
});

describe("exportApplicationsCsv", () => {
  it("generates CSV with application data", async () => {
    exportApplicationsCsv([
      {
        candidateName: "Marie Martin",
        candidateEmail: "marie@test.com",
        offerTitle: "Capitaine",
        company: "Vedettes du Golfe",
        date: "2025-03-15T10:00:00.000Z",
        status: "Acceptée",
      },
    ]);

    const blobArg = createObjectURLSpy.mock.calls[0][0] as Blob;
    const text = await blobArg.text();
    expect(text).toContain("Candidat,Email,Offre,Compagnie,Date,Statut");
    expect(text).toContain("Marie Martin");
    expect(text).toContain("Capitaine");
    expect(clickedLink?.download).toMatch(/^gaspe-candidatures-/);
  });
});

describe("CSV escaping", () => {
  it("escapes values containing commas", async () => {
    exportAccountsCsv([
      { name: "Dupont, Jean", email: "jean@test.com", role: "admin", createdAt: "2025-01-01T00:00:00Z" },
    ]);

    const blobArg = createObjectURLSpy.mock.calls[0][0] as Blob;
    const text = await blobArg.text();
    expect(text).toContain('"Dupont, Jean"');
  });

  it("escapes values containing double quotes", async () => {
    exportAccountsCsv([
      { name: 'Le "Grand"', email: "a@a.com", role: "admin", createdAt: "2025-01-01T00:00:00Z" },
    ]);

    const blobArg = createObjectURLSpy.mock.calls[0][0] as Blob;
    const text = await blobArg.text();
    expect(text).toContain('"Le ""Grand"""');
  });

  it("prefixes formula injection characters with quote", async () => {
    exportAccountsCsv([
      { name: "=SUM(A1)", email: "a@a.com", role: "admin", createdAt: "2025-01-01T00:00:00Z" },
    ]);

    const blobArg = createObjectURLSpy.mock.calls[0][0] as Blob;
    const text = await blobArg.text();
    expect(text).toContain("'=SUM(A1)");
  });
});
