import { describe, it, expect } from "vitest";
import {
  renderEmailLayout,
  renderEmailButton,
  renderEmailParagraph,
} from "../brevo-templates";

describe("renderEmailLayout", () => {
  it("retourne un HTML complet avec DOCTYPE", () => {
    const html = renderEmailLayout({ headerTitle: "Test", body: "<p>Body</p>" });
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<html lang=\"fr\">");
    expect(html).toContain("</body></html>");
  });

  it("intègre le titre H1 dans le header", () => {
    const html = renderEmailLayout({ headerTitle: "Mon titre", body: "" });
    expect(html).toContain(">Mon titre</h1>");
  });

  it("affiche la baseline si headerSubtitle fourni", () => {
    const html = renderEmailLayout({
      headerTitle: "T",
      headerSubtitle: "Localement ancrés",
      body: "",
    });
    expect(html).toContain("Localement ancrés");
  });

  it("omet la baseline si non fournie", () => {
    const html = renderEmailLayout({ headerTitle: "T", body: "" });
    expect(html).not.toContain("B2DFE3"); // couleur baseline absente
  });

  it("utilise teal-600 GASPE par défaut pour le header", () => {
    const html = renderEmailLayout({ headerTitle: "T", body: "" });
    expect(html).toContain("background:#1B7E8A");
  });

  it("accepte une couleur header custom", () => {
    const html = renderEmailLayout({
      headerTitle: "Urgent",
      headerColor: "#B91C1C",
      body: "",
    });
    expect(html).toContain("background:#B91C1C");
  });

  it("intègre le body tel quel", () => {
    const body = '<p>Bonjour <strong>Foo</strong></p><p>Second</p>';
    const html = renderEmailLayout({ headerTitle: "T", body });
    expect(html).toContain(body);
  });

  it("affiche le footer par défaut (GASPE long name)", () => {
    const html = renderEmailLayout({ headerTitle: "T", body: "" });
    expect(html).toContain("Groupement des Armateurs de Services Publics Maritimes");
  });

  it("accepte un footer custom", () => {
    const html = renderEmailLayout({
      headerTitle: "T",
      body: "",
      footer: "Footer custom",
    });
    expect(html).toContain("Footer custom");
    expect(html).not.toContain("Groupement des Armateurs");
  });

  it("omet le footer si null explicite", () => {
    const html = renderEmailLayout({ headerTitle: "T", body: "", footer: null });
    expect(html).not.toContain("Groupement des Armateurs");
    expect(html).not.toContain("border-top:1px solid");
  });

  it("largeur max 600px (compatible Gmail/Outlook)", () => {
    const html = renderEmailLayout({ headerTitle: "T", body: "" });
    expect(html).toContain("max-width:600px");
  });

  it("fonts DM Sans + Exo 2", () => {
    const html = renderEmailLayout({ headerTitle: "T", body: "" });
    expect(html).toContain("'DM Sans'");
    expect(html).toContain("'Exo 2'");
  });
});

describe("renderEmailButton", () => {
  it("génère un bouton avec URL + label", () => {
    const btn = renderEmailButton("https://gaspe.fr/reset", "Réinitialiser");
    expect(btn).toContain('href="https://gaspe.fr/reset"');
    expect(btn).toContain(">Réinitialiser</a>");
  });

  it("utilise la couleur teal-600 GASPE", () => {
    const btn = renderEmailButton("#", "X");
    expect(btn).toContain("background:#1B7E8A");
    expect(btn).toContain("color:#fff");
  });

  it("padding et border-radius cohérents charte", () => {
    const btn = renderEmailButton("#", "X");
    expect(btn).toContain("padding:12px 24px");
    expect(btn).toContain("border-radius:8px");
    expect(btn).toContain("text-decoration:none");
  });
});

describe("renderEmailParagraph", () => {
  it("paragraphe standard couleur foreground", () => {
    const p = renderEmailParagraph("Hello");
    expect(p).toContain(">Hello</p>");
    expect(p).toContain("color:#222221");
    expect(p).toContain("font-size:15px");
  });

  it("paragraphe muted avec couleur grisée", () => {
    const p = renderEmailParagraph("Hint", { muted: true });
    expect(p).toContain(">Hint</p>");
    expect(p).toContain("color:#6B6560");
    expect(p).toContain("font-size:13px");
  });
});
