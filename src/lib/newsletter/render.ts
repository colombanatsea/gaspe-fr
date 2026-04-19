/**
 * Newsletter HTML renderer.
 *
 * Converts an array of NewsletterBlock into an inline-styled, email-safe
 * HTML document (table-based layout for Outlook compatibility).
 *
 * Supports variables: {{firstname}}, {{unsubscribe_url}}, {{webversion_url}}.
 */

import type { NewsletterBlock, NewsletterCharter } from "./types";
import { DEFAULT_CHARTER } from "./types";

export interface RenderOptions {
  subject: string;
  preheader: string;
  charter?: Partial<NewsletterCharter>;
  /** Recipient variables substituted in {{firstname}} etc. */
  vars?: Record<string, string>;
}

function esc(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Minimal HTML sanitization for newsletter paragraphs.
 * Allows: p, br, strong, em, b, i, u, a, ul, ol, li, span.
 * Strips script/style/iframe and dangerous attributes.
 */
function sanitizeNewsletterHtml(html: string): string {
  if (!html) return "";
  let clean = html;
  // Remove dangerous tags
  clean = clean.replace(/<(script|style|iframe|object|embed|form|input|svg)[^>]*>[\s\S]*?<\/\1>/gi, "");
  clean = clean.replace(/<(script|style|iframe|object|embed|form|input|svg)[^>]*\/>/gi, "");
  // Strip on* handlers and javascript: URLs
  clean = clean.replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, "");
  clean = clean.replace(/\son[a-z]+\s*=\s*'[^']*'/gi, "");
  clean = clean.replace(/href\s*=\s*["']\s*javascript:[^"']*["']/gi, 'href="#"');
  return clean;
}

