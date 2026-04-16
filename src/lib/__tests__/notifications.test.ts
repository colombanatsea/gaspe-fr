import { describe, it, expect, beforeEach } from "vitest";
import {
  addNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  NOTIFICATIONS_KEY,
} from "../notifications";

describe("notifications", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("addNotification", () => {
    it("creates a notification with generated id, date and read=false", () => {
      const notif = addNotification({
        userId: "user-1",
        type: "offer_new",
        title: "Nouvelle offre",
        message: "Une offre de capitaine est disponible",
      });

      expect(notif.id).toMatch(/^notif-/);
      expect(notif.createdAt).toBeTruthy();
      expect(notif.read).toBe(false);
      expect(notif.userId).toBe("user-1");
      expect(notif.type).toBe("offer_new");
    });

    it("persists to localStorage", () => {
      addNotification({
        userId: "user-1",
        type: "membership_approved",
        title: "Adhésion validée",
        message: "Votre adhésion a été validée",
      });

      const stored = JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || "[]");
      expect(stored).toHaveLength(1);
      expect(stored[0].title).toBe("Adhésion validée");
    });
  });

  describe("getNotifications", () => {
    it("returns notifications for a specific user only", () => {
      addNotification({ userId: "user-1", type: "offer_new", title: "A", message: "a" });
      addNotification({ userId: "user-2", type: "offer_new", title: "B", message: "b" });
      addNotification({ userId: "user-1", type: "agenda_new", title: "C", message: "c" });

      const notifs = getNotifications("user-1");
      expect(notifs).toHaveLength(2);
      expect(notifs.every((n) => n.userId === "user-1")).toBe(true);
    });

    it("returns notifications sorted newest first", () => {
      // Add with slight delay simulation via manual dates
      addNotification({ userId: "u1", type: "offer_new", title: "First", message: "m" });
      addNotification({ userId: "u1", type: "offer_new", title: "Second", message: "m" });

      // Force different dates
      const stored = JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || "[]");
      stored[0].createdAt = "2025-01-01T00:00:00Z";
      stored[1].createdAt = "2025-06-01T00:00:00Z";
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(stored));

      const result = getNotifications("u1");
      expect(result[0].title).toBe("Second");
      expect(result[1].title).toBe("First");
    });

    it("returns empty array for unknown user", () => {
      expect(getNotifications("unknown")).toEqual([]);
    });

    it("handles corrupt localStorage gracefully", () => {
      localStorage.setItem(NOTIFICATIONS_KEY, "invalid json{{{");
      expect(getNotifications("user-1")).toEqual([]);
    });
  });

  describe("markAsRead", () => {
    it("marks a single notification as read", () => {
      const notif = addNotification({ userId: "u1", type: "offer_new", title: "T", message: "m" });
      expect(notif.read).toBe(false);

      markAsRead(notif.id);

      const updated = getNotifications("u1");
      expect(updated[0].read).toBe(true);
    });

    it("does nothing for unknown notification id", () => {
      addNotification({ userId: "u1", type: "offer_new", title: "T", message: "m" });
      markAsRead("nonexistent-id"); // should not throw
      expect(getNotifications("u1")[0].read).toBe(false);
    });
  });

  describe("markAllAsRead", () => {
    it("marks all notifications for a user as read", () => {
      addNotification({ userId: "u1", type: "offer_new", title: "A", message: "m" });
      addNotification({ userId: "u1", type: "agenda_new", title: "B", message: "m" });
      addNotification({ userId: "u2", type: "offer_new", title: "C", message: "m" });

      markAllAsRead("u1");

      expect(getNotifications("u1").every((n) => n.read)).toBe(true);
      expect(getNotifications("u2")[0].read).toBe(false);
    });
  });

  describe("getUnreadCount", () => {
    it("returns count of unread notifications for a user", () => {
      addNotification({ userId: "u1", type: "offer_new", title: "A", message: "m" });
      addNotification({ userId: "u1", type: "offer_new", title: "B", message: "m" });
      addNotification({ userId: "u2", type: "offer_new", title: "C", message: "m" });

      expect(getUnreadCount("u1")).toBe(2);
      expect(getUnreadCount("u2")).toBe(1);
      expect(getUnreadCount("unknown")).toBe(0);
    });

    it("decreases when notifications are marked as read", () => {
      const n1 = addNotification({ userId: "u1", type: "offer_new", title: "A", message: "m" });
      addNotification({ userId: "u1", type: "offer_new", title: "B", message: "m" });

      expect(getUnreadCount("u1")).toBe(2);
      markAsRead(n1.id);
      expect(getUnreadCount("u1")).toBe(1);
      markAllAsRead("u1");
      expect(getUnreadCount("u1")).toBe(0);
    });
  });
});
