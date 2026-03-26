"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, type User } from "@/lib/auth/AuthContext";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { publishedJobs } from "@/data/jobs";

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
      experience: (user as unknown as Record<string, unknown>).experience as string ?? "",
      certifications: (user as unknown as Record<string, unknown>).certifications as string ?? "",
      cvFilename: (user as unknown as Record<string, unknown>).cvFilename as string ?? "",
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
      ...({ experience: form.experience, certifications: form.certifications, cvFilename: form.cvFilename } as Record<string, string>),
    } as User);
    setEditing(false);
  }, [user, form, updateUser]);

  const handleCvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm((p) => ({ ...p, cvFilename: file.name }));
    }
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
      title: "Offres d\u2019emploi",
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
      title: "Offres sauvegard\u00e9es",
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
      description: "D\u00e9couvrir les formations",
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
                  <span className="text-sm font-medium text-foreground">Profil compl\u00e9t\u00e9</span>
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
                    <label className="block text-sm font-medium text-foreground">T\u00e9l\u00e9phone</label>
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
                    <label className="block text-sm font-medium text-foreground">Poste recherch\u00e9</label>
                    <input
                      type="text"
                      value={form.desiredPosition}
                      onChange={(e) => setForm((p) => ({ ...p, desiredPosition: e.target.value }))}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground">Exp\u00e9rience professionnelle</label>
                    <textarea
                      rows={3}
                      value={form.experience}
                      onChange={(e) => setForm((p) => ({ ...p, experience: e.target.value }))}
                      className={inputClass}
                      placeholder="D\u00e9crivez votre exp\u00e9rience maritime..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground">Certifications (STCW, brevets, etc.)</label>
                    <textarea
                      rows={3}
                      value={form.certifications}
                      onChange={(e) => setForm((p) => ({ ...p, certifications: e.target.value }))}
                      className={inputClass}
                      placeholder="CFBS, Capitaine 500, STCW II/3..."
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
                        />
                        <span className="text-sm text-foreground-muted">
                          {form.cvFilename || "Cliquez pour charger votre CV (PDF, DOC)"}
                        </span>
                      </label>
                    </div>
                    {form.cvFilename && (
                      <p className="text-xs text-foreground-muted mt-1">
                        Fichier s\u00e9lectionn\u00e9 : {form.cvFilename}
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
                    <p className="text-xs font-medium text-foreground-muted uppercase tracking-wider">T\u00e9l\u00e9phone</p>
                    <p className="text-sm text-foreground">{user.phone || "Non renseign\u00e9"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground-muted uppercase tracking-wider">Poste actuel</p>
                    <p className="text-sm text-foreground">{user.currentPosition || "Non renseign\u00e9"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground-muted uppercase tracking-wider">Poste recherch\u00e9</p>
                    <p className="text-sm text-foreground">{user.desiredPosition || "Non renseign\u00e9"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground-muted uppercase tracking-wider">CV</p>
                    <p className="text-sm text-foreground">
                      {(user as unknown as Record<string, unknown>).cvFilename
                        ? String((user as unknown as Record<string, unknown>).cvFilename)
                        : "Non charg\u00e9"}
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </section>

          {/* Saved offers */}
          <section id="saved">
            <h2 className="font-heading text-xl font-semibold text-foreground mb-4">
              Offres sauvegard\u00e9es
              {savedOffers.length > 0 && <Badge variant="teal" className="ml-2">{savedOffers.length}</Badge>}
            </h2>
            {savedOffers.length === 0 ? (
              <Card>
                <p className="text-center py-6 text-foreground-muted">
                  Vous n&apos;avez pas encore sauvegard\u00e9 d&apos;offres.
                </p>
                <div className="text-center">
                  <Link href="/nos-compagnies-recrutent">
                    <Button variant="secondary">Parcourir les offres</Button>
                  </Link>
                </div>
              </Card>
            ) : (
              <div className="space-y-3">
                {savedJobDetails.map((job) => job && (
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
                        <Badge variant="teal">{job.contractType}</Badge>
                      </div>
                    </Card>
                  </Link>
                ))}
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
                  Vous n&apos;avez pas encore postul\u00e9 \u00e0 des offres.
                </p>
                <div className="text-center">
                  <Link href="/nos-compagnies-recrutent">
                    <Button variant="secondary">Voir les offres disponibles</Button>
                  </Link>
                </div>
              </Card>
            ) : (
              <div className="space-y-3">
                {applications.map((app, i) => {
                  const job = publishedJobs.find((j) => j.slug === app.offerId || j.id === app.offerId);
                  return (
                    <Card key={i} className="flex items-center justify-between">
                      <div>
                        <p className="font-heading font-semibold text-foreground">
                          {job ? job.title : `Offre #${app.offerId}`}
                        </p>
                        {job && (
                          <p className="text-xs text-foreground-muted">{job.company}</p>
                        )}
                        <p className="text-xs text-foreground-muted">
                          Postul\u00e9 le {new Date(app.date).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      <Badge variant={app.status === "accepted" ? "green" : app.status === "rejected" ? "warm" : "neutral"}>
                        {app.status === "accepted" ? "Accept\u00e9e" : app.status === "rejected" ? "Refus\u00e9e" : "En attente"}
                      </Badge>
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
                { label: "Toutes les offres d\u2019emploi", href: "/nos-compagnies-recrutent" },
                { label: "Formations", href: "/espace-candidat/formations" },
                { label: "Nos adh\u00e9rents", href: "/nos-adherents" },
                { label: "Actualit\u00e9s", href: "/actualites" },
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

          <Card>
            <CardTitle>Besoin d&apos;aide ?</CardTitle>
            <CardDescription>
              Contactez l&apos;\u00e9quipe GASPE pour toute question relative \u00e0 votre candidature ou aux offres d&apos;emploi.
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
