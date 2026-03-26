"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface JobOffer {
  id: string;
  title: string;
  description: string;
  location: string;
  contractType: string;
  category: string;
  salaryRange: string;
  contactEmail: string;
  profile: string;
  conditions: string;
  status: "draft" | "active" | "closed";
  createdAt: string;
  company: string;
  ownerId: string;
  applicationsCount: number;
}

const OFFERS_KEY = "gaspe_adherent_offers";

const emptyForm = {
  title: "",
  description: "",
  location: "",
  contractType: "CDI",
  category: "Pont",
  salaryRange: "",
  contactEmail: "",
  profile: "",
  conditions: "",
};

function readOffers(): JobOffer[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(OFFERS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function writeOffers(offers: JobOffer[]) {
  localStorage.setItem(OFFERS_KEY, JSON.stringify(offers));
}

const statusLabel: Record<string, { text: string; variant: "teal" | "warm" | "neutral" }> = {
  active: { text: "Active", variant: "teal" },
  draft: { text: "Brouillon", variant: "neutral" },
  closed: { text: "Cl\u00f4tur\u00e9e", variant: "warm" },
};

const contractTypes = ["CDI", "CDD", "Saisonnier", "Stage", "Alternance"];
const categories = ["Pont", "Machine", "Personnel h\u00f4telier", "Personnel \u00e0 terre", "Direction", "Autre"];

const inputClass =
  "mt-1 block w-full rounded-lg border border-border-light bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

export default function AdherentOffresPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [offers, setOffers] = useState<JobOffer[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!user || user.role !== "adherent") {
      router.push("/connexion");
      return;
    }
    setOffers(readOffers().filter((o) => o.ownerId === user.id));
  }, [user, router]);

  if (!user || user.role !== "adherent") return null;

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const resetForm = () => {
    setForm(emptyForm);
    setShowForm(false);
    setEditingId(null);
  };

  const handleSave = (asDraft: boolean) => {
    if (!form.title.trim()) return;
    const all = readOffers();

    if (editingId) {
      const idx = all.findIndex((o) => o.id === editingId);
      if (idx >= 0) {
        all[idx] = {
          ...all[idx],
          title: form.title,
          description: form.description,
          location: form.location,
          contractType: form.contractType,
          category: form.category,
          salaryRange: form.salaryRange,
          contactEmail: form.contactEmail,
          profile: form.profile,
          conditions: form.conditions,
        };
        writeOffers(all);
      }
    } else {
      const newOffer: JobOffer = {
        id: `offer-${Date.now()}`,
        title: form.title,
        description: form.description,
        location: form.location,
        contractType: form.contractType,
        category: form.category,
        salaryRange: form.salaryRange,
        contactEmail: form.contactEmail || user.email,
        profile: form.profile,
        conditions: form.conditions,
        status: asDraft ? "draft" : "active",
        createdAt: new Date().toISOString(),
        company: user.company ?? "",
        ownerId: user.id,
        applicationsCount: 0,
      };
      all.push(newOffer);
      writeOffers(all);
    }

    setOffers(readOffers().filter((o) => o.ownerId === user.id));
    resetForm();
  };

  const handleEdit = (offer: JobOffer) => {
    setForm({
      title: offer.title,
      description: offer.description ?? "",
      location: offer.location,
      contractType: offer.contractType ?? "CDI",
      category: offer.category ?? "Pont",
      salaryRange: offer.salaryRange ?? "",
      contactEmail: offer.contactEmail ?? "",
      profile: offer.profile ?? "",
      conditions: offer.conditions ?? "",
    });
    setEditingId(offer.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Supprimer cette offre ?")) return;
    const all = readOffers().filter((o) => o.id !== id);
    writeOffers(all);
    setOffers(all.filter((o) => o.ownerId === user.id));
  };

  const handleToggleStatus = (offer: JobOffer) => {
    const all = readOffers();
    const idx = all.findIndex((o) => o.id === offer.id);
    if (idx >= 0) {
      const nextStatus = offer.status === "active" ? "closed" : "active";
      all[idx].status = nextStatus;
      writeOffers(all);
      setOffers(all.filter((o) => o.ownerId === user.id));
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/espace-adherent" className="text-sm text-primary hover:underline mb-1 inline-block">
            &larr; Retour \u00e0 l&apos;espace adh\u00e9rent
          </Link>
          <h1 className="font-heading text-2xl font-bold text-foreground">Mes offres d&apos;emploi</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            G\u00e9rez les offres d&apos;emploi de <span className="font-medium">{user.company}</span>.
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>Nouvelle offre</Button>
        )}
      </div>

      {/* Create / Edit form */}
      {showForm && (
        <Card className="mb-6">
          <CardTitle>{editingId ? "Modifier l\u2019offre" : "Nouvelle offre d\u2019emploi"}</CardTitle>
          <p className="text-sm text-foreground-muted mt-1 mb-4">
            Compagnie : <span className="font-medium text-foreground">{user.company}</span>
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground">Intitul\u00e9 du poste *</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                className={inputClass}
                placeholder="Ex: Capitaine de navire"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground">Description du poste</label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                className={inputClass}
                placeholder="D\u00e9crivez le poste, les missions principales..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground">Lieu</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => update("location", e.target.value)}
                  className={inputClass}
                  placeholder="Ex: Marseille"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground">Type de contrat</label>
                <select
                  value={form.contractType}
                  onChange={(e) => update("contractType", e.target.value)}
                  className={inputClass}
                >
                  {contractTypes.map((ct) => (
                    <option key={ct} value={ct}>{ct}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground">Cat\u00e9gorie</label>
                <select
                  value={form.category}
                  onChange={(e) => update("category", e.target.value)}
                  className={inputClass}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground">Fourchette salariale</label>
                <input
                  type="text"
                  value={form.salaryRange}
                  onChange={(e) => update("salaryRange", e.target.value)}
                  className={inputClass}
                  placeholder="Ex: 3 500 - 4 500 \u20ac/mois"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground">Email de contact</label>
              <input
                type="email"
                value={form.contactEmail}
                onChange={(e) => update("contactEmail", e.target.value)}
                className={inputClass}
                placeholder={user.email}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground">Profil recherch\u00e9</label>
              <textarea
                rows={3}
                value={form.profile}
                onChange={(e) => update("profile", e.target.value)}
                className={inputClass}
                placeholder="Brevets requis, exp\u00e9rience, comp\u00e9tences..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground">Conditions et avantages</label>
              <textarea
                rows={3}
                value={form.conditions}
                onChange={(e) => update("conditions", e.target.value)}
                className={inputClass}
                placeholder="Contrat, r\u00e9mun\u00e9ration, r\u00e9gime social..."
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button onClick={() => handleSave(false)}>
                {editingId ? "Enregistrer" : "Publier l\u2019offre"}
              </Button>
              {!editingId && (
                <Button variant="secondary" onClick={() => handleSave(true)}>
                  Enregistrer en brouillon
                </Button>
              )}
              <Button variant="secondary" onClick={resetForm}>Annuler</Button>
            </div>
          </div>
        </Card>
      )}

      {/* List as table on desktop, cards on mobile */}
      {offers.length === 0 && !showForm && (
        <Card>
          <p className="text-center py-6 text-foreground-muted">
            Aucune offre publi\u00e9e pour le moment.
          </p>
          <div className="text-center">
            <Button onClick={() => setShowForm(true)}>Publier une offre</Button>
          </div>
        </Card>
      )}

      {offers.length > 0 && (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border-light">
                  <th className="pb-3 font-heading font-semibold text-foreground">Offre</th>
                  <th className="pb-3 font-heading font-semibold text-foreground">Statut</th>
                  <th className="pb-3 font-heading font-semibold text-foreground">Date</th>
                  <th className="pb-3 font-heading font-semibold text-foreground text-center">Candidatures</th>
                  <th className="pb-3 font-heading font-semibold text-foreground text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {offers.map((offer) => (
                  <tr key={offer.id} className="group">
                    <td className="py-4">
                      <p className="font-heading font-semibold text-foreground">{offer.title}</p>
                      <p className="text-xs text-foreground-muted">
                        {offer.location && <>{offer.location} — </>}{offer.contractType}
                        {offer.category && <> — {offer.category}</>}
                      </p>
                    </td>
                    <td className="py-4">
                      <Badge variant={statusLabel[offer.status]?.variant ?? "neutral"}>
                        {statusLabel[offer.status]?.text ?? offer.status}
                      </Badge>
                    </td>
                    <td className="py-4 text-foreground-muted">
                      {new Date(offer.createdAt).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="py-4 text-center">
                      <span className="font-semibold text-foreground">{offer.applicationsCount ?? 0}</span>
                    </td>
                    <td className="py-4">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleEdit(offer)}
                          className="rounded-lg border border-border-light px-3 py-1.5 text-xs font-heading font-semibold text-foreground hover:bg-surface transition-colors"
                          title="Modifier"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleToggleStatus(offer)}
                          className="rounded-lg border border-border-light px-3 py-1.5 text-xs font-heading font-semibold text-foreground hover:bg-surface transition-colors"
                          title={offer.status === "active" ? "Cl\u00f4turer" : "R\u00e9activer"}
                        >
                          {offer.status === "active" ? "Cl\u00f4turer" : "Activer"}
                        </button>
                        <button
                          onClick={() => handleDelete(offer.id)}
                          className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-heading font-semibold text-red-600 hover:bg-red-50 transition-colors"
                          title="Supprimer"
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {offers.map((offer) => (
              <Card key={offer.id} className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-heading font-semibold text-foreground">{offer.title}</span>
                  <Badge variant={statusLabel[offer.status]?.variant ?? "neutral"}>
                    {statusLabel[offer.status]?.text ?? offer.status}
                  </Badge>
                </div>
                <p className="text-sm text-foreground-muted">
                  {offer.location && <>{offer.location} — </>}{offer.contractType}
                  <span className="ml-2 text-xs">
                    Publi\u00e9e le {new Date(offer.createdAt).toLocaleDateString("fr-FR")}
                  </span>
                </p>
                <p className="text-sm text-foreground-muted">
                  {offer.applicationsCount ?? 0} candidature{(offer.applicationsCount ?? 0) !== 1 ? "s" : ""}
                </p>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="secondary" onClick={() => handleEdit(offer)}>Modifier</Button>
                  <button
                    onClick={() => handleToggleStatus(offer)}
                    className="rounded-lg border-2 border-primary px-4 py-2 text-sm font-heading font-semibold text-primary hover:bg-surface-teal transition-colors"
                  >
                    {offer.status === "active" ? "Cl\u00f4turer" : "Activer"}
                  </button>
                  <button
                    onClick={() => handleDelete(offer.id)}
                    className="rounded-lg border-2 border-red-300 px-4 py-2 text-sm font-heading font-semibold text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Supprimer
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
