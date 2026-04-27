import type { NavItem } from "@/types";

// Note : « Écoles de la mer » est intentionnellement absente du header — la
// page est destinée aux jeunes scannant un QR code sur les affiches de la
// campagne, pas à un visiteur du site naviguant depuis l'accueil. Conservée
// dans le footer pour le SEO et l'accessibilité directe.
export const mainNavigation: NavItem[] = [
  { label: "Notre Groupement", href: "/notre-groupement" },
  { label: "Positions", href: "/positions" },
  { label: "Documents", href: "/documents" },
  {
    label: "Nos Compagnies Recrutent",
    href: "/nos-compagnies-recrutent",
    highlight: true,
  },
];

export const authNavigation = {
  admin: { label: "Administration", href: "/admin" },
  staff: { label: "Console GASPE", href: "/admin" },
  adherent: { label: "Espace Adhérent", href: "/espace-adherent" },
  candidat: { label: "Espace Candidat", href: "/espace-candidat" },
} as const;

export const footerNavigation = {
  groupement: [
    { label: "Notre Groupement", href: "/notre-groupement" },
    { label: "Nos Positions", href: "/positions" },
    { label: "Contact", href: "/contact" },
  ],
  ressources: [
    { label: "Documents & Boîte à outils", href: "/documents" },
    { label: "Boîte à outils CCN 3228", href: "/boite-a-outils" },
    { label: "Transition Ecologique", href: "/transition-ecologique" },
    { label: "Formations", href: "/formations" },
    { label: "Écoles de la mer", href: "/ecoles-de-la-mer" },
    { label: "SSGM & Médecins", href: "/ssgm" },
    { label: "Agenda", href: "/agenda" },
  ],
  legal: [
    { label: "Mentions légales", href: "/mentions-legales" },
    { label: "Confidentialité", href: "/confidentialite" },
    { label: "CGU", href: "/cgu" },
  ],
};
