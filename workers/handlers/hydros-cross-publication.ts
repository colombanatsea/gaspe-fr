/**
 * Handler Hydros Alumni cross-publication (POST /api/hydros/publish).
 *
 * JWT auth requis. Login + form submit côté AlumnForce, retourne
 * `hydrosOfferUrl` + `hydrosOfferId`. Secrets : `HYDROS_EMAIL`,
 * `HYDROS_PASSWORD` côté Worker env.
 *
 * Extrait de `workers/api.ts` en J1 vague 7.c.
 */

import { verifyJwt } from "../jwt";
import { json } from "../lib/json";
import { extractToken } from "../lib/auth";
import type { Env } from "../lib/env";

export async function handleHydrosPublish(
  request: Request, env: Env, corsHeaders: Record<string, string>,
) {
  // Require authentication
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload) return json({ error: "Token invalide" }, corsHeaders, 401);

  if (!env.HYDROS_EMAIL || !env.HYDROS_PASSWORD) {
    return json({ error: "Credentials Hydros Alumni non configurés" }, corsHeaders, 500);
  }

  const body = await request.json() as {
    title: string;
    description: string;
    profile?: string;
    conditions?: string;
    companyName: string;
    companyDescription?: string;
    location: string;
    reference?: string;
    contractTypeId: string;
    positionId: string;
    beginId: string;
    sectorId: string;
    remoteId: string;
    expiresAt?: string;
    handiAccessible?: boolean;
    contactFirstName?: string;
    contactLastName?: string;
    contactEmail: string;
    contactPhone?: string;
    applicationUrl?: string;
  };

  if (!body.title || !body.description || !body.contactEmail) {
    return json({ error: "Champs requis: title, description, contactEmail" }, corsHeaders, 400);
  }

  try {
    // Step 1: Login to Hydros Alumni
    const loginRes = await fetch("https://www.hydros-alumni.org/fr/login", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        email: env.HYDROS_EMAIL,
        password: env.HYDROS_PASSWORD,
        _action: "login",
      }),
      redirect: "manual",
    });

    // Extract session cookie
    const cookies = loginRes.headers.getAll("set-cookie");
    const sessionCookie = cookies
      .map((c) => c.split(";")[0])
      .filter((c) => c.startsWith("AFSESSID=") || c.startsWith("PHPSESSID="))
      .join("; ");

    if (!sessionCookie) {
      return json({ error: "Échec de connexion à Hydros Alumni" }, corsHeaders, 502);
    }

    // Step 2: Build form data for offer creation
    const fullDescription = [
      body.description,
      body.profile ? `<h3>Profil recherché</h3>${body.profile}` : "",
      body.conditions ? `<h3>Conditions et avantages</h3>${body.conditions}` : "",
    ].filter(Boolean).join("\n");

    const formData = new URLSearchParams({
      "offer[title]": body.title,
      "offer[description]": fullDescription,
      "offer[company_name]": body.companyName,
      "offer[company_description]": body.companyDescription || `${body.companyName}, compagnie maritime adhérente du GASPE.`,
      "offer[company_sector_id]": body.sectorId,
      "offer[contract_type_id]": body.contractTypeId,
      "offer[position_id]": body.positionId,
      "offer[sector_id]": body.sectorId,
      "offer[remote_id]": body.remoteId,
      "offer[begin_id]": body.beginId,
      "offer[location]": body.location,
      "offer[contact_email]": body.contactEmail,
      "offer[contact_consent]": "1",
    });

    if (body.reference) formData.set("offer[reference]", body.reference);
    if (body.expiresAt) formData.set("offer[end_date]", body.expiresAt);
    if (body.contactFirstName) formData.set("offer[contact_first_name]", body.contactFirstName);
    if (body.contactLastName) formData.set("offer[contact_last_name]", body.contactLastName);
    if (body.contactPhone) formData.set("offer[contact_phone]", body.contactPhone);
    if (body.applicationUrl) formData.set("offer[application_url]", body.applicationUrl);
    if (body.handiAccessible) formData.set("offer[handicap]", "1");

    // Step 3: Submit the offer
    const submitRes = await fetch("https://www.hydros-alumni.org/fr/jobboard/offer/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cookie": sessionCookie,
      },
      body: formData,
      redirect: "manual",
    });

    // Check for redirect to the new offer page
    const redirectUrl = submitRes.headers.get("location") ?? "";

    if (submitRes.status >= 300 && submitRes.status < 400 && redirectUrl.includes("/jobboard/offer/")) {
      // Extract offer ID from URL like /fr/jobboard/offer/cdi/titre/518
      const parts = redirectUrl.split("/");
      const hydrosOfferId = parts[parts.length - 1];
      const hydrosOfferUrl = redirectUrl.startsWith("http")
        ? redirectUrl
        : `https://www.hydros-alumni.org${redirectUrl}`;

      return json({ success: true, hydrosOfferUrl, hydrosOfferId }, corsHeaders);
    }

    // Try to get the response body for error info
    const responseText = await submitRes.text().catch(() => "");
    console.error("[Hydros] Submit failed:", submitRes.status, responseText.slice(0, 500));
    return json({
      error: `Publication échouée (HTTP ${submitRes.status}). Vérifiez les credentials Hydros.`,
      success: false,
    }, corsHeaders, 502);
  } catch (err) {
    console.error("[Hydros] Error:", err);
    return json({ error: "Erreur de connexion à Hydros Alumni" }, corsHeaders, 502);
  }
}
