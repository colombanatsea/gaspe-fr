"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { CmsPageHeader } from "@/components/shared/CmsPageHeader";
import { useCmsContent } from "@/lib/use-cms";
import { getCmsDefault } from "@/data/cms-defaults";
import { ScrollRevealWrapper } from "@/components/shared/ScrollRevealWrapper";
import { formatDate } from "@/lib/utils";
import type { AgendaEvent } from "@/app/(admin)/admin/agenda/page";

const AGENDA_KEY = "gaspe_agenda";

function getPublishedEvents(): AgendaEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const all: AgendaEvent[] = JSON.parse(localStorage.getItem(AGENDA_KEY) ?? "[]");
    return all
      .filter((e) => e.published)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  } catch {
    return [];
  }
}

export default function AgendaPage() {
  const { user } = useAuth();
  const [events] = useState<AgendaEvent[]>(getPublishedEvents);

  const isAdherent = user && (user.role === "adherent" || user.role === "admin");
  const emptyStateMessage = useCmsContent("agenda", "empty-state-message", getCmsDefault("agenda", "empty-state-message"));
  const restrictedNotice = useCmsContent("agenda", "restricted-notice", getCmsDefault("agenda", "restricted-notice"));

  return (
    <>
      <CmsPageHeader
        pageId="agenda"
        defaultTitle="Agenda"
        defaultDescription="Les événements du GASPE et du secteur maritime."
        breadcrumbs={[{ label: "Agenda" }]}
      />

      <ScrollRevealWrapper className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {events.length === 0 ? (
          <div className="rounded-xl border border-[var(--gaspe-neutral-200)] bg-white p-12 text-center">
            <p className="text-foreground-muted">{emptyStateMessage}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((ev, i) => {
              const startDt = new Date(ev.startDate);
              const dateStr = formatDate(ev.startDate) +
                (ev.endDate && ev.endDate !== ev.startDate ? ` – ${formatDate(ev.endDate)}` : "");

              return (
                <article
                  key={ev.id}
                  className={`flex gap-6 rounded-xl bg-white p-6 border border-[var(--gaspe-neutral-200)] border-l-[3px] border-l-[var(--gaspe-teal-600)] hover:border-[var(--gaspe-teal-200)] transition-colors reveal stagger-${i + 1}`}
                >
                  {/* Date block */}
                  <div className="hidden sm:flex shrink-0 flex-col items-center justify-center w-20 h-20 rounded-xl bg-[var(--gaspe-teal-50)]">
                    <span className="font-heading text-2xl font-bold text-[var(--gaspe-teal-600)] leading-tight">
                      {startDt.getDate()}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-[var(--gaspe-teal-600)]">
                      {startDt.toLocaleDateString("fr-FR", { month: "short" })}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading text-lg font-semibold text-foreground">
                      {ev.title}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-foreground-muted">
                      <span>{dateStr}</span>
                      <span className="hidden sm:inline text-[var(--gaspe-neutral-300)]">|</span>
                      <span>{ev.location}</span>
                    </div>

                    {/* Restricted content: description, address, attachments — visible only to adherents/admin */}
                    {isAdherent ? (
                      <>
                        {ev.description && (
                          <p className="mt-2 text-sm text-foreground-muted">{ev.description}</p>
                        )}
                        {ev.address && (
                          <p className="mt-1 text-xs text-foreground-muted">
                            <span className="font-medium">Adresse :</span> {ev.address}
                          </p>
                        )}
                        {ev.eventUrl && (
                          <a href={ev.eventUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-sm text-primary hover:underline">
                            Plus d&apos;infos &rarr;
                          </a>
                        )}
                        {(ev.attachments ?? []).length > 0 && (
                          <div className="mt-3 space-y-1">
                            <p className="text-xs font-semibold text-foreground">Documents</p>
                            {ev.attachments!.map((att) => (
                              <a
                                key={att.id}
                                href={att.data}
                                download={att.name}
                                className="inline-flex items-center gap-2 text-xs rounded-lg bg-[var(--gaspe-neutral-50)] px-3 py-2 text-primary hover:underline mr-2"
                              >
                                <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                  <polyline points="14 2 14 8 20 8" />
                                </svg>
                                {att.name}
                              </a>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="mt-2 text-xs text-foreground-muted italic">
                        {restrictedNotice}
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </ScrollRevealWrapper>
    </>
  );
}
