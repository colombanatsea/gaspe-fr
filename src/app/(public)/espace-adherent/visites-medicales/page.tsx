"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  ssgmCenters,
  approvedDoctors,
  MEDICAL_VISIT_TYPES,
  type MedicalVisit,
  type MedicalVisitType,
} from "@/data/ssgm";
import {
  getMedicalVisits,
  createMedicalVisit,
  deleteMedicalVisit,
  computeStatus,
} from "@/lib/medical-store";

const statusConfig: Record<MedicalVisit["status"], { label: string; variant: "green" | "warm" | "neutral" | "teal" }> = {
  scheduled: { label: "Planifiée", variant: "teal" },
  completed: { label: "Valide", variant: "green" },
  expiring_soon: { label: "Expire bientôt", variant: "warm" },
  expired: { label: "Expirée", variant: "neutral" },
};

const inputClass =
  "mt-1 block w-full rounded-xl border border-border-light bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-foreground-muted/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

export default function VisitesMedicalesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [visits, setVisits] = useState<MedicalVisit[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<"all" | MedicalVisit["status"]>("all");

  // Form state
  const [sailorName, setSailorName] = useState("");
  const [sailorRole, setSailorRole] = useState("");
  const [visitType, setVisitType] = useState<MedicalVisitType>("aptitude_renouvellement");
  const [visitDate, setVisitDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [certificateRef, setCertificateRef] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!user || user.role !== "adherent") { router.push("/connexion"); return; }
    getMedicalVisits().then(setVisits);
  }, [user, router]);

  if (!user || user.role !== "adherent") return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sailorName || !visitDate) return;

    const newVisit: MedicalVisit = {
      id: crypto.randomUUID(),
      sailorName,
      sailorRole: sailorRole || undefined,
      type: visitType,
      date: visitDate,
      expiryDate: expiryDate || undefined,
      doctorName: doctorName || undefined,
      certificateRef: certificateRef || undefined,
      notes: notes || undefined,
      status: "scheduled",
    };
    newVisit.status = computeStatus(newVisit);

    await createMedicalVisit(newVisit);
    const refreshed = await getMedicalVisits();
    setVisits(refreshed);

    // Reset form
    setSailorName("");
    setSailorRole("");
    setVisitDate("");
    setExpiryDate("");
    setDoctorName("");
    setCertificateRef("");
    setNotes("");
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette visite médicale ?")) return;
    await deleteMedicalVisit(id);
    const refreshed = await getMedicalVisits();
    setVisits(refreshed);
  };

  const filtered = filter === "all" ? visits : visits.filter((v) => v.status === filter);
  const expiredCount = visits.filter((v) => v.status === "expired").length;
  const expiringCount = visits.filter((v) => v.status === "expiring_soon").length;
  const validCount = visits.filter((v) => v.status === "completed").length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Visites médicales</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Suivi des visites médicales d&apos;aptitude de vos marins.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/ssgm">
            <Button variant="secondary">Annuaire SSGM</Button>
          </Link>
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? "Annuler" : "+ Ajouter une visite"}
          </Button>
        </div>
      </div>

      {/* Alert banner for expired/expiring */}
      {(expiredCount > 0 || expiringCount > 0) && (
        <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 [data-theme=dark]:bg-red-950/30 [data-theme=dark]:border-red-800">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            <p className="text-sm font-medium text-red-700 [data-theme=dark]:text-red-400">
              {expiredCount > 0 && <>{expiredCount} visite{expiredCount > 1 ? "s" : ""} expirée{expiredCount > 1 ? "s" : ""}</>}
              {expiredCount > 0 && expiringCount > 0 && " — "}
              {expiringCount > 0 && <>{expiringCount} visite{expiringCount > 1 ? "s" : ""} expire{expiringCount > 1 ? "nt" : ""} dans moins de 60 jours</>}
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl bg-background border border-border-light p-4">
          <p className="text-2xl font-bold font-heading text-foreground">{visits.length}</p>
          <p className="text-xs text-foreground-muted">Total visites</p>
        </div>
        <div className="rounded-xl bg-background border border-border-light p-4">
          <p className="text-2xl font-bold font-heading text-green-600">{validCount}</p>
          <p className="text-xs text-foreground-muted">Valides</p>
        </div>
        <div className="rounded-xl bg-background border border-border-light p-4">
          <p className="text-2xl font-bold font-heading text-amber-600">{expiringCount}</p>
          <p className="text-xs text-foreground-muted">Expirent bientôt</p>
        </div>
        <div className="rounded-xl bg-background border border-border-light p-4">
          <p className="text-2xl font-bold font-heading text-red-600">{expiredCount}</p>
          <p className="text-xs text-foreground-muted">Expirées</p>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleAdd} className="mb-8 rounded-2xl bg-background border border-border-light p-6 space-y-4">
          <h2 className="font-heading text-lg font-semibold text-foreground">Nouvelle visite médicale</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground">Nom du marin *</label>
              <input required value={sailorName} onChange={(e) => setSailorName(e.target.value)} className={inputClass} placeholder="Prénom Nom" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">Fonction à bord</label>
              <input value={sailorRole} onChange={(e) => setSailorRole(e.target.value)} className={inputClass} placeholder="Capitaine, Matelot..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">Type de visite *</label>
              <select value={visitType} onChange={(e) => setVisitType(e.target.value as MedicalVisitType)} className={inputClass}>
                {MEDICAL_VISIT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label} ({t.frequency})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">Date de la visite *</label>
              <input required type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">Date d&apos;expiration</label>
              <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">Médecin</label>
              <input value={doctorName} onChange={(e) => setDoctorName(e.target.value)} className={inputClass} placeholder="Dr. Nom" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">N° certificat</label>
              <input value={certificateRef} onChange={(e) => setCertificateRef(e.target.value)} className={inputClass} placeholder="Référence..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">Notes</label>
              <input value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} placeholder="Remarques..." />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Annuler</Button>
            <Button type="submit">Enregistrer</Button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap mb-4">
        {(["all", "completed", "expiring_soon", "expired", "scheduled"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === f ? "bg-primary text-white" : "bg-surface text-foreground-muted hover:bg-surface-teal hover:text-primary"
            }`}
          >
            {f === "all" ? "Toutes" : statusConfig[f].label}
          </button>
        ))}
      </div>

      {/* Visits list */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-foreground-muted">
            {visits.length === 0
              ? "Aucune visite médicale enregistrée. Ajoutez la première !"
              : "Aucune visite ne correspond au filtre sélectionné."}
          </p>
          {visits.length === 0 && (
            <Button className="mt-4" onClick={() => setShowForm(true)}>+ Ajouter une visite</Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered
            .sort((a, b) => {
              // Expired first, then expiring soon, then by date
              const priority: Record<string, number> = { expired: 0, expiring_soon: 1, scheduled: 2, completed: 3 };
              const diff = (priority[a.status] ?? 4) - (priority[b.status] ?? 4);
              if (diff !== 0) return diff;
              return new Date(b.date).getTime() - new Date(a.date).getTime();
            })
            .map((visit) => {
              const typeInfo = MEDICAL_VISIT_TYPES.find((t) => t.value === visit.type);
              const sConfig = statusConfig[visit.status];

              return (
                <div key={visit.id} className="rounded-xl border border-border-light bg-background p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-foreground">{visit.sailorName}</p>
                      {visit.sailorRole && <span className="text-xs text-foreground-muted">— {visit.sailorRole}</span>}
                      <Badge variant={sConfig.variant}>{sConfig.label}</Badge>
                    </div>
                    <p className="text-xs text-foreground-muted mt-1">
                      {typeInfo?.label ?? visit.type} — {new Date(visit.date).toLocaleDateString("fr-FR")}
                      {visit.expiryDate && (
                        <> — Expire le {new Date(visit.expiryDate).toLocaleDateString("fr-FR")}</>
                      )}
                    </p>
                    {visit.doctorName && (
                      <p className="text-xs text-foreground-muted">{visit.doctorName}</p>
                    )}
                    {visit.certificateRef && (
                      <p className="text-xs text-foreground-muted">Certificat : {visit.certificateRef}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(visit.id)}
                    className="self-end sm:self-center shrink-0 rounded-lg p-2 text-foreground-muted hover:text-red-500 hover:bg-red-50 transition-colors [data-theme=dark]:hover:bg-red-950/30"
                    title="Supprimer"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
