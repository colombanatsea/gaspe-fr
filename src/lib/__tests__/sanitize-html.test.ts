import { describe, it, expect } from "vitest";
import { sanitizeHtml } from "../sanitize-html";

describe("sanitizeHtml", () => {
  it("preserves safe HTML", () => {
    const html = '<p>Bonjour <strong>GASPE</strong></p>';
    expect(sanitizeHtml(html)).toBe(html);
  });

  it("removes <script> tags and content", () => {
    expect(sanitizeHtml('<p>OK</p><script>alert("xss")</script>')).toBe("<p>OK</p>");
  });

  it("removes <iframe> tags", () => {
    expect(sanitizeHtml('<iframe src="evil.com"></iframe>')).toBe("");
    expect(sanitizeHtml('<iframe src="evil.com"/>')).toBe("");
  });

  it("removes <object>, <embed>, <applet> tags", () => {
    expect(sanitizeHtml('<object data="x"></object>')).toBe("");
    expect(sanitizeHtml('<embed src="x"/>')).toBe("");
    expect(sanitizeHtml('<applet code="x"></applet>')).toBe("");
  });

  it("strips event handlers (onclick, onerror, etc.)", () => {
    const result = sanitizeHtml('<img src="x.jpg" onerror="alert(1)">');
    expect(result).not.toContain("onerror");
    expect(result).toContain('src="x.jpg"');
  });

  it("strips javascript: URLs", () => {
    const result = sanitizeHtml('<a href="javascript:alert(1)">click</a>');
    expect(result).not.toContain("javascript:");
  });

  it("strips data: URLs in src", () => {
    const result = sanitizeHtml('<img src="data:text/html,<script>alert(1)</script>">');
    expect(result).not.toContain("data:");
  });

  it("removes <base> tags", () => {
    expect(sanitizeHtml('<base href="https://evil.com">')).toBe("");
  });

  it("handles mixed attack vectors", () => {
    const malicious = `
      <p>Safe content</p>
      <script>steal(cookies)</script>
      <img src="photo.jpg" onload="alert(1)">
      <a href="javascript:void(0)">link</a>
    `;
    const result = sanitizeHtml(malicious);
    expect(result).not.toContain("<script");
    expect(result).not.toContain("onload");
    expect(result).not.toContain("javascript:");
    expect(result).toContain("Safe content");
    expect(result).toContain("photo.jpg");
  });

  it("is case-insensitive", () => {
    expect(sanitizeHtml('<SCRIPT>x</SCRIPT>')).not.toContain("SCRIPT");
    expect(sanitizeHtml('<img ONERROR="x">')).not.toContain("ONERROR");
  });
});
