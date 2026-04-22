"use client";

import type { User } from "@/lib/auth/AuthContext";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface Props {
  user: User;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function daysBetween(start: string, end: string): number {
  return Math.round(
    (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)
  );
}

export function EnmProfileDisplay({ user }: Props) {
  const seaService = (user.seaService ?? []).filter((s) => s.source === "enm_csv");
  const certs = user.structuredCertifications ?? [];
  const medical = user.medicalAptitude;

  if (seaService.length === 0 && certs.length === 0 && !medical?.decision) {
    return null;
  }

  const totalSeaDays = seaService.reduce((sum, s) => {
    if (!s.endDate) return sum;
    return sum + Math.max(0, daysBetween(s.startDate, s.endDate));
  }, 0);

  const validCerts = certs.filter((c) => c.status === "valid").length;
  const expiredCerts = certs.filter((c) => c.status === "expired").length;

  const medicalExpired = medical?.expiryDate
    ? new Date(medical.expiryDate) < new Date()
    : false;

  // Group sea service by year
  const serviceByYear = new Map<number, typeof seaService>();
  seaService
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
    .forEach((s) => {
      const year = new Date(s.startDate).getFullYear();
      if (!serviceByYear.has(year)) serviceByYear.set(year, []);
      serviceByYear.get(year)!.push(s);
    });

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#000091]/10">
          <svg className="h-5 w-5 text-[#000091]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15a2.25 2.25 0 0 1 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
          </svg>
        </div>
        <div>
          <h2 className="font-heading text-xl font-semibold text-foreground">Donnees ENM importees</h2>
          <p className="text-xs text-foreground-muted">
            {user.enmMarinId && <>N° marin {user.enmMarinId} &middot; </>}
            {totalSeaDays} jours de mer &middot; {certs.length} titre{certs.length > 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border-light bg-background p-3 text-center">
          <p className="text-lg font-bold font-heading text-primary">{totalSeaDays}</p>
          <p className="text-[10px] text-foreground-muted uppercase tracking-wider">Jours de mer</p>
        </div>
        <div className="rounded-xl border border-border-light bg-background p-3 text-center">
          <p className="text-lg font-bold font-heading text-foreground">{seaService.length}</p>
          <p className="text-[10px] text-foreground-muted uppercase tracking-wider">Embarquements</p>
        </div>
        <div className="rounded-xl border border-border-light bg-background p-3 text-center">
          <p className="text-lg font-bold font-heading text-green-600">{validCerts}</p>
          <p className="text-[10px] text-foreground-muted uppercase tracking-wider">Brevets valides</p>
        </div>
        <div className="rounded-xl border border-border-light bg-background p-3 text-center">
          <p className={`text-lg font-bold font-heading ${medicalExpired ? "text-red-500" : "text-green-600"}`}>
            {medical?.decision ? (medicalExpired ? "Expiree" : "Valide") : "–"}
          </p>
          <p className="text-[10px] text-foreground-muted uppercase tracking-wider">Aptitude med.</p>
        </div>
      </div>

      {/* Sea service timeline */}
      {seaService.length > 0 && (
        <Card>
          <CardTitle className="flex items-center gap-2 mb-4">
            <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 17h1l1-5h14l1 5h1M5 17l-2 4h18l-2-4" />
            </svg>
            Lignes de service ({seaService.length})
          </CardTitle>

          <div className="space-y-6">
            {Array.from(serviceByYear.entries()).map(([year, services]) => (
              <div key={year}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold text-primary bg-[var(--gaspe-teal-50)] rounded-lg px-2 py-0.5">
                    {year}
                  </span>
                  <div className="flex-1 h-px bg-border-light" />
                </div>

                <div className="space-y-2 pl-3 border-l-2 border-[var(--gaspe-teal-200)]">
                  {services.map((s) => {
                    const days = s.endDate ? daysBetween(s.startDate, s.endDate) : 0;
                    return (
                      <div key={s.id} className="relative pl-4">
                        {/* Timeline dot */}
                        <div className="absolute -left-[9px] top-2 h-3 w-3 rounded-full border-2 border-[var(--gaspe-teal-400)] bg-background" />

                        <div className="rounded-lg border border-border-light p-3 hover:border-[var(--gaspe-teal-200)] transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-foreground">
                                {s.vesselName}
                                {s.vesselImo && (
                                  <span className="ml-1 text-xs text-foreground-muted font-normal">
                                    IMO {s.vesselImo}
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-foreground-muted mt-0.5">
                                {s.rank}
                                {s.category && <> &middot; Cat. {s.category}</>}
                              </p>
                            </div>
                            <Badge variant="neutral">{days}j</Badge>
                          </div>
                          <p className="text-xs text-foreground-muted mt-1">
                            {formatDate(s.startDate)}
                            {s.endDate && <> – {formatDate(s.endDate)}</>}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Certificates */}
      {certs.length > 0 && (
        <Card>
          <CardTitle className="flex items-center gap-2 mb-4">
            <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
            </svg>
            Titres et brevets ({certs.length})
            <span className="ml-auto flex gap-1.5">
              {validCerts > 0 && <Badge variant="green">{validCerts} valide{validCerts > 1 ? "s" : ""}</Badge>}
              {expiredCerts > 0 && <Badge variant="neutral">{expiredCerts} expire{expiredCerts > 1 ? "s" : ""}</Badge>}
            </span>
          </CardTitle>

          <div className="space-y-2">
            {certs
              .sort((a, b) => {
                // Valid first, then by expiry
                if (a.status === "valid" && b.status !== "valid") return -1;
                if (a.status !== "valid" && b.status === "valid") return 1;
                return 0;
              })
              .map((c) => {
                const isExpired = c.status === "expired";
                const isExpiringSoon = !isExpired && c.expiryDate &&
                  daysBetween(new Date().toISOString(), c.expiryDate) < 90 &&
                  daysBetween(new Date().toISOString(), c.expiryDate) > 0;

                return (
                  <div
                    key={c.certId}
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 transition-colors ${
                      isExpired
                        ? "border-[var(--gaspe-neutral-200)] bg-[var(--gaspe-neutral-50)]"
                        : isExpiringSoon
                          ? "border-amber-200 bg-amber-50"
                          : "border-green-200 bg-green-50"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium ${isExpired ? "text-foreground-muted" : "text-foreground"}`}>
                        {c.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5">
                        {c.enmReference && (
                          <span className="text-xs text-foreground-muted">N° {c.enmReference}</span>
                        )}
                        {c.expiryDate && (
                          <span className={`text-xs ${isExpired ? "text-red-500" : isExpiringSoon ? "text-amber-600" : "text-foreground-muted"}`}>
                            {isExpired ? "Expire le" : "Valide jusqu'au"} {formatDate(c.expiryDate)}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge variant={isExpired ? "neutral" : isExpiringSoon ? "warm" : "green"}>
                      {isExpired ? "Expire" : isExpiringSoon ? "Bientot" : "Valide"}
                    </Badge>
                  </div>
                );
              })}
          </div>
        </Card>
      )}

      {/* Medical aptitude */}
      {medical?.decision && (
        <Card>
          <CardTitle className="flex items-center gap-2 mb-4">
            <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
            </svg>
            Aptitude medicale
          </CardTitle>

          <div className={`rounded-xl border p-4 ${medicalExpired ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}`}>
            <div className="flex items-center gap-3 mb-3">
              <Badge variant={medicalExpired ? "neutral" : "green"}>
                {medicalExpired ? "Expiree" : "Valide"}
              </Badge>
              <span className="text-sm font-medium text-foreground">{medical.decision}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {medical.visitType && (
                <div>
                  <p className="text-[10px] text-foreground-muted uppercase tracking-wider mb-0.5">Type visite</p>
                  <p className="text-sm text-foreground">{medical.visitType}</p>
                </div>
              )}
              {medical.lastVisitDate && (
                <div>
                  <p className="text-[10px] text-foreground-muted uppercase tracking-wider mb-0.5">Derniere visite</p>
                  <p className="text-sm text-foreground">{formatDate(medical.lastVisitDate)}</p>
                </div>
              )}
              {medical.expiryDate && (
                <div>
                  <p className="text-[10px] text-foreground-muted uppercase tracking-wider mb-0.5">Validite</p>
                  <p className={`text-sm font-medium ${medicalExpired ? "text-red-600" : "text-green-700"}`}>
                    {formatDate(medical.expiryDate)}
                  </p>
                </div>
              )}
              {medical.duration && (
                <div>
                  <p className="text-[10px] text-foreground-muted uppercase tracking-wider mb-0.5">Duree</p>
                  <p className="text-sm text-foreground">{medical.duration}</p>
                </div>
              )}
            </div>

            {medical.restrictions && medical.restrictions.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border-light">
                <p className="text-[10px] text-foreground-muted uppercase tracking-wider mb-1.5">Restrictions</p>
                <div className="flex flex-wrap gap-1.5">
                  {medical.restrictions.map((r) => (
                    <span key={r} className="rounded-full bg-amber-100 border border-amber-200 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </section>
  );
}
