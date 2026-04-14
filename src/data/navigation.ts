import type { NavItem } from "@/types";

export const mainNavigation: NavItem[] = [
  { label: "Notre Groupement", href: "/notre-groupement" },
  { label: "Nos Adhérents", href: "/nos-adherents" },
  { label: "Positions", href: "/positions" },
  { label: "Documents", href: "/documents" },
  {
    label: "Nos Compagnies Recrutent",
    href: "/nos-compagnies-recrutent",
    highlight: true,
  },
  { label: "Contact", href: "/contact" },
];

export const authNavigation = {
  admin: { label: "Administration", href: "/admin" },
  adherent: { label: "Espace Adhérent", href: "/espace-adherent" },
  candidat: { label: "Espace Candidat", href: "/espace-candidat" },
} as const;

export const footerNavigation = {
  groupement: [
    { label: "Qui sommes-nous", href: "/notre-groupement" },
    { label: "Nos Adhérents", href: "/nos-adherents" },
    { label: "Nos Positions", href: "/positions" },
  ],
  ressources: [
    { label: "Documents & Boîte à outils", href: "/documents" },
    { label: "Boîte à outils CCN 3228", href: "/boite-a-outils" },
    { label: "Formations", href: "/formations" },
    { label: "SSGM & Médecins", href: "/ssgm" },
    { label: "Agenda", href: "/agenda" },
  ],
  legal: [
    { label: "Mentions légales", href: "/mentions-legales" },
    { label: "Confidentialité", href: "/confidentialite" },
    { label: "CGU", href: "/cgu" },
  ],
};