function substituteVars(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

function renderHeader(variant: string, subtitle: string | undefined, charter: NewsletterCharter): string {
  if (variant === "white") {
    return `<tr><td align="center" style="padding:28px 24px;background:#ffffff;border-bottom:1px solid ${charter.accentColor}33;">
      <img src="${charter.logoUrl}" alt="GASPE" width="120" style="display:block;border:0;max-width:120px;height:auto;">
      ${subtitle ? `<p style="margin:12px 0 0;color:${charter.textColor};font-family:${charter.fontFamily};font-size:12px;line-height:1.4;">${esc(subtitle)}</p>` : ""}
    </td></tr>`;
  }
  return `<tr><td align="center" style="padding:32px 24px;background:linear-gradient(135deg,${charter.primaryColor} 0%,${charter.accentColor} 100%);">
    <img src="${charter.logoWhiteUrl}" alt="GASPE" width="120" style="display:block;border:0;max-width:120px;height:auto;">
    <p style="margin:12px 0 0;color:rgba(255,255,255,0.85);font-family:${charter.fontFamily};font-size:12px;line-height:1.4;letter-spacing:0.5px;">
      ${esc(subtitle || "Localement ancrés. Socialement engagés.")}
    </p>
  </td></tr>`;
}

function renderHeading(text: string, level: number, align: string, charter: NewsletterCharter): string {
  const fontSize = level === 1 ? "26px" : level === 2 ? "20px" : "16px";
  return `<tr><td align="${align}" style="padding:24px 32px 8px;">
    <h${level} style="margin:0;color:${charter.textColor};font-family:${charter.fontFamily};font-size:${fontSize};line-height:1.3;font-weight:700;text-align:${align};">
      ${esc(text)}
    </h${level}>
  </td></tr>`;
}

function renderParagraph(html: string, charter: NewsletterCharter): string {
  const clean = sanitizeNewsletterHtml(html);
  return `<tr><td style="padding:8px 32px 16px;">
    <div style="color:${charter.textColor};font-family:${charter.fontFamily};font-size:15px;line-height:1.6;">
      ${clean}
    </div>
  </td></tr>`;
}

function renderImage(url: string, alt: string, width: string, link: string | undefined): string {
  if (!url) return "";
  const w = width === "half" ? "50%" : "100%";
  const img = `<img src="${esc(url)}" alt="${esc(alt)}" width="600" style="display:block;border:0;width:${w};max-width:100%;height:auto;">`;
  const wrapped = link
    ? `<a href="${esc(link)}" target="_blank" rel="noopener" style="display:inline-block;">${img}</a>`
    : img;
  return `<tr><td align="center" style="padding:16px 32px;">${wrapped}</td></tr>`;
}

function renderButton(label: string, url: string, color: string, align: string, charter: NewsletterCharter): string {
  const bg = color === "neutral" ? "#4a5563" : charter.primaryColor;
  return `<tr><td align="${align}" style="padding:16px 32px 24px;">
    <table role="presentation" cellspacing="0" cellpadding="0" style="border-collapse:separate;">
      <tr>
        <td style="background:${bg};border-radius:10px;padding:0;">
          <a href="${esc(url)}" target="_blank" rel="noopener"
             style="display:inline-block;padding:13px 28px;color:#ffffff;text-decoration:none;font-family:${charter.fontFamily};font-size:14px;font-weight:600;">
            ${esc(label)}
          </a>
        </td>
      </tr>
    </table>
  </td></tr>`;
}

function renderDivider(style: string, charter: NewsletterCharter): string {
  if (style === "gradient") {
    return `<tr><td style="padding:16px 32px;">
      <div style="height:3px;background:linear-gradient(90deg,${charter.primaryColor},${charter.accentColor},transparent);"></div>
    </td></tr>`;
  }
  const border = style === "dashed" ? `dashed ${charter.accentColor}80` : `solid ${charter.accentColor}55`;
  return `<tr><td style="padding:16px 32px;">
    <div style="border-top:1px ${border};"></div>
  </td></tr>`;
}

function renderSpacer(height: number): string {
  const h = Math.max(4, Math.min(100, Math.floor(height)));
  return `<tr><td style="height:${h}px;line-height:${h}px;font-size:${h}px;">&nbsp;</td></tr>`;
}

function renderColumns(items: { html: string; image?: string }[], charter: NewsletterCharter): string {
  const cols = items.slice(0, 2); // max 2 cols
  if (cols.length === 0) return "";
  const cellWidth = cols.length === 1 ? "100%" : "50%";
  const cells = cols
    .map((item) => {
      const img = item.image
        ? `<img src="${esc(item.image)}" alt="" style="display:block;border:0;width:100%;max-width:100%;height:auto;margin-bottom:12px;">`
        : "";
      const body = sanitizeNewsletterHtml(item.html || "");
      return `<td valign="top" width="${cellWidth}" style="padding:8px;color:${charter.textColor};font-family:${charter.fontFamily};font-size:14px;line-height:1.5;">
        ${img}${body}
      </td>`;
    })
    .join("");
  return `<tr><td style="padding:8px 24px;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
      <tr>${cells}</tr>
    </table>
  </td></tr>`;
}

function renderFooter(showUnsub: boolean, showAddress: boolean, charter: NewsletterCharter): string {
  const unsub = showUnsub
    ? `<p style="margin:0 0 8px;color:${charter.accentColor};font-family:${charter.fontFamily};font-size:11px;line-height:1.4;">
        Vous recevez cet email car vous êtes inscrit à la newsletter GASPE.
        <a href="${charter.unsubscribeUrl}" style="color:${charter.primaryColor};text-decoration:underline;">Se désinscrire</a>
        · <a href="${charter.webVersionUrl}" style="color:${charter.primaryColor};text-decoration:underline;">Version web</a>
      </p>`
    : "";
  const addr = showAddress
    ? `<p style="margin:0;color:${charter.accentColor};font-family:${charter.fontFamily};font-size:11px;line-height:1.4;">
        ${esc(charter.addressRgpd)}
      </p>`
    : "";
  return `<tr><td align="center" style="padding:24px 32px;background:#f9f9f9;border-top:1px solid #e5e5e5;">
    <p style="margin:0 0 8px;color:${charter.textColor};font-family:${charter.fontFamily};font-size:12px;line-height:1.4;font-weight:600;">
      ${esc(charter.footerSignature)}
    </p>
    <p style="margin:0 0 12px;">
      <a href="${esc(charter.linkedinUrl)}" style="color:${charter.primaryColor};font-family:${charter.fontFamily};font-size:12px;text-decoration:none;">LinkedIn GASPE</a>
    </p>
    ${unsub}
    ${addr}
  </td></tr>`;
}

function renderBlock(block: NewsletterBlock, charter: NewsletterCharter): string {
  switch (block.type) {
    case "header": return renderHeader(block.variant, block.subtitle, charter);
    case "heading": return renderHeading(block.text, block.level, block.align, charter);
    case "paragraph": return renderParagraph(block.html, charter);
    case "image": return renderImage(block.url, block.alt, block.width, block.link);
    case "button": return renderButton(block.label, block.url, block.color, block.align, charter);
    case "divider": return renderDivider(block.style, charter);
    case "spacer": return renderSpacer(block.height);
    case "columns": return renderColumns(block.items || [], charter);
    case "footer": return renderFooter(block.showUnsub, block.showContactAddress, charter);
    default: return "";
  }
}

export function renderNewsletter(blocks: NewsletterBlock[], opts: RenderOptions): string {
  const charter: NewsletterCharter = { ...DEFAULT_CHARTER, ...opts.charter };
  const vars = opts.vars ?? {};
  const preheader = substituteVars(opts.preheader ?? "", vars);
  const subject = substituteVars(opts.subject ?? "", vars);

  // Ensure the newsletter has a header + footer, even if editor omitted them
  const hasHeader = blocks.some((b) => b.type === "header");
  const hasFooter = blocks.some((b) => b.type === "footer");
  const effectiveBlocks: NewsletterBlock[] = [
    ...(hasHeader ? [] : [{ type: "header" as const, variant: "gradient" as const }]),
    ...blocks,
    ...(hasFooter ? [] : [{ type: "footer" as const, showUnsub: true, showContactAddress: true }]),
  ];

  const body = effectiveBlocks
    .map((block) => {
      const rendered = renderBlock(block, charter);
      return substituteVars(rendered, vars);
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light">
  <title>${esc(subject)}</title>
  <!--[if mso]>
  <style>table,td,tr {border-collapse:collapse;} a,p,h1,h2,h3 {font-family:Arial,sans-serif;}</style>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background:${charter.backgroundColor};">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${esc(preheader)}</div>` : ""}
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${charter.backgroundColor};padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:600px;max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;">
          ${body}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
