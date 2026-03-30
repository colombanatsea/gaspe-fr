import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, isHashed } from "../hash";

describe("hashPassword", () => {
  it("returns a 64-character hex string", async () => {
    const hash = await hashPassword("password123", "user@test.fr");
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("is deterministic for same inputs", async () => {
    const h1 = await hashPassword("test", "a@b.com");
    const h2 = await hashPassword("test", "a@b.com");
    expect(h1).toBe(h2);
  });

  it("produces different hashes for different passwords", async () => {
    const h1 = await hashPassword("password1", "user@test.fr");
    const h2 = await hashPassword("password2", "user@test.fr");
    expect(h1).not.toBe(h2);
  });

  it("produces different hashes for different emails (salt)", async () => {
    const h1 = await hashPassword("same", "alice@test.fr");
    const h2 = await hashPassword("same", "bob@test.fr");
    expect(h1).not.toBe(h2);
  });

  it("normalizes email case and whitespace", async () => {
    const h1 = await hashPassword("pwd", "User@Test.FR");
    const h2 = await hashPassword("pwd", "  user@test.fr  ");
    expect(h1).toBe(h2);
  });
});

describe("verifyPassword", () => {
  it("returns true for correct password", async () => {
    const hash = await hashPassword("secret", "user@test.fr");
    expect(await verifyPassword("secret", "user@test.fr", hash)).toBe(true);
  });

  it("returns false for wrong password", async () => {
    const hash = await hashPassword("secret", "user@test.fr");
    expect(await verifyPassword("wrong", "user@test.fr", hash)).toBe(false);
  });

  it("returns false for wrong email", async () => {
    const hash = await hashPassword("secret", "user@test.fr");
    expect(await verifyPassword("secret", "other@test.fr", hash)).toBe(false);
  });
});

describe("isHashed", () => {
  it("returns true for a 64-char hex string", () => {
    expect(isHashed("a".repeat(64))).toBe(true);
    expect(isHashed("0123456789abcdef".repeat(4))).toBe(true);
  });

  it("returns false for plaintext passwords", () => {
    expect(isHashed("admin123")).toBe(false);
    expect(isHashed("short")).toBe(false);
    expect(isHashed("")).toBe(false);
  });

  it("returns false for strings with uppercase hex", () => {
    expect(isHashed("A".repeat(64))).toBe(false);
  });

  it("returns false for 64-char non-hex", () => {
    expect(isHashed("g".repeat(64))).toBe(false);
  });
});
