"use client";

import { useState, type FormEvent } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

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

const initialForm: FormData = {
  nom: "",
  email: "",
  societe: "",
  sujet: "",
  message: "",
};

function validate(data: FormData): FormErrors {
  const errors: FormErrors = {};
  if (!data.nom.trim()) errors.nom = "Le nom est requis.";
  if (!data.email.trim()) {
    errors.email = "L\u2019email est requis.";
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

const inputClass =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

const inputErrorClass =
  "w-full rounded-md border border-red-400 bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500";

export default function ContactPage() {
  const [form, setForm] = useState<FormData>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [submitting, setSubmitting] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("idle");

    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    setErrors({});

    // Simulate server action (real implementation in Phase 3)
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setStatus("success");
      setForm(initialForm);
    } catch {
      setStatus("error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Contact"
        description="Une question ? N&apos;h&eacute;sitez pas &agrave; nous contacter."
        breadcrumbs={[{ label: "Contact" }]}
      />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
          {/* Form */}
          <div className="lg:col-span-2">
            <Card accent={false} className="p-8">
              {status === "success" && (
                <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                  <p className="font-semibold">Message envoy&eacute; !</p>
                  <p className="mt-1">
                    Merci pour votre message. Nous vous r&eacute;pondrons dans
                    les meilleurs d&eacute;lais.
                  </p>
                </div>
              )}

              {status === "error" && (
                <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                  <p className="font-semibold">Erreur</p>
                  <p className="mt-1">
                    Une erreur est survenue. Veuillez r&eacute;essayer.
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {/* Nom */}
                  <div>
                    <label
                      htmlFor="nom"
                      className="block text-sm font-medium text-foreground mb-1.5"
                    >
                      Nom <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="nom"
                      name="nom"
                      type="text"
                      value={form.nom}
                      onChange={handleChange}
                      className={errors.nom ? inputErrorClass : inputClass}
                      placeholder="Votre nom"
                    />
                    {errors.nom && (
                      <p className="mt-1 text-xs text-red-600">{errors.nom}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-foreground mb-1.5"
                    >
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      className={errors.email ? inputErrorClass : inputClass}
                      placeholder="votre@email.fr"
                    />
                    {errors.email && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.email}
                      </p>
                    )}
                  </div>
                </div>

                {/* Société */}
                <div>
                  <label
                    htmlFor="societe"
                    className="block text-sm font-medium text-foreground mb-1.5"
                  >
                    Soci&eacute;t&eacute; / Organisation
                  </label>
                  <input
                    id="societe"
                    name="societe"
                    type="text"
                    value={form.societe}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Optionnel"
                  />
                </div>

                {/* Sujet */}
                <div>
                  <label
                    htmlFor="sujet"
                    className="block text-sm font-medium text-foreground mb-1.5"
                  >
                    Sujet <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="sujet"
                    name="sujet"
                    type="text"
                    value={form.sujet}
                    onChange={handleChange}
                    className={errors.sujet ? inputErrorClass : inputClass}
                    placeholder="Objet de votre message"
                  />
                  {errors.sujet && (
                    <p className="mt-1 text-xs text-red-600">{errors.sujet}</p>
                  )}
                </div>

                {/* Message */}
                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-foreground mb-1.5"
                  >
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    value={form.message}
                    onChange={handleChange}
                    className={
                      errors.message
                        ? inputErrorClass + " resize-y"
                        : inputClass + " resize-y"
                    }
                    placeholder="Votre message"
                  />
                  {errors.message && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.message}
                    </p>
                  )}
                </div>

                <Button type="submit" disabled={submitting}>
                  {submitting ? "Envoi en cours\u2026" : "Envoyer le message"}
                </Button>
              </form>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <h3 className="font-heading text-lg font-semibold text-foreground mb-4">
                Coordonn&eacute;es
              </h3>
              <div className="space-y-4 text-sm text-foreground-muted">
                <div>
                  <p className="font-medium text-foreground">Adresse</p>
                  <p>Maison de la Mer - Daniel Gilard</p>
                  <p>Quai de la Fosse</p>
                  <p>44 000 Nantes</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">Email</p>
                  <a
                    href="mailto:contact@gaspe.fr"
                    className="text-primary hover:text-primary-hover transition-colors"
                  >
                    contact@gaspe.fr
                  </a>
                </div>
              </div>
            </Card>

            <div className="gaspe-encart rounded-lg p-6">
              <h3 className="font-heading text-sm font-semibold text-foreground mb-2">
                Engag&eacute; depuis 1951
              </h3>
              <p className="text-sm text-foreground-muted">
                Le GASPE f&eacute;d&egrave;re les armateurs de services publics
                maritimes de passages d&apos;eau et accompagne la profession
                dans ses d&eacute;fis quotidiens.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
