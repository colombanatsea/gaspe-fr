import type { NavItem } from "@/types";

export const mainNavigation: NavItem[] = [
  { label: "Accueil", href: "/" },
  { label: "Notre Groupement", href: "/notre-groupement" },
  { label: "Nos Adhérents", href: "/nos-adherents" },
  { label: "Actualités", href: "/actualites" },
  { label: "Positions", href: "/positions" },
  { label: "Presse", href: "/presse" },
  { label: "Agenda", href: "/agenda" },
  {
    label: "Nos Compagnies Recrutent",
    href: "/nos-compagnies-recrutent",
    highlight: true,
  },
  { label: "Contact", href: "/contact" },
];

export const footerNavigation = {
  groupement: [
    { label: "Qui sommes-nous", href: "/notre-groupement" },
    { label: "Nos Adhérents", href: "/nos-adherents" },
    { label: "Nos Positions", href: "/positions" },
  ],
  ressources: [
    { label: "Actualités", href: "/actualites" },
    { label: "Presse", href: "/presse" },
    { label: "Agenda", href: "/agenda" },
  ],
  legal: [
    { label: "Mentions légales", href: "/mentions-legales" },
    { label: "Politique de confidentialité", href: "/confidentialite" },
  ],
};
