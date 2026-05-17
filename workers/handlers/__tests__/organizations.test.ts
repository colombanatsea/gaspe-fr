import { describe, it, expect } from "vitest";
import { handleListOrganizations } from "../organizations";
import {
  createMockD1,
  makeMockEnv,
  makeRequest,
  TEST_CORS_HEADERS,
} from "../../lib/__tests__/mock-d1";

/**
 * PoC handler test avec mock D1 minimal.
 *
 * `handleListOrganizations` est un bon candidat : pas d'auth requise,
 * simple SELECT + filtre archived côté JS. Démontre le pattern pour
 * tester les futures extractions ou refactorings de handlers sans
 * dépendre uniquement de tsc + smoke test prod.
 */
describe("handleListOrganizations (PoC mock D1)", () => {
  it("retourne 200 + liste vide quand la table est vide", async () => {
    const db = createMockD1();
    db.enqueueAll([]); // SELECT * FROM organizations → 0 ligne

    const env = makeMockEnv({ DB: db as unknown as D1Database });
    const req = makeRequest("https://api.test/api/organizations");
    const res = await handleListOrganizations(req, env, TEST_CORS_HEADERS);

    expect(res.status).toBe(200);
    const body = (await res.json()) as { organizations: unknown[] };
    expect(body.organizations).toEqual([]);
    expect(db.queries[0]).toContain("SELECT * FROM organizations");
  });

  it("mappe les colonnes DB vers le format frontend", async () => {
    const db = createMockD1();
    db.enqueueAll([
      {
        id: "org-1",
        slug: "karu-ferry",
        name: "Karu Ferry",
        category: "compagnie",
        college: "B",
        social3228: 1,
        territory: "outre-mer",
        region: "Guadeloupe",
        city: "Pointe-à-Pitre",
        latitude: 15.979,
        longitude: -61.642,
        logo_url: "/logos/karu.png",
        website_url: "https://karuferry.com",
        address: "Quai Foulon",
        email: "contact@karuferry.com",
        phone: "+590 590 ...",
        description: "Liaison Saintes-Guadeloupe",
        employee_count: 30,
        ship_count: 2,
        membership_status: "paid",
        archived: 0,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2026-05-17T00:00:00Z",
      },
    ]);

    const env = makeMockEnv({ DB: db as unknown as D1Database });
    const res = await handleListOrganizations(
      makeRequest("https://api.test/api/organizations"),
      env,
      TEST_CORS_HEADERS,
    );

    const body = (await res.json()) as { organizations: Array<Record<string, unknown>> };
    expect(body.organizations).toHaveLength(1);
    const org = body.organizations[0];
    expect(org.id).toBe("org-1");
    expect(org.slug).toBe("karu-ferry");
    expect(org.college).toBe("B");
    // social3228 = 1 → true en frontend
    expect(org.social3228).toBe(true);
    // archived = 0 → false (et la ligne est donc incluse)
    expect(org.archived).toBe(false);
    expect(org.latitude).toBe(15.979);
    expect(org.shipCount).toBe(2);
  });

  it("filtre les organisations archivées par défaut", async () => {
    const db = createMockD1();
    db.enqueueAll([
      { id: "org-1", slug: "active", name: "Active", category: "compagnie", college: null, social3228: null, territory: null, region: null, city: null, latitude: null, longitude: null, logo_url: null, website_url: null, address: null, email: null, phone: null, description: null, employee_count: null, ship_count: null, membership_status: null, archived: 0, created_at: "", updated_at: "" },
      { id: "org-2", slug: "archived-org", name: "Archived", category: "compagnie", college: null, social3228: null, territory: null, region: null, city: null, latitude: null, longitude: null, logo_url: null, website_url: null, address: null, email: null, phone: null, description: null, employee_count: null, ship_count: null, membership_status: null, archived: 1, created_at: "", updated_at: "" },
    ]);

    const env = makeMockEnv({ DB: db as unknown as D1Database });
    const res = await handleListOrganizations(
      makeRequest("https://api.test/api/organizations"),
      env,
      TEST_CORS_HEADERS,
    );

    const body = (await res.json()) as { organizations: Array<{ slug: string }> };
    expect(body.organizations).toHaveLength(1);
    expect(body.organizations[0].slug).toBe("active");
  });

  it("inclut les organisations archivées si ?include_archived=1", async () => {
    const db = createMockD1();
    db.enqueueAll([
      { id: "org-1", slug: "active", name: "Active", category: "compagnie", college: null, social3228: null, territory: null, region: null, city: null, latitude: null, longitude: null, logo_url: null, website_url: null, address: null, email: null, phone: null, description: null, employee_count: null, ship_count: null, membership_status: null, archived: 0, created_at: "", updated_at: "" },
      { id: "org-2", slug: "archived-org", name: "Archived", category: "compagnie", college: null, social3228: null, territory: null, region: null, city: null, latitude: null, longitude: null, logo_url: null, website_url: null, address: null, email: null, phone: null, description: null, employee_count: null, ship_count: null, membership_status: null, archived: 1, created_at: "", updated_at: "" },
    ]);

    const env = makeMockEnv({ DB: db as unknown as D1Database });
    const res = await handleListOrganizations(
      makeRequest("https://api.test/api/organizations?include_archived=1"),
      env,
      TEST_CORS_HEADERS,
    );

    const body = (await res.json()) as { organizations: Array<{ slug: string; archived: boolean }> };
    expect(body.organizations).toHaveLength(2);
    expect(body.organizations.map((o) => o.archived).sort()).toEqual([false, true]);
  });

  it("préserve les headers CORS dans la réponse", async () => {
    const db = createMockD1();
    db.enqueueAll([]);
    const env = makeMockEnv({ DB: db as unknown as D1Database });
    const res = await handleListOrganizations(
      makeRequest("https://api.test/api/organizations"),
      env,
      TEST_CORS_HEADERS,
    );

    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(res.headers.get("Content-Type")).toBe("application/json");
  });

  it("gère social3228 = 0 comme false (et non undefined)", async () => {
    const db = createMockD1();
    db.enqueueAll([
      { id: "org-1", slug: "c", name: "C", category: "expert", college: "C", social3228: 0, territory: null, region: null, city: null, latitude: null, longitude: null, logo_url: null, website_url: null, address: null, email: null, phone: null, description: null, employee_count: null, ship_count: null, membership_status: null, archived: 0, created_at: "", updated_at: "" },
    ]);
    const env = makeMockEnv({ DB: db as unknown as D1Database });
    const res = await handleListOrganizations(
      makeRequest("https://api.test/api/organizations"),
      env,
      TEST_CORS_HEADERS,
    );

    const body = (await res.json()) as { organizations: Array<{ social3228: boolean }> };
    expect(body.organizations[0].social3228).toBe(false);
  });
});
