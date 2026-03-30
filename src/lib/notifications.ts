/* ---------- Notification system (localStorage) ---------- */

export const NOTIFICATIONS_KEY = "gaspe_notifications";

export type NotificationType =
  | "offer_new"
  | "formation_open"
  | "membership_approved"
  | "membership_rejected"
  | "document_new"
  | "agenda_new";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  href?: string;
}

/* ---------- Storage helpers ---------- */

function readAll(): Notification[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY);
    return raw ? (JSON.parse(raw) as Notification[]) : [];
  } catch {
    return [];
  }
}

function writeAll(notifications: Notification[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
}

/* ---------- Public API ---------- */

/** Get all notifications for a given user, newest first. */
export function getNotifications(userId: string): Notification[] {
  return readAll()
    .filter((n) => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/** Add a new notification. Returns the created notification. */
export function addNotification(
  notif: Omit<Notification, "id" | "createdAt" | "read">
): Notification {
  const all = readAll();
  const created: Notification = {
    ...notif,
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    read: false,
  };
  all.push(created);
  writeAll(all);
  return created;
}

/** Mark a single notification as read. */
export function markAsRead(notifId: string): void {
  const all = readAll();
  const idx = all.findIndex((n) => n.id === notifId);
  if (idx >= 0) {
    all[idx].read = true;
    writeAll(all);
  }
}

/** Mark all notifications for a user as read. */
export function markAllAsRead(userId: string): void {
  const all = readAll();
  let changed = false;
  for (const n of all) {
    if (n.userId === userId && !n.read) {
      n.read = true;
      changed = true;
    }
  }
  if (changed) writeAll(all);
}

/** Get the count of unread notifications for a user. */
export function getUnreadCount(userId: string): number {
  return readAll().filter((n) => n.userId === userId && !n.read).length;
}
