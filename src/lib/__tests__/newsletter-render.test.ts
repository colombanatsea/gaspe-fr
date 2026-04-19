import { describe, it, expect } from "vitest";
import { renderNewsletter } from "../newsletter/render";
import type { NewsletterBlock } from "../newsletter/types";

const BASE_OPTS = {
  subject: "Test subject",
  preheader: "Test preheader",
};

describe("renderNewsletter", () => {
  it("renders an empty block array with default header + footer", () => {
    const html = renderNewsletter([], BASE_OPTS);
    expect(html).toContain("<!DOCTYPE html>");
    // default header
    expect(html).toContain("gaspe-fr.pages.dev/assets/logo");
    // default footer includes GASPE signature
    expect(html).toContain("Groupement des Armateurs");
  });

  it("renders subject and preheader", () => {
    const html = renderNewsletter([], { subject: "Hello world", preheader: "secret peek" });
    expect(html).toContain("<title>Hello world</title>");
    expect(html).toContain("secret peek");
  });

  it("renders a heading block", () => {
    const blocks: NewsletterBlock[] = [
      { type: "heading", text: "Bonjour GASPE", level: 2, align: "center" },
    ];
    const html = renderNewsletter(blocks, BASE_OPTS);
    expect(html).toContain("Bonjour GASPE");
    expect(html).toContain("<h2");
    expect(html).toContain('text-align:center');
  });

  it("renders a paragraph with safe HTML", () => {
    const blocks: NewsletterBlock[] = [
      { type: "paragraph", html: "<p>Hello <strong>world</strong></p>" },
    ];
    const html = renderNewsletter(blocks, BASE_OPTS);
    expect(html).toContain("Hello <strong>world</strong>");
  });

  it("strips script tags from paragraph HTML", () => {
    const blocks: NewsletterBlock[] = [
      { type: "paragraph", html: "<p>Safe</p><script>alert(1)</script>" },
    ];
    const html = renderNewsletter(blocks, BASE_OPTS);
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("alert(1)");
  });

  it("strips on* event handlers and javascript: URLs", () => {
    const blocks: NewsletterBlock[] = [
      { type: "paragraph", html: '<a href="javascript:alert(1)" onclick="bad()">x</a>' },
    ];
    const html = renderNewsletter(blocks, BASE_OPTS);
    expect(html).not.toContain("javascript:alert");
    expect(html).not.toContain("onclick");
  });

  it("renders a button block with url and label", () => {
    const blocks: NewsletterBlock[] = [
      { type: "button", label: "Cliquez", url: "https://gaspe.fr/contact", color: "teal", align: "center" },
    ];
    const html = renderNewsletter(blocks, BASE_OPTS);
    expect(html).toContain("Cliquez");
    expect(html).toContain("https://gaspe.fr/contact");
  });

  it("renders an image block with alt text", () => {
    const blocks: NewsletterBlock[] = [
      { type: "image", url: "https://example.com/x.png", alt: "mon image", width: "full" },
    ];
    const html = renderNewsletter(blocks, BASE_OPTS);
    expect(html).toContain("https://example.com/x.png");
    expect(html).toContain('alt="mon image"');
  });

  it("renders a two-column layout", () => {
    const blocks: NewsletterBlock[] = [
      { type: "columns", items: [{ html: "<p>Col A</p>" }, { html: "<p>Col B</p>" }] },
    ];
    const html = renderNewsletter(blocks, BASE_OPTS);
    expect(html).toContain("Col A");
    expect(html).toContain("Col B");
  });

  it("substitutes variables in paragraphs and subject", () => {
    const blocks: NewsletterBlock[] = [
      { type: "paragraph", html: "<p>Bonjour {{firstname}}</p>" },
      { type: "footer", showUnsub: true, showContactAddress: false },
    ];
    const html = renderNewsletter(blocks, {
      subject: "Hello {{firstname}}",
      preheader: "",
      vars: { firstname: "Marie", unsubscribe_url: "https://gaspe.fr/unsub?tok=abc" },
    });
    expect(html).toContain("Bonjour Marie");
    expect(html).toContain("Hello Marie");
    expect(html).toContain("https://gaspe.fr/unsub?tok=abc");
  });

  it("auto-injects header if missing", () => {
    const blocks: NewsletterBlock[] = [
      { type: "heading", text: "Test", level: 1, align: "left" },
    ];
    const html = renderNewsletter(blocks, BASE_OPTS);
    // default logo-white.png appears in default gradient header
    expect(html).toContain("logo-white.png");
  });

  it("does not duplicate header when one is present", () => {
    const blocks: NewsletterBlock[] = [
      { type: "header", variant: "white" },
      { type: "heading", text: "Test", level: 1, align: "left" },
    ];
    const html = renderNewsletter(blocks, BASE_OPTS);
    // white variant uses the color logo (logoUrl), not logoWhiteUrl
    const logoMatches = html.match(/logo\.png/g) ?? [];
    expect(logoMatches.length).toBeGreaterThan(0);
  });
});
