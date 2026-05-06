/* ------------------------------------------------------------------ */
/*  formations-store.test.ts                                           */
/*  Tests unitaires des helpers purs (sans dépendance API/localStorage). */
/*  Couvre P0-3 du rapport docs/PRODUCTION-SAFETY-2026.md (deadline).  */
/* ------------------------------------------------------------------ */

import { describe, it, expect } from "vitest";
import {
  isRegistrationClosed,
  type StoredFormation,
} from "@/lib/formations-store";

function fakeFormation(partial: Partial<StoredFormation> = {}): StoredFormation {
  return {
    id: "form-test",
    title: "Formation test",
    description: "",
    organizer: "ENSM",
    startDate: "2026-06-01",
    endDate: "2026-06-05",
    location: "Le Havre",
    duration: "5 jours",
    capacity: 20,
    targetAudience: "Marin pont",
    prerequisites: "",
    price: "Gratuit",
    contactEmail: "test@example.com",
    status: "open",
    ...partial,
  } as StoredFormation;
}

describe("isRegistrationClosed", () => {
  it("retourne false si la formation n'a pas de deadline", () => {
    const f = fakeFormation();
    expect(isRegistrationClosed(f, new Date("2030-01-01"))).toBe(false);
  });

  it("retourne false quand la deadline est dans le futur", () => {
    const f = fakeFormation({ registrationDeadline: "2026-12-31" });
    expect(isRegistrationClosed(f, new Date("2026-06-01"))).toBe(false);
  });

  it("retourne true quand la deadline est dans le passé", () => {
    const f = fakeFormation({ registrationDeadline: "2026-01-01" });
    expect(isRegistrationClosed(f, new Date("2026-06-01"))).toBe(true);
  });

  it("retourne true à la seconde près après minuit + 1 sec", () => {
    const f = fakeFormation({ registrationDeadline: "2026-06-01" });
    // ISO "2026-06-01" parse à 00:00:00 UTC. 00:00:01 UTC est strictement après.
    expect(isRegistrationClosed(f, new Date("2026-06-01T00:00:01Z"))).toBe(true);
  });

  it("retourne true si isArchived même sans deadline", () => {
    const f = fakeFormation({ isArchived: true });
    expect(isRegistrationClosed(f, new Date("2026-06-01"))).toBe(true);
  });

  it("retourne false sur deadline malformée (rétro-compat)", () => {
    const f = fakeFormation({ registrationDeadline: "pas-une-date" });
    expect(isRegistrationClosed(f, new Date("2026-06-01"))).toBe(false);
  });

  it("utilise new Date() par défaut si now omis", () => {
    const f = fakeFormation({ registrationDeadline: "1970-01-01" });
    // Toute date actuelle est après 1970 — donc closed.
    expect(isRegistrationClosed(f)).toBe(true);
  });

  it("respecte les fuseaux horaires (UTC strict)", () => {
    const f = fakeFormation({ registrationDeadline: "2026-06-01T23:59:59Z" });
    // Avant la deadline UTC : pas closed
    expect(isRegistrationClosed(f, new Date("2026-06-01T23:00:00Z"))).toBe(false);
    // Juste après : closed
    expect(isRegistrationClosed(f, new Date("2026-06-02T00:00:00Z"))).toBe(true);
  });
});
