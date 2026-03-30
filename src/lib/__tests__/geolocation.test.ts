import { describe, it, expect } from "vitest";
import { haversineDistance, formatDistance } from "../geolocation";

describe("haversineDistance", () => {
  it("returns 0 for identical points", () => {
    expect(haversineDistance(48.8566, 2.3522, 48.8566, 2.3522)).toBe(0);
  });

  it("computes Paris → Marseille (~660 km)", () => {
    const d = haversineDistance(48.8566, 2.3522, 43.2965, 5.3698);
    expect(d).toBeGreaterThan(640);
    expect(d).toBeLessThan(680);
  });

  it("computes Paris → London (~340 km)", () => {
    const d = haversineDistance(48.8566, 2.3522, 51.5074, -0.1278);
    expect(d).toBeGreaterThan(330);
    expect(d).toBeLessThan(360);
  });

  it("computes short distance Granville → Jersey (~50 km)", () => {
    const d = haversineDistance(48.8380, -1.5967, 49.2144, -2.1312);
    expect(d).toBeGreaterThan(45);
    expect(d).toBeLessThan(60);
  });

  it("is symmetric", () => {
    const d1 = haversineDistance(48.8566, 2.3522, 43.2965, 5.3698);
    const d2 = haversineDistance(43.2965, 5.3698, 48.8566, 2.3522);
    expect(Math.abs(d1 - d2)).toBeLessThan(0.001);
  });
});

describe("formatDistance", () => {
  it("formats sub-km distances in meters", () => {
    expect(formatDistance(0.5)).toBe("500 m");
    expect(formatDistance(0.15)).toBe("150 m");
  });

  it("formats small km with one decimal", () => {
    expect(formatDistance(3.7)).toBe("3.7 km");
    expect(formatDistance(9.9)).toBe("9.9 km");
  });

  it("formats larger distances as rounded km", () => {
    expect(formatDistance(42)).toBe("42 km");
    expect(formatDistance(660.4)).toBe("660 km");
  });
});
