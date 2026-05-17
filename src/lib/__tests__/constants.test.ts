import { describe, it, expect } from "vitest";
import { SITE_VERSION } from "../constants";
import pkg from "../../../package.json";

describe("SITE_VERSION", () => {
  /**
   * Anti-drift : la version exposée dans `src/lib/constants.ts` doit
   * toujours correspondre à `package.json` car elle est affichée dans
   * le footer public + admin dashboard. Drift accumulé 2.51.0 → 2.70.0
   * (19 releases) repéré le 2026-05-17, corrigé J1 vague 8 finalize.
   *
   * Reflexe de release : bump package.json + constants.ts au même commit.
   */
  it("est aligné sur la version de package.json", () => {
    expect(SITE_VERSION).toBe(pkg.version);
  });

  it("respecte le format semver X.Y.Z", () => {
    expect(SITE_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
