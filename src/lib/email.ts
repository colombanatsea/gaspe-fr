/* ------------------------------------------------------------------ */
/*  Transactional email service — via CF Worker proxy to Brevo         */
/*  The API key stays server-side. Client sends to /api/email.         */
/* ------------------------------------------------------------------ */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

function getConfig() {
  const adminEmail = process.env.NEXT_PUBLIC_BREVO_ADMIN_EMAIL ?? "admin@gaspe.fr";
  return { adminEmail };
}

interface SendEmailParams {
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent: string;
  textContent?: string;
}

async function sendEmail(params: SendEmailParams): Promise<{ success: boolean; error?: string }> {
  const endpoint = API_URL ? `${API_URL}/api/email` : "/api/email";

  if (!API_URL) {
    console.warn("[Email] Pas d'API_URL configurée — email non envoyé (mode localStorage)");
    return { success: false, error: "API_URL non configurée" };
  }

  try {
    // Get auth token for the request
    const token = typeof window !== "undefined" ? localStorage.getItem("gaspe_api_token") : null;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        to: params.to,
        subject: params.subject,
        htmlContent: params.htmlContent,
        textContent: params.textContent,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const msg = (body as { error?: string }).error ?? `HTTP ${res.status}`;
      console.error("[Email] Erreur envoi:", msg);
      return { success: false, error: msg };
    }

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur inconnue";
    console.error("[Email] Erreur réseau:", msg);
    return { success: false, error: msg };
  }
}

/* ------------------------------------------------------------------ */
/*  Email templates                                                    */
/* ------------------------------------------------------------------ */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gaspe-fr.pages.dev";

const HEADER = `
  <div style="background:#1B7E8A;padding:24px 32px;text-align:center;">
    <h1 style="margin:0;color:#fff;font-family:'Exo 2',Helvetica,sans-serif;font-size:24px;">GASPE</h1>
    <p style="margin:4px 0 0;color:#B2DFE3;font-family:'DM Sans',Helvetica,sans-serif;font-size:13px;">Localement ancrés. Socialement engagés.</p>
  </div>
`;

const FOOTER = `
  <div style="margin-top:32px;padding:16px 32px;border-top:1px solid #DCD5CC;text-align:center;font-family:'DM Sans',Helvetica,sans-serif;font-size:12px;color:#6B6560;">
    <p style="margin:0;">GASPE — Groupement des Armateurs de Services Publics Maritimes de Passages d'Eau</p>
    <p style="margin:4px 0 0;">Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
  </div>
`;

function emailWrapper(body: string): string {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;background:#F5F3F0;font-family:'DM Sans',Helvetica,sans-serif;">
      <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;margin-top:24px;margin-bottom:24px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        ${HEADER}
        <div style="padding:32px;">
          ${body}
        </div>
        ${FOOTER}
      </div>
    </body>
    </html>
  `;
}

/* ------------------------------------------------------------------ */
/*  Public email functions                                             */
/* ------------------------------------------------------------------ */

/** Notify admin that a new adherent registration is pending approval. */
export async function sendNewAdherentNotification(adherent: {
  name: string;
  email: string;
  company?: string;
}): Promise<{ success: boolean; error?: string }> {
  const { adminEmail } = getConfig();

  return sendEmail({
    to: [{ email: adminEmail, name: "Administrateur GASPE" }],
    subject: `Nouvelle demande d'adhésion — ${adherent.name}`,
    htmlContent: emailWrapper(`
      <h2 style="margin:0 0 16px;color:#222221;font-family:'Exo 2',Helvetica,sans-serif;font-size:20px;">Nouvelle demande d'adhésion</h2>
      <p style="margin:0 0 8px;color:#222221;font-size:15px;">Un nouvel adhérent demande à rejoindre le GASPE :</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:8px 12px;font-weight:600;color:#6B6560;width:120px;">Nom</td><td style="padding:8px 12px;color:#222221;">${adherent.name}</td></tr>
        <tr style="background:#F5F3F0;"><td style="padding:8px 12px;font-weight:600;color:#6B6560;">Email</td><td style="padding:8px 12px;color:#222221;">${adherent.email}</td></tr>
        ${adherent.company ? `<tr><td style="padding:8px 12px;font-weight:600;color:#6B6560;">Compagnie</td><td style="padding:8px 12px;color:#222221;">${adherent.company}</td></tr>` : ""}
      </table>
      <p style="margin:16px 0 0;">
        <a href="${SITE_URL}/admin/comptes" style="display:inline-block;background:#1B7E8A;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-family:'Exo 2',Helvetica,sans-serif;font-size:14px;">
          Voir les demandes en attente
        </a>
      </p>
    `),
    textContent: `Nouvelle demande d'adhésion de ${adherent.name} (${adherent.email})${adherent.company ? ` — ${adherent.company}` : ""}. Connectez-vous à ${SITE_URL}/admin/comptes pour valider.`,
  });
}

