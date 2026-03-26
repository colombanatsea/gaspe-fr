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
  location: string;
  contract: string;
  status: "active" | "draft" | "closed";
  createdAt: string;
  company: string;
  ownerId: string;
}

const OFFERS_KEY = "gaspe_adherent_offers";

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
  closed: { text: "Clôturée", variant: "warm" },
};

export default function AdherentOffresPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [offers, setOffers] = useState<JobOffer[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", location: "", contract: "CDI" });

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
    setForm({ title: "", location: "", contract: "CDI" });
    setShowForm(false);
    setEditingId(null);
  };

  const handleSave = () => {
    if (!form.title.trim()) return;
    const all = readOffers();

    if (editingId) {
      const idx = all.findIndex((o) => o.id === editingId);
      if (idx >= 0) {
        all[idx] = { ...all[idx], ...form };
        writeOffers(all);
      }
    } else {
      const newOffer: JobOffer = {
        id: `offer-${Date.now()}`,
        title: form.title,
        location: form.location,
        contract: form.contract,
        status: "active",
        createdAt: new Date().toISOString(),
        company: user.company ?? "",
        ownerId: user.id,
      };
      all.push(newOffer);
      writeOffers(all);
    }

    setOffers(readOffers().filter((o) => o.ownerId === user.id));
    resetForm();
  };

  const handleEdit = (offer: JobOffer) => {
    setForm({ title: offer.title, location: offer.location, contract: offer.contract });
    setEditingId(offer.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Supprimer cette offre ?")) return;
    const all = readOffers().filter((o) => o.id !== id);
    writeOffers(all);
    setOffers(all.filter((o) => o.ownerId === user.id));
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/espace-adherent" className="text-sm text-primary hover:underline mb-1 inline-block">
            &larr; Retour à l&apos;espace adhérent
          </Link>
          <h1 className="font-heading text-2xl font-bold text-foreground">Mes offres d&apos;emploi</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Gérez les offres d&apos;emploi de {user.company}.
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>Nouvelle offre</Button>
        )}
      </div>

      {/* Create / Edit form */}
      {showForm && (
        <Card className="mb-6">
          <CardTitle>{editingId ? "Modifier l'offre" : "Nouvelle offre d'emploi"}</CardTitle>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground">Intitulé du poste</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                className="mt-1 block w-full rounded-lg border border-border-light bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Ex: Capitaine de navire"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground">Lieu</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => update("location", e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-border-light bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Ex: Marseille"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground">Type de contrat</label>
                <select
                  value={form.contract}
                  onChange={(e) => update("contract", e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-border-light bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="CDI">CDI</option>
                  <option value="CDD">CDD</option>
                  <option value="Saisonnier">Saisonnier</option>
                  <option value="Intérim">Intérim</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleSave}>{editingId ? "Enregistrer" : "Publier l'offre"}</Button>
              <Button variant="secondary" onClick={resetForm}>Annuler</Button>
            </div>
          </div>
        </Card>
      )}

      {/* List */}
      <div className="space-y-3">
        {offers.length === 0 && !showForm && (
          <Card>
            <p className="text-center py-6 text-foreground-muted">
              Aucune offre publiée pour le moment.
            </p>
          </Card>
        )}
        {offers.map((offer) => (
          <Card key={offer.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-heading font-semibold text-foreground">{offer.title}</span>
                <Badge variant={statusLabel[offer.status].variant}>
                  {statusLabel[offer.status].text}
                </Badge>
              </div>
              <p className="text-sm text-foreground-muted mt-0.5">
                {offer.location && <>{offer.location} — </>}{offer.contract}
                <span className="ml-2 text-xs">
                  Publiée le {new Date(offer.createdAt).toLocaleDateString("fr-FR")}
                </span>
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button variant="secondary" onClick={() => handleEdit(offer)}>Modifier</Button>
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
    </div>
  );
}
