import { describe, it, expect, beforeEach, vi } from "vitest";
import { getAuthStore, setAuthStore, isApiMode } from "../auth-store";
import type { AuthStore } from "../auth-store";
import type { User } from "../types";

// Reset singleton between tests
beforeEach(() => {
  setAuthStore(null as unknown as AuthStore);
  localStorage.clear();
});

const mockUser: User = {
  id: "test-1",
  email: "test@gaspe.fr",
  name: "Test User",
  role: "candidat",
  approved: true,
  createdAt: "2024-01-01T00:00:00Z",
};

describe("LocalStorageAuthStore", () => {
  it("returns empty arrays/null by default", () => {
    const store = getAuthStore();
    expect(store.getUsers()).toEqual([]);
    expect(store.getPasswords()).toEqual({});
    expect(store.getCurrentUser()).toBeNull();
  });

  it("stores and retrieves users", () => {
    const store = getAuthStore();
    store.setUsers([mockUser]);
    expect(store.getUsers()).toHaveLength(1);
    expect(store.getUsers()[0].email).toBe("test@gaspe.fr");
  });

  it("stores and retrieves passwords", () => {
    const store = getAuthStore();
    store.setPasswords({ "test-1": "hash123" });
    expect(store.getPasswords()).toEqual({ "test-1": "hash123" });
  });

  it("stores and retrieves current user", () => {
    const store = getAuthStore();
    store.setCurrentUser(mockUser);
    const current = store.getCurrentUser();
    expect(current?.id).toBe("test-1");
  });

  it("clears session", () => {
    const store = getAuthStore();
    store.setCurrentUser(mockUser);
    store.clearSession();
    expect(store.getCurrentUser()).toBeNull();
  });

  it("setting current user to null removes from storage", () => {
    const store = getAuthStore();
    store.setCurrentUser(mockUser);
    store.setCurrentUser(null);
    expect(store.getCurrentUser()).toBeNull();
    expect(localStorage.getItem("gaspe_current_user")).toBeNull();
  });

  it("handles corrupted localStorage gracefully", () => {
    localStorage.setItem("gaspe_users", "not valid json!!!");
    const store = getAuthStore();
    // Should return fallback (empty array) instead of throwing
    expect(store.getUsers()).toEqual([]);
  });
});

describe("isApiMode", () => {
  it("returns false when NEXT_PUBLIC_API_URL is not set", () => {
    expect(isApiMode()).toBe(false);
  });
});

describe("setAuthStore (DI)", () => {
  it("allows injecting a mock store", () => {
    const mock: AuthStore = {
      getUsers: () => [mockUser],
      setUsers: vi.fn(),
      getPasswords: () => ({}),
      setPasswords: vi.fn(),
      getCurrentUser: () => mockUser,
      setCurrentUser: vi.fn(),
      clearSession: vi.fn(),
    };
    setAuthStore(mock);
    expect(getAuthStore().getCurrentUser()?.id).toBe("test-1");
    expect(getAuthStore().getUsers()).toHaveLength(1);
  });
});