/** Notify an adherent that their account has been approved. */
export async function sendApprovalNotification(adherent: {
  name: string;
  email: string;
}): Promise<{ success: boolean; error?: string }> {
  return sendEmail({
    to: [{ email: adherent.email, name: adherent.name }],
    subject: "Votre compte GASPE a été validé",
    htmlContent: emailWrapper(`
      <h2 style="margin:0 0 16px;color:#222221;font-family:'Exo 2',Helvetica,sans-serif;font-size:20px;">Bienvenue au GASPE !</h2>
      <p style="margin:0 0 12px;color:#222221;font-size:15px;">Bonjour ${adherent.name},</p>
      <p style="margin:0 0 12px;color:#222221;font-size:15px;">Votre demande d'adhésion a été validée par l'administrateur. Vous pouvez désormais accéder à votre espace adhérent.</p>
      <p style="margin:24px 0;">
        <a href="${SITE_URL}/connexion" style="display:inline-block;background:#1B7E8A;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-family:'Exo 2',Helvetica,sans-serif;font-size:14px;">
          Se connecter
        </a>
      </p>
      <p style="margin:0;color:#6B6560;font-size:13px;">Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.</p>
    `),
    textContent: `Bonjour ${adherent.name}, votre compte GASPE a été validé. Connectez-vous sur ${SITE_URL}/connexion`,
  });
}

/** Notify an adherent that their account has been rejected. */
export async function sendRejectionNotification(adherent: {
  name: string;
  email: string;
}): Promise<{ success: boolean; error?: string }> {
  return sendEmail({
    to: [{ email: adherent.email, name: adherent.name }],
    subject: "Votre demande d'adhésion GASPE",
    htmlContent: emailWrapper(`
      <h2 style="margin:0 0 16px;color:#222221;font-family:'Exo 2',Helvetica,sans-serif;font-size:20px;">Demande d'adhésion non retenue</h2>
      <p style="margin:0 0 12px;color:#222221;font-size:15px;">Bonjour ${adherent.name},</p>
      <p style="margin:0 0 12px;color:#222221;font-size:15px;">Nous avons examiné votre demande d'adhésion au GASPE. Malheureusement, celle-ci n'a pas pu être validée.</p>
      <p style="margin:0 0 12px;color:#222221;font-size:15px;">Pour toute question, n'hésitez pas à nous contacter.</p>
      <p style="margin:24px 0;">
        <a href="${SITE_URL}/contact" style="display:inline-block;background:#1B7E8A;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-family:'Exo 2',Helvetica,sans-serif;font-size:14px;">
          Nous contacter
        </a>
      </p>
    `),
    textContent: `Bonjour ${adherent.name}, votre demande d'adhésion au GASPE n'a pas été retenue. Contactez-nous sur ${SITE_URL}/contact pour plus d'informations.`,
  });
}

/** Welcome email for auto-approved candidats. */
export async function sendWelcomeCandidatNotification(candidat: {
  name: string;
  email: string;
}): Promise<{ success: boolean; error?: string }> {
  return sendEmail({
    to: [{ email: candidat.email, name: candidat.name }],
    subject: "Bienvenue sur GASPE — Votre espace candidat est prêt",
    htmlContent: emailWrapper(`
      <h2 style="margin:0 0 16px;color:#222221;font-family:'Exo 2',Helvetica,sans-serif;font-size:20px;">Bienvenue sur GASPE !</h2>
      <p style="margin:0 0 12px;color:#222221;font-size:15px;">Bonjour ${candidat.name},</p>
      <p style="margin:0 0 12px;color:#222221;font-size:15px;">Votre compte candidat a été créé avec succès. Vous pouvez dès maintenant :</p>
      <ul style="margin:0 0 12px;padding-left:20px;color:#222221;font-size:15px;">
        <li>Consulter les offres d'emploi maritime</li>
        <li>Postuler directement aux offres qui vous correspondent</li>
        <li>Gérer vos certifications et votre expérience</li>
        <li>Suivre vos candidatures en temps réel</li>
      </ul>
      <p style="margin:24px 0;">
        <a href="${SITE_URL}/nos-compagnies-recrutent" style="display:inline-block;background:#1B7E8A;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-family:'Exo 2',Helvetica,sans-serif;font-size:14px;">
          Voir les offres d'emploi
        </a>
      </p>
      <p style="margin:16px 0 0;">
        <a href="${SITE_URL}/espace-candidat/preferences" style="color:#1B7E8A;font-size:13px;text-decoration:none;">
          Gérer mes préférences de newsletter →
        </a>
      </p>
    `),
    textContent: `Bienvenue ${candidat.name} ! Votre compte candidat GASPE est actif. Consultez les offres : ${SITE_URL}/nos-compagnies-recrutent`,
  });
}

