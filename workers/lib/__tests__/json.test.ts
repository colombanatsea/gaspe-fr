import { describe, it, expect } from "vitest";
import { json } from "../json";

describe("json helper", () => {
  it("retourne une Response avec status 200 par défaut", () => {
    const res = json({ ok: true }, {});
    expect(res.status).toBe(200);
  });

  it("sérialise le payload en JSON", async () => {
    const res = json({ foo: "bar" }, {});
    expect(await res.text()).toBe('{"foo":"bar"}');
  });

  it("Content-Type forcé à application/json", () => {
    const res = json({}, {});
    expect(res.headers.get("Content-Type")).toBe("application/json");
  });

  it("propage les headers CORS fournis", () => {
    const res = json({}, { "Access-Control-Allow-Origin": "https://gaspe.fr" });
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("https://gaspe.fr");
  });

  it("accepte un statut personnalisé", () => {
    const res = json({ error: "Not Found" }, {}, 404);
    expect(res.status).toBe(404);
  });

  it("fusionne extraHeaders avec corsHeaders", () => {
    const res = json({}, { "X-A": "1" }, 200, { "X-B": "2" });
    expect(res.headers.get("X-A")).toBe("1");
    expect(res.headers.get("X-B")).toBe("2");
  });

  it("le Content-Type override n'est pas écrasé par extraHeaders sans Content-Type", () => {
    const res = json({}, {}, 200, { "X-Foo": "bar" });
    expect(res.headers.get("Content-Type")).toBe("application/json");
  });

  it("gère les valeurs null/array/nested", async () => {
    const res = json({ a: null, b: [1, 2], c: { d: true } }, {});
    expect(await res.json()).toEqual({ a: null, b: [1, 2], c: { d: true } });
  });
});
