"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  type Notification,
  type NotificationType,
} from "@/lib/notifications";

/* ---------- Icon helpers ---------- */

function TypeIcon({ type }: { type: NotificationType }) {
  const base = "w-5 h-5 flex-shrink-0";

  switch (type) {
    case "offer_new":
      return (
        <svg className={base} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.075a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V14.15m16.5 0L12 19.5l-8.25-5.35m16.5 0L12 8.85 3.75 14.15M12 8.85V3.75m0 0L9.75 6m2.25-2.25L14.25 6" />
        </svg>
      );
    case "formation_open":
      return (
        <svg className={base} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84 50.717 50.717 0 00-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
        </svg>
      );
    case "membership_approved":
    case "membership_rejected":
      return (
        <svg className={base} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      );
    case "document_new":
      return (
        <svg className={base} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      );
    case "agenda_new":
      return (
        <svg className={base} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
      );
    default:
      return null;
  }
}

/* ---------- Time ago ---------- */

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Il y a ${days} j`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `Il y a ${weeks} sem.`;
  const months = Math.floor(days / 30);
  return `Il y a ${months} mois`;
}

/* ---------- Component ---------- */

export default function NotificationBell() {
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [prevUserId, setPrevUserId] = useState(user?.id);
  const ref = useRef<HTMLDivElement>(null);

  if (prevUserId !== user?.id) {
    setPrevUserId(user?.id);
    if (user) {
      setNotifications(getNotifications(user.id));
      setUnread(getUnreadCount(user.id));
    }
  }

  const refresh = useCallback(() => {
    if (!user) return;
    setNotifications(getNotifications(user.id));
    setUnread(getUnreadCount(user.id));
  }, [user]);

  useEffect(() => {
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  if (!user) return null;

  const handleNotificationClick = (notif: Notification) => {
    markAsRead(notif.id);
    refresh();
    if (notif.href) {
      setOpen(false);
      router.push(notif.href);
    }
  };

  const handleMarkAllRead = () => {
    markAllAsRead(user.id);
    refresh();
  };

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-xl p-2 text-foreground-muted transition-colors hover:bg-surface hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label={`Notifications${unread > 0 ? ` (${unread} non lues)` : ""}`}
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-teal-600 px-1 text-[11px] font-bold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-border-light bg-background shadow-lg sm:w-96">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border-light px-4 py-3">
            <h3 className="font-heading text-sm font-semibold text-foreground">
              Notifications
            </h3>
            {unread > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="rounded-lg px-2 py-1 text-xs font-medium text-teal-600 transition-colors hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                Tout marquer comme lu
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-foreground-muted">
                Aucune notification
              </div>
            ) : (
              <ul>
                {notifications.map((notif) => (
                  <li key={notif.id}>
                    <button
                      onClick={() => handleNotificationClick(notif)}
                      className={`flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-surface ${
                        !notif.read ? "bg-teal-50/40" : ""
                      }`}
                    >
                      {/* Unread dot */}
                      <div className="flex flex-col items-center pt-1">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            notif.read ? "bg-transparent" : "bg-teal-600"
                          }`}
                        />
                      </div>

                      {/* Type icon */}
                      <div className="mt-0.5 text-teal-600">
                        <TypeIcon type={notif.type} />
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {notif.title}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-foreground-muted">
                          {notif.message}
                        </p>
                        <p className="mt-1 text-[11px] text-foreground-muted">
                          {timeAgo(notif.createdAt)}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
