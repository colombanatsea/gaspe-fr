import { describe, it, expect } from "vitest";
import {
  getStepAtAge,
  CAREER_PATHS,
  PATH_LABELS,
  type CareerPathKey,
} from "@/data/career-salary";

const PATHS: CareerPathKey[] = ["pont", "machine", "service", "polyvalent"];

describe("data/career-salary – CAREER_PATHS structure", () => {
  it("expose les 4 parcours attendus", () => {
    expect(Object.keys(CAREER_PATHS).sort()).toEqual([
      "machine",
      "polyvalent",
      "pont",
      "service",
    ]);
  });

  it("chaque parcours a un libellé", () => {
    for (const path of PATHS) {
      expect(PATH_LABELS[path]).toBeTruthy();
    }
  });

  it("chaque parcours a au moins 5 jalons et termine sur la retraite ENIM", () => {
    for (const path of PATHS) {
      const steps = CAREER_PATHS[path];
      expect(steps.length).toBeGreaterThanOrEqual(5);
      const last = steps[steps.length - 1];
      expect(last.role).toBe("Retraite ENIM");
      expect(last.age).toBe(55);
      expect(last.salaryNet).toBe(0);
    }
  });

  it("chaque parcours a ses jalons triés par âge croissant", () => {
    for (const path of PATHS) {
      const steps = CAREER_PATHS[path];
      for (let i = 1; i < steps.length; i++) {
        expect(steps[i].age).toBeGreaterThan(steps[i - 1].age);
      }
    }
  });
});

describe("data/career-salary – getStepAtAge", () => {
  it("parcours pont", () => {
    expect(getStepAtAge("pont", 17).role).toBe("Élève LPM (alternance)");
    expect(getStepAtAge("pont", 22).role).toBe("Lieutenant – Capitaine 200");
    expect(getStepAtAge("pont", 30).role).toBe("Capitaine de ferry");
    expect(getStepAtAge("pont", 38).role).toBe("Capitaine senior / formateur");
    expect(getStepAtAge("pont", 55).role).toBe("Retraite ENIM");
    expect(getStepAtAge("pont", 60).role).toBe("Retraite ENIM");
  });

  it("parcours machine", () => {
    expect(getStepAtAge("machine", 17).role).toBe("Élève LPM (alternance)");
    expect(getStepAtAge("machine", 22).role).toBe("Officier mécanicien – 750 kW");
    expect(getStepAtAge("machine", 30).role).toBe("Chef mécanicien");
    expect(getStepAtAge("machine", 38).role).toBe("Chef mécanicien senior / armement");
    expect(getStepAtAge("machine", 55).role).toBe("Retraite ENIM");
    expect(getStepAtAge("machine", 60).role).toBe("Retraite ENIM");
  });

  it("parcours service", () => {
    expect(getStepAtAge("service", 17).role).toBe("Élève LPM (alternance)");
    expect(getStepAtAge("service", 22).role).toBe("Maître d'hôtel / agent passagers");
    expect(getStepAtAge("service", 30).role).toBe("Commissaire / chef hôtelier");
    expect(getStepAtAge("service", 38).role).toBe("Commissaire / chef hôtelier");
    expect(getStepAtAge("service", 55).role).toBe("Retraite ENIM");
    expect(getStepAtAge("service", 60).role).toBe("Retraite ENIM");
  });

  it("parcours polyvalent (officier ENSM, démarre à 18 ans)", () => {
    expect(getStepAtAge("polyvalent", 17).role).toBe("Élève ENSM 1ère année");
    expect(getStepAtAge("polyvalent", 22).role).toBe("Élève officier embarqué");
    expect(getStepAtAge("polyvalent", 30).role).toBe("Capitaine ou chef mécanicien");
    expect(getStepAtAge("polyvalent", 38).role).toBe("Direction technique / DPA armateur");
    expect(getStepAtAge("polyvalent", 55).role).toBe("Retraite ENIM");
    expect(getStepAtAge("polyvalent", 60).role).toBe("Retraite ENIM");
  });

  it("renvoie le premier jalon si l'âge demandé est inférieur au premier jalon", () => {
    expect(getStepAtAge("pont", 10).age).toBe(17);
    expect(getStepAtAge("polyvalent", 10).age).toBe(18);
  });

  it("clamp au dernier jalon (retraite) au-delà de 55 ans", () => {
    for (const path of PATHS) {
      const step100 = getStepAtAge(path, 100);
      expect(step100.role).toBe("Retraite ENIM");
      expect(step100.age).toBe(55);
    }
  });
});
