import type { NavItem } from "@/types";

export const mainNavigation: NavItem[] = [
  { label: "Accueil", href: "/" },
  { label: "Notre Groupement", href: "/notre-groupement" },
  { label: "Nos Adhérents", href: "/nos-adherents" },
  { label: "Positions", href: "/positions" },
  { label: "Documents", href: "/documents" },
  { label: "Agenda", href: "/agenda" },
  { label: "Boîte à outils", href: "/boite-a-outils" },
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
    { label: "Positions", href: "/positions" },
    { label: "Documents", href: "/documents" },
    { label: "Boîte à outils CCN 3228", href: "/boite-a-outils" },
    { label: "Agenda", href: "/agenda" },
  ],
  legal: [
    { label: "Mentions légales", href: "/mentions-legales" },
    { label: "Politique de confidentialité", href: "/confidentialite" },
  ],
};
