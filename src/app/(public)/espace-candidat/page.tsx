"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { STCW_CERTIFICATIONS, STCW_CATEGORY_LABELS, type STCWCategory } from "@/data/stcw";
import { useAuth, type User, type ApplicationStatus, APPLICATION_STATUS_CONFIG } from "@/lib/auth/AuthContext";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { publishedJobs } from "@/data/jobs";
import { computeMatchScore, MATCH_COLORS } from "@/lib/matching";

const FORMATIONS_KEY = "gaspe_formations";

function profileCompletion(user: User): number {
  const fields = [user.name, user.email, user.phone, user.currentPosition, user.desiredPosition];
  const filled = fields.filter((f) => f && f.trim() !== "").length;
  return Math.round((filled / fields.length) * 100);
}

export default function EspaceCandidatPage() {
  const { user, updateUser } = useAuth();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    currentPosition: "",
    desiredPosition: "",
    phone: "",
    experience: "",
    certifications: "",
    cvFilename: "",
  });
  const [formationsCount, setFormationsCount] = useState(0);

  useEffect(() => {
    if (!user || user.role !== "candidat") {
      router.push("/connexion");
      return;
    }
    setForm({
      currentPosition: user.currentPosition ?? "",
      desiredPosition: user.desiredPosition ?? "",
      phone: user.phone ?? "",
      experience: user.experience ?? "",
      certifications: user.certifications ?? "",
      cvFilename: user.cvFilename ?? "",
    });

    // Count formations
    try {
      const formations = JSON.parse(localStorage.getItem(FORMATIONS_KEY) ?? "[]");
      setFormationsCount(formations.length);
    } catch { /* empty */ }
  }, [user, router]);

  const handleSaveProfile = useCallback(() => {
    if (!user) return;
    updateUser({
      ...user,
      currentPosition: form.currentPosition,
      desiredPosition: form.desiredPosition,
      phone: form.phone,
      experience: form.experience,
      certifications: form.certifications,
      cvFilename: form.cvFilename,
    } as User);
    setEditing(false);
  }, [user, form, updateUser]);

  const [cvError, setCvError] = useState("");

  const handleCvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setCvError("");
    if (!file) return;
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedTypes.includes(file.type)) {
      setCvError("Format accepté : PDF, DOC ou DOCX uniquement.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setCvError("Le fichier ne doit pas dépasser 5 Mo.");
      return;
    }
    setForm((p) => ({ ...p, cvFilename: file.name }));
  };

  if (!user || user.role !== "candidat") return null;

  const completion = profileCompletion(user);
  const savedOffers = user.savedOffers ?? [];
  const applications = user.applications ?? [];

  const inputClass =
    "mt-1 block w-full rounded-lg border border-border-light bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

  // Resolve saved offers to actual job data
  const savedJobDetails = savedOffers.map((slug) => {
    const job = publishedJobs.find((j) => j.slug === slug || j.id === slug);
    return job ?? null;
  }).filter(Boolean);

  const dashboardCards = [
    {
      title: "Offres d'emploi",
      href: "/nos-compagnies-recrutent",
      count: publishedJobs.length,
      description: "Parcourir les offres disponibles",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
          <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      ),
    },
    {
      title: "Mes candidatures",
      href: "#candidatures",
      count: applications.length,
      description: "Suivre mes candidatures",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      ),
    },
    {
      title: "Offres sauvegardées",
      href: "#saved",
      count: savedOffers.length,
      description: "Mes offres favorites",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      title: "Formations disponibles",
      href: "/espace-candidat/formations",
      count: formationsCount,
      description: "Découvrir les formations",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
          <path d="M6 12v5c3 3 9 3 12 0v-5" />
        </svg>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-foreground">
          Espace Candidat
        </h1>
        <p className="mt-1 text-foreground-muted">
          Bienvenue, <span className="font-semibold text-foreground">{user.name}</span>
        </p>
      </div>

      {/* Dashboard cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {dashboardCards.map((card) => {
          const isAnchor = card.href.startsWith("#");
          const Wrapper = isAnchor ? "a" : Link;
          return (
            <Wrapper key={card.title} href={card.href} className="block group">
              <Card className="hover:shadow-md transition-shadow h-full">
                <div className="flex items-start gap-3">
                  <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-lg bg-surface-teal text-primary">
                    {card.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-heading text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        {card.title}
                      </p>
                      <Badge variant="teal">{card.count}</Badge>
                    </div>
                    <p className="text-xs text-foreground-muted mt-0.5">{card.description}</p>
                  </div>
                </div>
              </Card>
            </Wrapper>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Profile */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-xl font-semibold text-foreground">Mon profil</h2>
              {!editing && (
                <Button variant="secondary" onClick={() => setEditing(true)}>
                  Modifier
                </Button>
              )}
            </div>
            <Card>
              {/* Completion bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground">Profil complété</span>
                  <span className="text-sm font-bold text-primary">{completion}%</span>
                </div>
                <div className="h-2 rounded-full bg-surface overflow-hidden">
                  <div
                    className="h-full rounded-full gaspe-gradient transition-all duration-500"
                    style={{ width: `${completion}%` }}
                  />
                </div>
              </div>

              {editing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground">Téléphone</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground">Poste actuel</label>
                    <input
                      type="text"
                      value={form.currentPosition}
                      onChange={(e) => setForm((p) => ({ ...p, currentPosition: e.target.value }))}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground">Poste recherché</label>
                    <input
                      type="text"
                      value={form.desiredPosition}
                      onChange={(e) => setForm((p) => ({ ...p, desiredPosition: e.target.value }))}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground">Expérience professionnelle</label>
                    <textarea
                      rows={3}
                      value={form.experience}
                      onChange={(e) => setForm((p) => ({ ...p, experience: e.target.value }))}
                      className={inputClass}
                      placeholder="Décrivez votre expérience maritime..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Certifications STCW &amp; brevets</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {form.certifications.split(",").filter(Boolean).map((cert) => {
                        const trimmed = cert.trim();
                        return (
                          <span key={trimmed} className="inline-flex items-center gap-1 rounded-full bg-[var(--gaspe-teal-50)] px-3 py-1 text-xs font-medium text-[var(--gaspe-teal-600)] border border-[var(--gaspe-teal-200)]">
                            {trimmed}
                            <button
                              type="button"
                              onClick={() => {
                                const certs = form.certifications.split(",").map(c => c.trim()).filter(c => c && c !== trimmed);
                                setForm((p) => ({ ...p, certifications: certs.join(", ") }));
                              }}
                              className="hover:text-[var(--gaspe-teal-800)] cursor-pointer"
                            >
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </span>
                        );
                      })}
                    </div>
                    <select
                      className={inputClass}
                      value=""
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) return;
                        const existing = form.certifications.split(",").map(c => c.trim()).filter(Boolean);
                        if (!existing.includes(val)) {
                          setForm((p) => ({ ...p, certifications: [...existing, val].join(", ") }));
                        }
                      }}
                    >
                      <option value="">+ Ajouter une certification...</option>
                      {(["pont", "machine", "securite", "radio"] as STCWCategory[]).map((cat) => (
                        <optgroup key={cat} label={STCW_CATEGORY_LABELS[cat]}>
                          {STCW_CERTIFICATIONS.filter(c => c.category === cat).map((cert) => (
                            <option key={cert.code} value={cert.frenchName}>
                              {cert.frenchName} ({cert.stcwRef})
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-foreground-muted">Sélectionnez vos certifications dans la liste ou saisissez-les ci-dessous.</p>
                    <input
                      type="text"
                      value={form.certifications}
                      onChange={(e) => setForm((p) => ({ ...p, certifications: e.target.value }))}
                      className={`${inputClass} mt-1`}
                      placeholder="Saisie libre : CFBS, Capitaine 500..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground">CV</label>
                    <div className="mt-1 flex items-center gap-3">
                      <label className="cursor-pointer rounded-lg border-2 border-dashed border-border-light px-4 py-3 hover:border-primary transition-colors flex-1 text-center">
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={handleCvChange}
                          className="hidden"
                          aria-label="Charger votre CV"
                        />
                        <span className="text-sm text-foreground-muted">
                          {form.cvFilename || "Cliquez pour charger votre CV (PDF, DOC)"}
                        </span>
                      </label>
                    </div>
                    {form.cvFilename && (
                      <p className="text-xs text-foreground-muted mt-1">
                        Fichier sélectionné : {form.cvFilename}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={handleSaveProfile}>Enregistrer</Button>
                    <Button variant="secondary" onClick={() => setEditing(false)}>Annuler</Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-foreground-muted uppercase tracking-wider">Nom</p>
                    <p className="text-sm font-semibold text-foreground">{user.name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground-muted uppercase tracking-wider">Email</p>
                    <p className="text-sm text-foreground">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground-muted uppercase tracking-wider">Téléphone</p>
                    <p className="text-sm text-foreground">{user.phone || "Non renseigné"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground-muted uppercase tracking-wider">Poste actuel</p>
                    <p className="text-sm text-foreground">{user.currentPosition || "Non renseigné"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground-muted uppercase tracking-wider">Poste recherché</p>
                    <p className="text-sm text-foreground">{user.desiredPosition || "Non renseigné"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground-muted uppercase tracking-wider">CV</p>
                    <p className="text-sm text-foreground">
                      {user.cvFilename
                        ? user.cvFilename
                        : "Non chargé"}
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </section>

          {/* Saved offers */}
          <section id="saved">
            <h2 className="font-heading text-xl font-semibold text-foreground mb-4">
              Offres sauvegardées
              {savedOffers.length > 0 && <Badge variant="teal" className="ml-2">{savedOffers.length}</Badge>}
            </h2>
            {savedOffers.length === 0 ? (
              <Card>
                <p className="text-center py-6 text-foreground-muted">
                  Vous n&apos;avez pas encore sauvegardé d&apos;offres.
                </p>
                <div className="text-center">
                  <Link href="/nos-compagnies-recrutent">
                    <Button variant="secondary">Parcourir les offres</Button>
                  </Link>
                </div>
              </Card>
            ) : (
              <div className="space-y-3">
                {savedJobDetails.map((job) => {
                  if (!job) return null;
                  const match = user ? computeMatchScore(user, job) : null;
                  const matchColor = match ? MATCH_COLORS[match.level] : null;
                  return (
                    <Link key={job.id} href={`/nos-compagnies-recrutent/${job.slug}`} className="block group">
                      <Card className="hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-heading font-semibold text-foreground group-hover:text-primary transition-colors">
                              {job.title}
                            </p>
                            <p className="text-sm text-foreground-muted">
                              {job.company} — {job.location}
                            </p>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            {match && match.score > 0 && matchColor && (
                              <span className={`rounded-lg px-2 py-1 text-[10px] font-bold ${matchColor.bg} ${matchColor.text}`}>
                                {match.score}%
                              </span>
                            )}
                            <Badge variant="teal">{job.contractType}</Badge>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  );
                })}
                {savedOffers.filter((slug) => !publishedJobs.find((j) => j.slug === slug || j.id === slug)).map((offerId) => (
                  <Card key={offerId}>
                    <p className="text-sm text-foreground-muted">Offre #{offerId} (non disponible)</p>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Applications */}
          <section id="candidatures">
            <h2 className="font-heading text-xl font-semibold text-foreground mb-4">
              Mes candidatures
              {applications.length > 0 && <Badge variant="teal" className="ml-2">{applications.length}</Badge>}
            </h2>
            {applications.length === 0 ? (
              <Card>
                <p className="text-center py-6 text-foreground-muted">
                  Vous n&apos;avez pas encore postulé à des offres.
                </p>
                <div className="text-center">
                  <Link href="/nos-compagnies-recrutent">
                    <Button variant="secondary">Voir les offres disponibles</Button>
                  </Link>
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                {applications.map((app, i) => {
                  const job = publishedJobs.find((j) => j.slug === app.offerId || j.id === app.offerId);
                  const status = (app.status as ApplicationStatus) || "pending";
                  const config = APPLICATION_STATUS_CONFIG[status] ?? APPLICATION_STATUS_CONFIG.pending;
                  const PIPELINE_STEPS: ApplicationStatus[] = ["pending", "viewed", "shortlisted", "interview", "accepted"];
                  const stepIdx = PIPELINE_STEPS.indexOf(status);
                  const isRejected = status === "rejected";
                  return (
                    <Card key={i}>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <p className="font-heading font-semibold text-foreground">
                            {job ? job.title : `Offre #${app.offerId}`}
                          </p>
                          {job && (
                            <p className="text-xs text-foreground-muted">{job.company} · {job.location}</p>
                          )}
                          <p className="text-xs text-foreground-muted mt-0.5">
                            Postulé le {new Date(app.date).toLocaleDateString("fr-FR")}
                          </p>
                        </div>
                        <Badge variant={config.variant}>{config.label}</Badge>
                      </div>
                      {/* Pipeline progress bar */}
                      {!isRejected ? (
                        <div className="flex items-center gap-1 mt-2">
                          {PIPELINE_STEPS.map((step, si) => {
                            const stepConfig = APPLICATION_STATUS_CONFIG[step];
                            const isActive = si <= stepIdx;
                            const isCurrent = si === stepIdx;
                            return (
                              <div key={step} className="flex-1 flex flex-col items-center gap-1">
                                <div
                                  className={`h-1.5 w-full rounded-full transition-colors ${
                                    isActive
                                      ? "bg-[var(--gaspe-teal-600)]"
                                      : "bg-[var(--gaspe-neutral-200)]"
                                  }`}
                                />
                                <span className={`text-[9px] hidden sm:block ${isCurrent ? "font-semibold text-[var(--gaspe-teal-600)]" : "text-foreground-muted"}`}>
                                  {stepConfig.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="mt-2 h-1.5 w-full rounded-full bg-[var(--gaspe-neutral-200)]" />
                      )}
                      {/* Recruiter message */}
                      {app.message && (
                        <div className="mt-2 rounded-lg bg-[var(--gaspe-teal-50)] px-3 py-2 text-xs text-[var(--gaspe-teal-700)]">
                          <span className="font-semibold">Message du recruteur :</span> {app.message}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardTitle>Liens rapides</CardTitle>
            <nav className="mt-3 space-y-1">
              {[
                { label: "Toutes les offres d'emploi", href: "/nos-compagnies-recrutent" },
                { label: "Formations", href: "/espace-candidat/formations" },
                { label: "Nos adhérents", href: "/nos-adherents" },
                { label: "Actualités", href: "/actualites" },
                { label: "Contact", href: "/contact" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block rounded-md px-3 py-2 text-sm text-foreground-muted hover:bg-surface hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </Card>

          {/* Top matches */}
          {user && (() => {
            const matches = publishedJobs
              .map((j) => ({ job: j, match: computeMatchScore(user, j) }))
              .filter((m) => m.match.score > 0)
              .sort((a, b) => b.match.score - a.match.score)
              .slice(0, 3);

            if (matches.length === 0) return null;
            return (
              <Card>
                <CardTitle>Suggestions pour vous</CardTitle>
                <div className="mt-3 space-y-2">
                  {matches.map(({ job, match }) => {
                    const color = MATCH_COLORS[match.level];
                    return (
                      <Link key={job.id} href={`/nos-compagnies-recrutent/${job.slug}`} className="block group">
                        <div className="rounded-lg px-3 py-2 hover:bg-surface transition-colors">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-foreground group-hover:text-primary truncate">{job.title}</p>
                            <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold shrink-0 ${color.bg} ${color.text}`}>{match.score}%</span>
                          </div>
                          <p className="text-xs text-foreground-muted truncate">{job.company}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </Card>
            );
          })()}

          <Card>
            <CardTitle>Besoin d&apos;aide ?</CardTitle>
            <CardDescription>
              Contactez l&apos;équipe GASPE pour toute question relative à votre candidature ou aux offres d&apos;emploi.
            </CardDescription>
            <Link href="/contact" className="mt-3 inline-block">
              <Button variant="secondary">Nous contacter</Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
