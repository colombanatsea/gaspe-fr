/**
 * CSV export utilities for admin dashboard.
 */

function escapeCsv(value: string | number | boolean | undefined | null): string {
  if (value === undefined || value === null) return "";
  let str = String(value);
  // Prevent CSV formula injection (DDE attacks in Excel)
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function arrayToCsv(headers: string[], rows: (string | number | boolean | undefined | null)[][]): string {
  const headerLine = headers.map(escapeCsv).join(",");
  const dataLines = rows.map((row) => row.map(escapeCsv).join(","));
  return [headerLine, ...dataLines].join("\n");
}

function downloadCsv(filename: string, csvContent: string) {
  const BOM = "\uFEFF"; // UTF-8 BOM for Excel compatibility
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export interface ExportableUser {
  name: string;
  email: string;
  role: string;
  company?: string;
  phone?: string;
  approved?: boolean;
  archived?: boolean;
  companyRole?: string;
  membershipStatus?: string;
  createdAt: string;
}

export function exportAccountsCsv(users: ExportableUser[]) {
  const headers = ["Nom", "Email", "Rôle", "Compagnie", "Téléphone", "Statut", "Adhésion", "Rôle compagnie", "Archivé", "Date création"];
  const rows = users.map((u) => [
    u.name,
    u.email,
    u.role,
    u.company ?? "",
    u.phone ?? "",
    u.approved ? "Actif" : "En attente",
    u.membershipStatus ?? "—",
    u.companyRole ?? "",
    u.archived ? "Oui" : "Non",
    new Date(u.createdAt).toLocaleDateString("fr-FR"),
  ]);
  downloadCsv(`gaspe-comptes-${new Date().toISOString().split("T")[0]}.csv`, arrayToCsv(headers, rows));
}

export function exportMembershipsCsv(users: ExportableUser[]) {
  const adherents = users.filter((u) => u.role === "adherent" && !u.archived);
  const headers = ["Nom", "Email", "Compagnie", "Rôle compagnie", "Statut adhésion", "Date création"];
  const rows = adherents.map((u) => [
    u.name,
    u.email,
    u.company ?? "",
    u.companyRole ?? "",
    u.membershipStatus === "paid" ? "Payée" : u.membershipStatus === "pending" ? "En cours" : "Due",
    new Date(u.createdAt).toLocaleDateString("fr-FR"),
  ]);
  downloadCsv(`gaspe-adhesions-${new Date().toISOString().split("T")[0]}.csv`, arrayToCsv(headers, rows));
}

export interface ExportableApplication {
  candidateName: string;
  candidateEmail: string;
  offerTitle: string;
  company: string;
  date: string;
  status: string;
}

export function exportApplicationsCsv(applications: ExportableApplication[]) {
  const headers = ["Candidat", "Email", "Offre", "Compagnie", "Date", "Statut"];
  const rows = applications.map((a) => [
    a.candidateName,
    a.candidateEmail,
    a.offerTitle,
    a.company,
    new Date(a.date).toLocaleDateString("fr-FR"),
    a.status,
  ]);
  downloadCsv(`gaspe-candidatures-${new Date().toISOString().split("T")[0]}.csv`, arrayToCsv(headers, rows));
}
