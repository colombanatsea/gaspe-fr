"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Badge } from "@/components/ui/Badge";

interface ContactMessage {
  nom: string;
  email: string;
  societe?: string;
  sujet: string;
  message: string;
  date: string;
  read?: boolean;
}

const MESSAGES_KEY = "gaspe_contact_messages";

function readMessages(): ContactMessage[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(MESSAGES_KEY) ?? "[]");
  } catch { return []; }
}

function writeMessages(msgs: ContactMessage[]) {
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(msgs));
}

export default function AdminMessagesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user || user.role !== "admin") { router.push("/connexion"); return; }
    setMessages(readMessages());
  }, [user, router]);

  if (!user || user.role !== "admin") return null;

  const unreadCount = messages.filter((m) => !m.read).length;

  const filtered = messages.filter((m) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return m.nom.toLowerCase().includes(s) || m.email.toLowerCase().includes(s) || m.sujet.toLowerCase().includes(s);
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  function markAsRead(idx: number) {
    const all = readMessages();
    const realIdx = messages.length - 1 - idx; // reverse order
    // Find the actual message in the original array
    const target = filtered[idx];
    const originalIdx = all.findIndex((m) => m.date === target.date && m.email === target.email);
    if (originalIdx >= 0) {
      all[originalIdx].read = true;
      writeMessages(all);
      setMessages(all);
    }
    setSelected(idx);
  }

  function deleteMessage(idx: number) {
    if (!confirm("Supprimer ce message ?")) return;
    const target = filtered[idx];
    const all = readMessages();
    const newAll = all.filter((m) => !(m.date === target.date && m.email === target.email));
    writeMessages(newAll);
    setMessages(newAll);
    setSelected(null);
  }

  const selectedMsg = selected !== null ? filtered[selected] : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Messages de contact</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            {messages.length} message{messages.length !== 1 ? "s" : ""}
            {unreadCount > 0 && (
              <span className="ml-2 text-[var(--gaspe-teal-600)] font-semibold">
                — {unreadCount} non lu{unreadCount !== 1 ? "s" : ""}
              </span>
            )}
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="w-full rounded-xl border border-[var(--gaspe-neutral-200)] bg-white pl-10 pr-4 py-2.5 text-sm focus:border-[var(--gaspe-teal-400)] focus:ring-1 focus:ring-[var(--gaspe-teal-400)] focus:outline-none"
          />
        </div>
      </div>

      {messages.length === 0 ? (
        <div className="rounded-2xl bg-white border border-[var(--gaspe-neutral-200)] p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--gaspe-teal-50)]">
            <svg className="h-8 w-8 text-[var(--gaspe-teal-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
            </svg>
          </div>
          <h3 className="font-heading text-lg font-semibold text-foreground">Aucun message</h3>
          <p className="mt-2 text-sm text-foreground-muted">
            Les messages envoyés via le formulaire de contact apparaîtront ici.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
          {/* Message list */}
          <div className="rounded-2xl bg-white border border-[var(--gaspe-neutral-200)] divide-y divide-[var(--gaspe-neutral-100)] overflow-hidden">
            {filtered.map((msg, i) => (
              <button
                key={`${msg.date}-${msg.email}`}
                onClick={() => markAsRead(i)}
                className={`w-full text-left px-5 py-4 hover:bg-[var(--gaspe-neutral-50)] transition-colors ${
                  selected === i ? "bg-[var(--gaspe-teal-50)]" : ""
                } ${!msg.read ? "border-l-[3px] border-l-[var(--gaspe-teal-600)]" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm truncate ${!msg.read ? "font-semibold text-foreground" : "text-foreground-muted"}`}>
                        {msg.nom}
                      </p>
                      {!msg.read && (
                        <span className="h-2 w-2 rounded-full bg-[var(--gaspe-teal-600)] shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-foreground-muted truncate">{msg.sujet}</p>
                  </div>
                  <span className="text-[10px] text-foreground-muted shrink-0">
                    {new Date(msg.date).toLocaleDateString("fr-FR")}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Message detail */}
          {selectedMsg ? (
            <div className="rounded-2xl bg-white border border-[var(--gaspe-neutral-200)] p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-heading text-lg font-semibold text-foreground">{selectedMsg.sujet}</h3>
                  <p className="text-sm text-foreground-muted mt-1">
                    De : <span className="font-medium text-foreground">{selectedMsg.nom}</span>
                  </p>
                </div>
                <button
                  onClick={() => deleteMessage(selected!)}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-foreground-muted hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  Supprimer
                </button>
              </div>

              <div className="space-y-3 text-sm mb-6">
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-[var(--gaspe-teal-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                  <a href={`mailto:${selectedMsg.email}`} className="text-[var(--gaspe-teal-600)] hover:underline">
                    {selectedMsg.email}
                  </a>
                </div>
                {selectedMsg.societe && (
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-foreground-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                    </svg>
                    <span className="text-foreground-muted">{selectedMsg.societe}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-foreground-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                  </svg>
                  <span className="text-foreground-muted">{new Date(selectedMsg.date).toLocaleString("fr-FR")}</span>
                </div>
              </div>

              <div className="rounded-xl bg-[var(--gaspe-neutral-50)] p-4">
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{selectedMsg.message}</p>
              </div>

              <div className="mt-4">
                <a
                  href={`mailto:${selectedMsg.email}?subject=Re: ${encodeURIComponent(selectedMsg.sujet)}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--gaspe-teal-600)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--gaspe-teal-700)] transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
                  </svg>
                  Répondre
                </a>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-white border border-[var(--gaspe-neutral-200)] p-12 text-center hidden lg:flex items-center justify-center">
              <p className="text-sm text-foreground-muted">Sélectionnez un message</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
