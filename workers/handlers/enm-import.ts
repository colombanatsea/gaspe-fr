/**
 * Handler ENM – Espace Numérique Maritime (POST /api/enm/import).
 *
 * Login + scrape sea service, certificates, medical aptitude depuis
 * `enm.mes-services.mer.gouv.fr` (par identifiants ENM passés en body).
 *
 * Note : FranceConnect empêche désormais l'accès API direct. Cette
 * voie scrape l'ancien login form ; en pratique l'import passe par
 * copier-coller front-side (cf. `src/lib/enm-parser.ts`). Conservé ici
 * pour compatibilité endpoint historique.
 *
 * Extrait de `workers/api.ts` en J1 vague 7.d.
 */

import { verifyJwt } from "../jwt";
import { json } from "../lib/json";
import { extractToken } from "../lib/auth";
import type { Env } from "../lib/env";

const ENM_BASE = "https://enm.mes-services.mer.gouv.fr";

export async function handleEnmImport(
  request: Request, env: Env, corsHeaders: Record<string, string>,
) {
  // Require GASPE authentication
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload) return json({ error: "Token invalide" }, corsHeaders, 401);

  const body = await request.json() as { email: string; password: string };
  if (!body.email?.trim() || !body.password) {
    return json({ error: "Identifiants ENM requis" }, corsHeaders, 400);
  }

  try {
    // Step 1: Get login page to extract CSRF token
    const loginPageRes = await fetch(`${ENM_BASE}/fr/login`, {
      headers: { "User-Agent": "GASPE-Import/1.0" },
      redirect: "manual",
    });
    const loginPageHtml = await loginPageRes.text();

    // Extract CSRF token (hidden input _csrf_token or similar)
    const csrfMatch = loginPageHtml.match(/name="_csrf_token"\s+value="([^"]+)"/);
    const csrfToken = csrfMatch?.[1] ?? "";

    // Extract session cookies from login page
    const initCookies = loginPageRes.headers.getAll("set-cookie")
      .map((c) => c.split(";")[0])
      .join("; ");

    // Step 2: Submit login form
    const loginFormData = new URLSearchParams({
      _username: body.email.trim(),
      _password: body.password,
      ...(csrfToken ? { _csrf_token: csrfToken } : {}),
    });

    const loginRes = await fetch(`${ENM_BASE}/fr/login_check`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cookie": initCookies,
        "User-Agent": "GASPE-Import/1.0",
      },
      body: loginFormData,
      redirect: "manual",
    });

    // Collect session cookies
    const allCookies = [
      ...initCookies.split("; "),
      ...loginRes.headers.getAll("set-cookie").map((c) => c.split(";")[0]),
    ].filter(Boolean);
    const sessionCookie = [...new Set(allCookies)].join("; ");

    // Check login success: should redirect to dashboard, not back to login
    const redirectUrl = loginRes.headers.get("location") ?? "";
    if (redirectUrl.includes("/login") || loginRes.status === 200) {
      return json({ error: "Identifiants ENM incorrects" }, corsHeaders, 401);
    }

    // Step 3: Fetch data pages in parallel
    const fetchPage = async (path: string): Promise<string> => {
      const res = await fetch(`${ENM_BASE}${path}`, {
        headers: { "Cookie": sessionCookie, "User-Agent": "GASPE-Import/1.0" },
        redirect: "follow",
      });
      return res.text();
    };

    const [seaServiceHtml, medicalHtml, titresHtml] = await Promise.all([
      fetchPage("/fr/univers-marin/pmr/lignes-de-service"),
      fetchPage("/fr/univers-marin/pmr/aptitude-medicale"),
      fetchPage("/fr/univers-marin/pmr/mes-titres"),
    ]);

    // Step 4: Parse sea service lines
    const seaService = parseEnmSeaService(seaServiceHtml);
    const certificates = parseEnmCertificates(titresHtml);
    const medical = parseEnmMedical(medicalHtml);

    // Extract marin ID from page header (n° XXXXXXXX)
    const marinIdMatch = seaServiceHtml.match(/(\d{7,8})\s*$/m) ?? medicalHtml.match(/(\d{7,8})/);
    const enmMarinId = marinIdMatch?.[1] ?? undefined;

    return json({
      success: true,
      data: { seaService, certificates, medical, enmMarinId },
    }, corsHeaders);
  } catch (err) {
    console.error("[ENM] Import error:", err);
    return json({ error: "Erreur de connexion au portail ENM" }, corsHeaders, 502);
  }
}

// ── ENM HTML parsers ──

