"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, type User } from "@/lib/auth/AuthContext";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

function profileCompletion(user: User): number {
  const fields = [user.name, user.email, user.phone, user.currentPosition, user.desiredPosition];
  const filled = fields.filter((f) => f && f.trim() !== "").length;
  return Math.round((filled / fields.length) * 100);
}

export default function EspaceCandidatPage() {
  const { user, updateUser } = useAuth();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ currentPosition: "", desiredPosition: "", phone: "" });

  useEffect(() => {
    if (!user || user.role !== "candidat") {
      router.push("/connexion");
      return;
    }
    setForm({
      currentPosition: user.currentPosition ?? "",
      desiredPosition: user.desiredPosition ?? "",
      phone: user.phone ?? "",
    });
  }, [user, router]);

  const handleSaveProfile = useCallback(() => {
    if (!user) return;
    updateUser({
      ...user,
      currentPosition: form.currentPosition,
      desiredPosition: form.desiredPosition,
      phone: form.phone,
    });
    setEditing(false);
  }, [user, form, updateUser]);

  if (!user || user.role !== "candidat") return null;

  const completion = profileCompletion(user);
  const savedOffers = user.savedOffers ?? [];
  const applications = user.applications ?? [];

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
                      className="mt-1 block w-full rounded-lg border border-border-light bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground">Poste actuel</label>
                    <input
                      type="text"
                      value={form.currentPosition}
                      onChange={(e) => setForm((p) => ({ ...p, currentPosition: e.target.value }))}
                      className="mt-1 block w-full rounded-lg border border-border-light bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground">Poste recherché</label>
                    <input
                      type="text"
                      value={form.desiredPosition}
                      onChange={(e) => setForm((p) => ({ ...p, desiredPosition: e.target.value }))}
                      className="mt-1 block w-full rounded-lg border border-border-light bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground">CV (bientôt disponible)</label>
                    <div className="mt-1 flex items-center justify-center rounded-lg border-2 border-dashed border-border-light py-6">
                      <p className="text-sm text-foreground-muted">Upload de CV bientôt disponible</p>
                    </div>
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
                </div>
              )}
            </Card>
          </section>

          {/* Saved offers */}
          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-4">
              Offres sauvegardées
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
                {savedOffers.map((offerId) => (
                  <Card key={offerId}>
                    <p className="text-sm text-foreground">Offre #{offerId}</p>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Applications */}
          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-4">
              Mes candidatures
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
              <div className="space-y-3">
                {applications.map((app, i) => (
                  <Card key={i} className="flex items-center justify-between">
                    <div>
                      <p className="font-heading font-semibold text-foreground">Offre #{app.offerId}</p>
                      <p className="text-xs text-foreground-muted">
                        Postulé le {new Date(app.date).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <Badge variant={app.status === "accepted" ? "green" : app.status === "rejected" ? "warm" : "neutral"}>
                      {app.status === "accepted" ? "Acceptée" : app.status === "rejected" ? "Refusée" : "En cours"}
                    </Badge>
                  </Card>
                ))}
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
