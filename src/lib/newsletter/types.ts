/**
 * Newsletter block model — shared types for renderer + editor.
 *
 * Each block has a discriminated `type` and its specific `data` payload.
 * A newsletter is an ordered array of blocks.
 *
 * Spec: docs/NEWSLETTER-SPEC.md §2.3
 */

export type BlockAlign = "left" | "center" | "right";
export type BlockButtonColor = "teal" | "neutral";
export type BlockDividerStyle = "solid" | "dashed" | "gradient";
export type BlockHeaderVariant = "gradient" | "white";
export type BlockImageWidth = "full" | "half";
export type HeadingLevel = 1 | 2 | 3;

export interface BlockHeader {
  type: "header";
  variant: BlockHeaderVariant;
  subtitle?: string;
}

export interface BlockHeading {
  type: "heading";
  text: string;
  level: HeadingLevel;
  align: BlockAlign;
}

export interface BlockParagraph {
  type: "paragraph";
  html: string;
}

export interface BlockImage {
  type: "image";
  url: string;
  alt: string;
  width: BlockImageWidth;
  link?: string;
}

export interface BlockButton {
  type: "button";
  label: string;
  url: string;
  color: BlockButtonColor;
  align: BlockAlign;
}

export interface BlockDivider {
  type: "divider";
  style: BlockDividerStyle;
}

export interface BlockColumns {
  type: "columns";
  items: { html: string; image?: string }[];
}

export interface BlockSpacer {
  type: "spacer";
  height: number;
}

export interface BlockFooter {
  type: "footer";
  showUnsub: boolean;
  showContactAddress: boolean;
}

export type NewsletterBlock =
  | BlockHeader
  | BlockHeading
  | BlockParagraph
  | BlockImage
  | BlockButton
  | BlockDivider
  | BlockColumns
  | BlockSpacer
  | BlockFooter;

export interface NewsletterDraft {
  id: string;
  title: string;
  subject: string;
  preheader: string;
  blocks: NewsletterBlock[];
  status: "draft" | "sent" | "archived";
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/** GASPE charter — defaults injected into the renderer. */
export interface NewsletterCharter {
  primaryColor: string; // #1B7E8A
  accentColor: string; // #6DAAAC
  backgroundColor: string;
  textColor: string;
  logoUrl: string;
  logoWhiteUrl: string;
  fontFamily: string;
  footerSignature: string;
  addressRgpd: string;
  unsubscribeUrl: string; // placeholder replaced per recipient
  webVersionUrl: string;
  linkedinUrl: string;
}

export const DEFAULT_CHARTER: NewsletterCharter = {
  primaryColor: "#1B7E8A",
  accentColor: "#6DAAAC",
  backgroundColor: "#F5F3F0",
  textColor: "#222221",
  logoUrl: "https://gaspe-fr.pages.dev/assets/logo.png",
  logoWhiteUrl: "https://gaspe-fr.pages.dev/assets/logo-white.png",
  fontFamily: "Arial, Helvetica, sans-serif",
  footerSignature: "© GASPE — Groupement des Armateurs de Services Publics Maritimes de Passages d'Eau",
  addressRgpd: "Maison de la Mer — Daniel Gilard · Quai de la Fosse · 44000 Nantes",
  unsubscribeUrl: "{{unsubscribe_url}}",
  webVersionUrl: "{{webversion_url}}",
  linkedinUrl: "https://www.linkedin.com/company/gaspe-groupement-des-armateurs-de-services-publics-maritimes/",
};

export function emptyDraft(id: string, title: string, createdBy: string): NewsletterDraft {
  const now = new Date().toISOString();
  return {
    id,
    title,
    subject: "",
    preheader: "",
    blocks: [
      { type: "header", variant: "gradient" },
      { type: "heading", text: "Titre de la newsletter", level: 2, align: "left" },
      { type: "paragraph", html: "<p>Commencez à rédiger votre contenu ici.</p>" },
      { type: "divider", style: "solid" },
      { type: "footer", showUnsub: true, showContactAddress: true },
    ],
    status: "draft",
    createdBy,
    createdAt: now,
    updatedAt: now,
  };
}
