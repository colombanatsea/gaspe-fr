import { describe, it, expect } from "vitest";
import {
  extractToken,
  setTokenCookie,
  clearTokenCookie,
  parseStaffPerms,
} from "../auth";

function reqWith(headers: Record<string, string>): Request {
  return new Request("https://gaspe-api.hello-0d0.workers.dev/api/health", { headers });
}

describe("extractToken", () => {
  it("retourne null si aucun header présent", () => {
    expect(extractToken(reqWith({}))).toBeNull();
  });

  it("extrait le token depuis Authorization: Bearer <token>", () => {
    expect(extractToken(reqWith({ Authorization: "Bearer abc.def.ghi" }))).toBe(
      "abc.def.ghi",
    );
  });

  it("retourne null si Authorization ne commence pas par Bearer", () => {
    expect(extractToken(reqWith({ Authorization: "Basic xxx" }))).toBeNull();
  });

  it("extrait le token depuis le cookie gaspe_token", () => {
    expect(extractToken(reqWith({ Cookie: "gaspe_token=abc.def.ghi" }))).toBe(
      "abc.def.ghi",
    );
  });

  it("extrait le token cookie même mélangé avec d'autres cookies", () => {
    expect(
      extractToken(
        reqWith({ Cookie: "other=value; gaspe_token=abc.def.ghi; foo=bar" }),
      ),
    ).toBe("abc.def.ghi");
  });

  it("préfère Authorization Bearer si les deux sont présents", () => {
    expect(
      extractToken(
        reqWith({
          Authorization: "Bearer from-header",
          Cookie: "gaspe_token=from-cookie",
        }),
      ),
    ).toBe("from-header");
  });
});

describe("setTokenCookie", () => {
  it("ajoute un Set-Cookie httpOnly Secure SameSite=Lax", () => {
    const headers = setTokenCookie("abc.def", {
      "Access-Control-Allow-Origin": "*",
    });
    expect(headers["Set-Cookie"]).toContain("gaspe_token=abc.def");
    expect(headers["Set-Cookie"]).toContain("HttpOnly");
    expect(headers["Set-Cookie"]).toContain("SameSite=Lax");
    expect(headers["Set-Cookie"]).toContain("Secure");
    expect(headers["Set-Cookie"]).toContain("Max-Age=604800"); // 7 days
  });

  it("préserve les headers fournis (CORS, etc.)", () => {
    const headers = setTokenCookie("abc", {
      "Access-Control-Allow-Origin": "https://gaspe.fr",
    });
    expect(headers["Access-Control-Allow-Origin"]).toBe("https://gaspe.fr");
  });
});

describe("clearTokenCookie", () => {
  it("efface le cookie via Max-Age=0", () => {
    const headers = clearTokenCookie({});
    expect(headers["Set-Cookie"]).toContain("gaspe_token=;");
    expect(headers["Set-Cookie"]).toContain("Max-Age=0");
    expect(headers["Set-Cookie"]).toContain("HttpOnly");
  });
});

describe("parseStaffPerms", () => {
  it("retourne null pour une entrée null", () => {
    expect(parseStaffPerms(null)).toBeNull();
  });

  it("retourne null pour une entrée vide", () => {
    expect(parseStaffPerms("")).toBeNull();
  });

  it("retourne null pour du JSON invalide", () => {
    expect(parseStaffPerms("not json")).toBeNull();
  });

  it("retourne null pour un JSON non array", () => {
    expect(parseStaffPerms('{"perm": "manage_cms"}')).toBeNull();
  });

  it("retourne null pour un array vide (filtre vide reste array)", () => {
    expect(parseStaffPerms("[]")).toEqual([]);
  });

  it("parse un array de strings", () => {
    expect(parseStaffPerms('["manage_cms", "manage_jobs"]')).toEqual([
      "manage_cms",
      "manage_jobs",
    ]);
  });

  it("filtre les valeurs non-string", () => {
    expect(parseStaffPerms('["manage_cms", 42, null, "manage_jobs", true]')).toEqual([
      "manage_cms",
      "manage_jobs",
    ]);
  });
});
