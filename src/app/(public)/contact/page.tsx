"use client";

import { useState, type FormEvent } from "react";
import { CmsPageHeader } from "@/components/shared/CmsPageHeader";
import { submitContact } from "@/lib/api";
import { sendContactConfirmation } from "@/lib/email";
import { useScrollReveal } from "@/lib/useScrollReveal";
import { useCmsContent } from "@/lib/use-cms";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { getCmsDefault } from "@/data/cms-defaults";

const D = (s: string) => getCmsDefault("contact", s);

interface FormErrors {
  nom?: string;
  email?: string;
  sujet?: string;
  message?: string;
}

interface FormData {
  nom: string;
  email: string;
  societe: string;
  sujet: string;
  message: string;
}

const initialForm: FormData = { nom: "", email: "", societe: "", sujet: "", message: "" };

function validate(data: FormData): FormErrors {
  const errors: FormErrors = {};
  if (!data.nom.trim()) errors.nom = "Le nom est requis.";
  if (!data.email.trim()) {
    errors.email = "L'email est requis.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Veuillez entrer un email valide.";
  }
  if (!data.sujet.trim()) errors.sujet = "Le sujet est requis.";
  if (!data.message.trim()) {
    errors.message = "Le message est requis.";
  } else if (data.message.trim().length < 10) {
    errors.message = "Le message doit contenir au moins 10 caractères.";
  }
  return errors;
}

const inputBase = "w-full rounded-xl border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-foreground-muted/50 focus:outline-none focus:ring-1 transition-colors";
const inputOk = inputBase + " border-[var(--gaspe-neutral-200)] focus:border-[var(--gaspe-teal-400)] focus:ring-[var(--gaspe-teal-400)]";
const inputErr = inputBase + " border-red-300 focus:border-red-400 focus:ring-red-400";

export default function ContactPage() {
  const revealRef = useScrollReveal();
  const [form, setForm] = useState<FormData>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [submitting, setSubmitting] = useState(false);

  const addressHtml = useCmsContent("contact", "address", D("address"));
  const emailStr = useCmsContent("contact", "email", D("email"));
  const sidebarInfo = useCmsContent("contact", "sidebar-info", D("sidebar-info"));

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("idle");
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return; }
    setSubmitting(true);
    setErrors({});
    try {
      const result = await submitContact(form);
      if (!result.success) throw new Error("Submit failed");
      setStatus("success");
      // Send confirmation email (fire & forget)
      sendContactConfirmation({ name: form.nom, email: form.email, subject: form.sujet });
      setForm(initialForm);
    } catch {
      setStatus("error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <CmsPageHeader
        pageId="contact"
        defaultTitle="Contact"
        defaultDescription="Une question ? N'hésitez pas à nous contacter."
        breadcrumbs={[{ label: "Contact" }]}
      />

      <div ref={revealRef} className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          {/* Form */}
          <div className="lg:col-span-2 reveal">
            <div className="rounded-2xl bg-surface border border-[var(--gaspe-neutral-200)] p-6 sm:p-8">
              {status === "success" && (
                <div className="mb-6 rounded-xl border border-[var(--gaspe-green-200)] bg-[var(--gaspe-green-50)] p-5 flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--gaspe-green-200)]">
                    <svg className="h-4 w-4 text-[var(--gaspe-green-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-heading text-sm font-semibold text-[var(--gaspe-green-600)]">Message envoyé !</p>
                    <p className="mt-1 text-sm text-[var(--gaspe-green-600)]/80">
                      Merci pour votre message. Nous vous répondrons dans les meilleurs délais.
                    </p>
                  </div>
                </div>
              )}

              {status === "error" && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-5 flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-200">
                    <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-heading text-sm font-semibold text-red-700">Erreur</p>
                    <p className="mt-1 text-sm text-red-600">Une erreur est survenue. Veuillez réessayer.</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="nom" className="block text-sm font-medium text-foreground mb-1.5">
                      Nom <span className="text-red-400">*</span>
                    </label>
                    <input id="nom" name="nom" type="text" value={form.nom} onChange={handleChange} className={errors.nom ? inputErr : inputOk} placeholder="Votre nom" />
                    {errors.nom && <p className="mt-1.5 text-xs text-red-500">{errors.nom}</p>}
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
                      Email <span className="text-red-400">*</span>
                    </label>
                    <input id="email" name="email" type="email" autoComplete="email" value={form.email} onChange={handleChange} className={errors.email ? inputErr : inputOk} placeholder="votre@email.fr" />
                    {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="societe" className="block text-sm font-medium text-foreground mb-1.5">
                      Société / Organisation
                    </label>
                    <input id="societe" name="societe" type="text" value={form.societe} onChange={handleChange} className={inputOk} placeholder="Optionnel" />
                  </div>
                  <div>
                    <label htmlFor="sujet" className="block text-sm font-medium text-foreground mb-1.5">
                      Sujet <span className="text-red-400">*</span>
                    </label>
                    <select id="sujet" name="sujet" value={form.sujet} onChange={handleChange} className={errors.sujet ? inputErr : inputOk}>
                      <option value="">Sélectionnez un sujet...</option>
                      <option value="Question générale">Question générale</option>
                      <option value="Adhésion au GASPE">Adhésion au GASPE</option>
                      <option value="Recrutement">Recrutement</option>
                      <option value="Formations">Formations</option>
                      <option value="Presse / Média">Presse / Média</option>
                      <option value="Autre">Autre</option>
                    </select>
                    {errors.sujet && <p className="mt-1.5 text-xs text-red-500">{errors.sujet}</p>}
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-foreground mb-1.5">
                    Message <span className="text-red-400">*</span>
                  </label>
                  <textarea id="message" name="message" rows={5} value={form.message} onChange={handleChange} className={(errors.message ? inputErr : inputOk) + " resize-y"} placeholder="Votre message..." />
                  {errors.message && <p className="mt-1.5 text-xs text-red-500">{errors.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--gaspe-teal-600)] px-7 py-3 text-sm font-semibold text-white hover:bg-[var(--gaspe-teal-700)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {submitting ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                      </svg>
                      Envoyer le message
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5 reveal stagger-2">
            <div className="rounded-2xl bg-surface border border-[var(--gaspe-neutral-200)] p-6">
              <h3 className="font-heading text-base font-semibold text-foreground mb-5 flex items-center gap-2">
                <svg className="h-5 w-5 text-[var(--gaspe-teal-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
                Coordonnées
              </h3>
              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <svg className="h-4 w-4 text-[var(--gaspe-teal-600)] mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                  </svg>
                  <div
                    className="text-foreground-muted [&_p]:m-0 [&_strong]:text-foreground [&_strong]:font-medium"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(addressHtml) }}
                  />
                </div>
                <div className="flex items-start gap-3">
                  <svg className="h-4 w-4 text-[var(--gaspe-teal-600)] mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                  <div>
                    <p className="font-medium text-foreground">Email</p>
                    <a href={`mailto:${emailStr}`} className="text-[var(--gaspe-teal-600)] hover:text-[var(--gaspe-teal-700)] transition-colors">
                      {emailStr}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-[var(--gaspe-teal-50)] to-[var(--gaspe-blue-50)] border border-[var(--gaspe-teal-100)] p-6">
              <h3 className="font-heading text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <svg className="h-4 w-4 text-[var(--gaspe-teal-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                Engagé depuis 1951
              </h3>
              <div
                className="text-sm text-foreground-muted leading-relaxed [&_p]:m-0"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(sidebarInfo) }}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
