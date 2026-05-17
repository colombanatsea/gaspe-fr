import { describe, it, expect } from "vitest";
import { getCorsHeaders } from "../cors";

function reqWithOrigin(origin?: string): Request {
  return new Request("https://gaspe-api.hello-0d0.workers.dev/api/health", {
    headers: origin ? { Origin: origin } : {},
  });
}

describe("getCorsHeaders", () => {
  it("renvoie 4 headers CORS", () => {
    const h = getCorsHeaders(reqWithOrigin("https://gaspe.fr"));
    expect(Object.keys(h).sort()).toEqual([
      "Access-Control-Allow-Credentials",
      "Access-Control-Allow-Headers",
      "Access-Control-Allow-Methods",
      "Access-Control-Allow-Origin",
    ]);
  });

  it("autorise gaspe-fr.pages.dev", () => {
    const h = getCorsHeaders(reqWithOrigin("https://gaspe-fr.pages.dev"));
    expect(h["Access-Control-Allow-Origin"]).toBe("https://gaspe-fr.pages.dev");
  });

  it("autorise www.gaspe.fr", () => {
    const h = getCorsHeaders(reqWithOrigin("https://www.gaspe.fr"));
    expect(h["Access-Control-Allow-Origin"]).toBe("https://www.gaspe.fr");
  });

  it("autorise gaspe.fr apex", () => {
    const h = getCorsHeaders(reqWithOrigin("https://gaspe.fr"));
    expect(h["Access-Control-Allow-Origin"]).toBe("https://gaspe.fr");
  });

  it("autorise localhost en dev", () => {
    expect(getCorsHeaders(reqWithOrigin("http://localhost:3000"))["Access-Control-Allow-Origin"])
      .toBe("http://localhost:3000");
    expect(getCorsHeaders(reqWithOrigin("http://localhost:3001"))["Access-Control-Allow-Origin"])
      .toBe("http://localhost:3001");
  });

  it("fallback sur la première origine pour un Origin non listé", () => {
    const h = getCorsHeaders(reqWithOrigin("https://evil.com"));
    expect(h["Access-Control-Allow-Origin"]).toBe("https://gaspe-fr.pages.dev");
  });

  it("fallback aussi pour une requête sans header Origin", () => {
    const h = getCorsHeaders(reqWithOrigin(undefined));
    expect(h["Access-Control-Allow-Origin"]).toBe("https://gaspe-fr.pages.dev");
  });

  it("expose les méthodes attendues", () => {
    const h = getCorsHeaders(reqWithOrigin("https://gaspe.fr"));
    expect(h["Access-Control-Allow-Methods"]).toContain("GET");
    expect(h["Access-Control-Allow-Methods"]).toContain("POST");
    expect(h["Access-Control-Allow-Methods"]).toContain("PATCH");
    expect(h["Access-Control-Allow-Methods"]).toContain("DELETE");
    expect(h["Access-Control-Allow-Methods"]).toContain("OPTIONS");
  });

  it("autorise credentials (cookies httpOnly)", () => {
    const h = getCorsHeaders(reqWithOrigin("https://gaspe.fr"));
    expect(h["Access-Control-Allow-Credentials"]).toBe("true");
  });

  it("autorise les headers Content-Type et Authorization", () => {
    const h = getCorsHeaders(reqWithOrigin("https://gaspe.fr"));
    expect(h["Access-Control-Allow-Headers"]).toContain("Content-Type");
    expect(h["Access-Control-Allow-Headers"]).toContain("Authorization");
  });
});