/** Notify company responsable that a new application was received. */
export async function sendApplicationReceivedNotification(data: {
  recruiterName: string;
  recruiterEmail: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  companyName: string;
}): Promise<{ success: boolean; error?: string }> {
  return sendEmail({
    to: [{ email: data.recruiterEmail, name: data.recruiterName }],
    subject: `Nouvelle candidature — ${data.jobTitle}`,
    htmlContent: emailWrapper(`
      <h2 style="margin:0 0 16px;color:#222221;font-family:'Exo 2',Helvetica,sans-serif;font-size:20px;">Nouvelle candidature reçue</h2>
      <p style="margin:0 0 12px;color:#222221;font-size:15px;">Bonjour ${data.recruiterName},</p>
      <p style="margin:0 0 12px;color:#222221;font-size:15px;">Un candidat a postulé à votre offre :</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:8px 12px;font-weight:600;color:#6B6560;width:120px;">Offre</td><td style="padding:8px 12px;color:#222221;">${data.jobTitle}</td></tr>
        <tr style="background:#F5F3F0;"><td style="padding:8px 12px;font-weight:600;color:#6B6560;">Candidat</td><td style="padding:8px 12px;color:#222221;">${data.candidateName}</td></tr>
        <tr><td style="padding:8px 12px;font-weight:600;color:#6B6560;">Email</td><td style="padding:8px 12px;color:#222221;">${data.candidateEmail}</td></tr>
      </table>
      <p style="margin:16px 0 0;">
        <a href="${SITE_URL}/espace-adherent/offres" style="display:inline-block;background:#1B7E8A;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-family:'Exo 2',Helvetica,sans-serif;font-size:14px;">
          Gérer les candidatures
        </a>
      </p>
    `),
    textContent: `Nouvelle candidature de ${data.candidateName} (${data.candidateEmail}) pour "${data.jobTitle}". Gérez-la sur ${SITE_URL}/espace-adherent/offres`,
  });
}

/** Notify candidat of application status change. */
export async function sendApplicationStatusNotification(data: {
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  companyName: string;
  status: string;
  statusLabel: string;
  message?: string;
}): Promise<{ success: boolean; error?: string }> {
  const statusColors: Record<string, string> = {
    viewed: "#2F72A0",
    shortlisted: "#1B7E8A",
    interview: "#D97706",
    accepted: "#16A34A",
    rejected: "#DC2626",
  };
  const color = statusColors[data.status] ?? "#1B7E8A";

  return sendEmail({
    to: [{ email: data.candidateEmail, name: data.candidateName }],
    subject: `Candidature "${data.jobTitle}" — ${data.statusLabel}`,
    htmlContent: emailWrapper(`
      <h2 style="margin:0 0 16px;color:#222221;font-family:'Exo 2',Helvetica,sans-serif;font-size:20px;">Mise à jour de votre candidature</h2>
      <p style="margin:0 0 12px;color:#222221;font-size:15px;">Bonjour ${data.candidateName},</p>
      <p style="margin:0 0 12px;color:#222221;font-size:15px;">Votre candidature pour le poste <strong>${data.jobTitle}</strong> chez <strong>${data.companyName}</strong> a changé de statut :</p>
      <div style="margin:16px 0;padding:16px;border-left:4px solid ${color};background:#F5F3F0;border-radius:0 8px 8px 0;">
        <p style="margin:0;font-size:16px;font-weight:600;color:${color};">${data.statusLabel}</p>
      </div>
      ${data.message ? `
        <div style="margin:16px 0;padding:16px;background:#F5F3F0;border-radius:8px;">
          <p style="margin:0 0 4px;font-size:12px;color:#6B6560;font-weight:600;">Message du recruteur :</p>
          <p style="margin:0;color:#222221;font-size:14px;">${data.message}</p>
        </div>
      ` : ""}
      <p style="margin:24px 0;">
        <a href="${SITE_URL}/espace-candidat" style="display:inline-block;background:#1B7E8A;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-family:'Exo 2',Helvetica,sans-serif;font-size:14px;">
          Voir mes candidatures
        </a>
      </p>
    `),
    textContent: `Bonjour ${data.candidateName}, votre candidature pour "${data.jobTitle}" est passée au statut : ${data.statusLabel}. ${data.message ? `Message: ${data.message}` : ""} Détails : ${SITE_URL}/espace-candidat`,
  });
}

/** Confirmation email for contact form submission. */
export async function sendContactConfirmation(data: {
  name: string;
  email: string;
  subject: string;
}): Promise<{ success: boolean; error?: string }> {
  return sendEmail({
    to: [{ email: data.email, name: data.name }],
    subject: "Votre message a bien été reçu — GASPE",
    htmlContent: emailWrapper(`
      <h2 style="margin:0 0 16px;color:#222221;font-family:'Exo 2',Helvetica,sans-serif;font-size:20px;">Message reçu</h2>
      <p style="margin:0 0 12px;color:#222221;font-size:15px;">Bonjour ${data.name},</p>
      <p style="margin:0 0 12px;color:#222221;font-size:15px;">Nous avons bien reçu votre message concernant : <strong>${data.subject}</strong></p>
      <p style="margin:0 0 12px;color:#222221;font-size:15px;">Notre équipe vous répondra dans les meilleurs délais.</p>
      <p style="margin:0;color:#6B6560;font-size:13px;">Cet email est un accusé de réception automatique.</p>
    `),
    textContent: `Bonjour ${data.name}, votre message "${data.subject}" a bien été reçu par le GASPE. Nous vous répondrons dans les meilleurs délais.`,
  });
}