function parseEnmSeaService(html: string): {
  id: string; vesselName: string; vesselImo: string; rank: string;
  category: string; startDate: string; endDate: string;
}[] {
  const results: ReturnType<typeof parseEnmSeaService> = [];
  // Match table rows with service line data
  // Pattern: dates | vessel - IMO | rank | category | status
  const rowRegex = /(\d{2}\/\d{2}\/\d{4})\s*-\s*(\d{2}\/\d{2}\/\d{4})[^<]*<[^>]*>[^<]*<[^>]*>\s*([^<]+?)\s*-\s*(\d+)[^<]*<[^>]*>[^<]*<[^>]*>\s*([A-Z\s]+?)\s*<[^>]*>[^<]*Cat\.:\s*(\d+)/g;
  let match;
  while ((match = rowRegex.exec(html)) !== null) {
    results.push({
      id: `enm-${Date.now()}-${results.length}`,
      startDate: parseFrenchDate(match[1]),
      endDate: parseFrenchDate(match[2]),
      vesselName: match[3].trim(),
      vesselImo: match[4].trim(),
      rank: match[5].trim(),
      category: match[6].trim(),
    });
  }

  // Fallback: simpler pattern matching for table cells
  if (results.length === 0) {
    const datePattern = /(\d{2}\/\d{2}\/\d{4})\s*-\s*(\d{2}\/\d{2}\/\d{4})/g;
    const vesselPattern = /([A-Z][A-Z\s]+\d*[A-Z]*)\s*-\s*(\d{4,})/g;
    const rankPattern = /(?:CAPITAINE|LIEUTENANT|MATELOT|CHEF MECANICIEN|OFFICIER[A-Z\s]*|BOSCO|MAITRE)/g;

    const dates = [...html.matchAll(datePattern)];
    const vessels = [...html.matchAll(vesselPattern)];
    const ranks = [...html.matchAll(rankPattern)];
    const catPattern = /Cat\.:\s*(\d+)/g;
    const cats = [...html.matchAll(catPattern)];

    const count = Math.min(dates.length, vessels.length, ranks.length);
    for (let i = 0; i < count; i++) {
      results.push({
        id: `enm-${Date.now()}-${i}`,
        startDate: parseFrenchDate(dates[i][1]),
        endDate: parseFrenchDate(dates[i][2]),
        vesselName: vessels[i][1].trim(),
        vesselImo: vessels[i][2].trim(),
        rank: ranks[i][0].trim(),
        category: cats[i]?.[1] ?? "",
      });
    }
  }

  return results;
}

function parseEnmCertificates(html: string): {
  certId: string; title: string; enmReference: string;
  status: "valid" | "expired"; expiryDate?: string;
}[] {
  const results: ReturnType<typeof parseEnmCertificates> = [];
  // Match certificate blocks: title, n° reference, status, expiry
  // Look for title text followed by n° XXXX and Valide/Expiré
  const titleBlocks = html.split(/n°\s*/);
  for (let i = 1; i < titleBlocks.length; i++) {
    const block = titleBlocks[i];
    const refMatch = block.match(/^(\d+)/);
    if (!refMatch) continue;

    const reference = refMatch[1];
    // Get title from previous block's last text content
    const prevBlock = titleBlocks[i - 1];
    const titleMatch = prevBlock.match(/([A-ZÀ-Üa-zà-ü'\s()]+(?:STCW\d*)?)\s*$/);
    const title = titleMatch?.[1]?.trim() ?? `Titre n°${reference}`;

    const isValid = block.includes("Valide") && !block.includes("Expiré");
    const expiryMatch = block.match(/(?:Expiré depuis le|depuis le)\s*(\d{2}\/\d{2}\/\d{4})/);

    results.push({
      certId: `enm-cert-${reference}`,
      title: cleanHtmlText(title),
      enmReference: reference,
      status: isValid ? "valid" : "expired",
      expiryDate: expiryMatch ? parseFrenchDate(expiryMatch[1]) : undefined,
    });
  }
  return results;
}

function parseEnmMedical(html: string): {
  visitType?: string; lastVisitDate?: string; expiryDate?: string;
  decision?: string; duration?: string; restrictions: string[];
} {
  const result: ReturnType<typeof parseEnmMedical> = { restrictions: [] };

  // Visit type
  const typeMatch = html.match(/Type de visite\s*-\s*([^<]+)/);
  if (typeMatch) result.visitType = typeMatch[1].trim();

  // Last visit date
  const lastVisitMatch = html.match(/Date de dernière visite[^<]*<[^>]*>\s*(\d{2}\/\d{2}\/\d{4})/);
  if (lastVisitMatch) result.lastVisitDate = parseFrenchDate(lastVisitMatch[1]);

  // Validity date
  const validityMatch = html.match(/Date de fin de validité[^<]*<[^>]*>\s*(\d{2}\/\d{2}\/\d{4})/);
  if (validityMatch) result.expiryDate = parseFrenchDate(validityMatch[1]);

  // Decision
  const decisionMatch = html.match(/Décision médicale[^<]*<[^>]*>\s*([^<]+)/);
  if (decisionMatch) result.decision = decisionMatch[1].trim();

  // Duration
  const durationMatch = html.match(/Durée de l'aptitude[^<]*<[^>]*>\s*([^<]+)/);
  if (durationMatch) result.duration = durationMatch[1].trim();

  // Restrictions (list items)
  const restrictionMatches = html.matchAll(/<li[^>]*>\s*([^<]+)\s*<\/li>/g);
  for (const m of restrictionMatches) {
    const text = m[1].trim();
    if (text && !text.includes("Accueil") && !text.includes("Mon compte")) {
      result.restrictions.push(text);
    }
  }

  return result;
}

function parseFrenchDate(ddmmyyyy: string): string {
  const [d, m, y] = ddmmyyyy.split("/");
  return `${y}-${m}-${d}`;
}

function cleanHtmlText(text: string): string {
  return text.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}
