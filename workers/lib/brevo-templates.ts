/**
 * Templates HTML Brevo standardisés — charte GASPE.
 *
 * Pour éviter la duplication du `<!DOCTYPE html>...` de la structure
 * dans chaque handler qui envoie un email transactionnel (password-reset,
 * invitations, auth registration, validation-campaigns, etc.), on
 * centralise ici le layout de base.
 *
 * **Hors scope** : les emails newsletter (charte configurable admin via
 * `/admin/newsletter/charte`) et les emails Brevo Email Campaigns API.
 * Ces deux flux ont leurs propres renderers dédiés.
 *
 * Préparation rebrand ACF (novembre 2026) : changer la couleur header
 * et la baseline en un seul endroit.
 */

/** Couleur du header par défaut (charte teal-600 GASPE / horizon ACF). */
const DEFAULT_HEADER_COLOR = "#1B7E8A";
const DEFAULT_HEADER_TEXT_COLOR = "#fff";
const DEFAULT_HEADER_SUBTITLE_COLOR = "#B2DFE3";
const DEFAULT_FOOTER_TEXT = "GASPE – Groupement des Armateurs de Services Publics Maritimes de Passages d'Eau";

export interface EmailLayoutParams {
  /** Titre H1 affiché dans le header coloré. */
  headerTitle: string;
  /** Baseline sous le titre (optionnel, default GASPE). */
  headerSubtitle?: string | null;
  /** Couleur de fond du header (hex), default teal-600. */
  headerColor?: string;
  /** HTML du corps de l'email (déjà sanitizé). */
  body: string;
  /** Texte du footer (optionnel, default GASPE long name). */
  footer?: string | null;
}

/**
 * Génère un email HTML charté GASPE complet. Le `body` est inséré tel
 * quel dans la zone de contenu (l'appelant est responsable de la
 * sanitization des champs dynamiques).
 *
 * Structure rendue :
 * ```
 * <body bg=#F5F3F0>
 *   <div max-w=600 bg=white shadow rounded>
 *     <div bg=headerColor padding text-center>
 *       <h1>headerTitle</h1>
 *       <p>headerSubtitle (optionnel)</p>
 *     </div>
 *     <div padding=32>
 *       <!-- body -->
 *     </div>
 *     <div footer padding border-top text-center>
 *       <p>footer (si fourni)</p>
 *     </div>
 *   </div>
 * </body>
 * ```
 */
export function renderEmailLayout(params: EmailLayoutParams): string {
  const {
    headerTitle,
    headerSubtitle,
    headerColor = DEFAULT_HEADER_COLOR,
    body,
    footer,
  } = params;

  const subtitleHtml = headerSubtitle
    ? `<p style="margin:4px 0 0;color:${DEFAULT_HEADER_SUBTITLE_COLOR};font-size:13px;">${headerSubtitle}</p>`
    : "";

  const footerHtml = footer === null ? "" : `
    <div style="padding:16px 32px;border-top:1px solid #DCD5CC;text-align:center;font-size:12px;color:#6B6560;">
      <p style="margin:0;">${footer ?? DEFAULT_FOOTER_TEXT}</p>
    </div>`;

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F5F3F0;font-family:'DM Sans',Helvetica,sans-serif;">
<div style="max-width:600px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
  <div style="background:${headerColor};padding:24px 32px;text-align:center;">
    <h1 style="margin:0;color:${DEFAULT_HEADER_TEXT_COLOR};font-family:'Exo 2',Helvetica,sans-serif;font-size:22px;">${headerTitle}</h1>
    ${subtitleHtml}
  </div>
  <div style="padding:32px;">
${body}
  </div>${footerHtml}
</div></body></html>`;
}

/**
 * Helper pour construire un bouton CTA charté (réutilisable dans `body`).
 * Évite les copies du même styling inline dans chaque template.
 */
export function renderEmailButton(url: string, label: string): string {
  return `<p style="margin:24px 0;"><a href="${url}" style="display:inline-block;background:${DEFAULT_HEADER_COLOR};color:${DEFAULT_HEADER_TEXT_COLOR};padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">${label}</a></p>`;
}

/**
 * Helper paragraphe charté (couleur foreground GASPE).
 */
export function renderEmailParagraph(text: string, options?: { muted?: boolean }): string {
  const color = options?.muted ? "#6B6560" : "#222221";
  const size = options?.muted ? "13px" : "15px";
  return `<p style="margin:0 0 12px;color:${color};font-size:${size};">${text}</p>`;
}
