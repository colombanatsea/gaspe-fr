"use client";

import Link from "next/link";
import { CmsPageHeader } from "@/components/shared/CmsPageHeader";

export default function MentionsLegalesPage() {
  return (
    <>
      <CmsPageHeader
        pageId="mentions-legales"
        defaultTitle="Mentions légales"
        defaultDescription="Informations légales relatives au site gaspe.fr"
        breadcrumbs={[{ label: "Mentions légales" }]}
      />

      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="space-y-12">
          {/* Éditeur */}
          <div className="rounded-2xl border border-[var(--gaspe-neutral-200)] bg-white p-6 sm:p-8">
            <h2 className="font-heading text-2xl font-bold text-[var(--gaspe-neutral-900)] mb-4">
              Gestion éditoriale
            </h2>
            <div className="space-y-2 text-[var(--gaspe-neutral-900)]/80 leading-relaxed">
              <p className="font-semibold">
                GASPE &mdash; Groupement des Armateurs de Services Publics Maritimes de
                Passages d&apos;Eau
              </p>
              <p>Association loi 1901</p>
              <p>
                Maison de la Mer &mdash; Daniel Gilard
                <br />
                Quai de la Fosse
                <br />
                44 000 Nantes
              </p>
              <p>
                Email&nbsp;:{" "}
                <a
                  href="mailto:contact@gaspe.fr"
                  className="text-[var(--gaspe-teal-600)] hover:text-[var(--gaspe-teal-700)] underline transition-colors"
                >
                  contact@gaspe.fr
                </a>
              </p>
              <p>
                Site web&nbsp;:{" "}
                <a
                  href="https://www.gaspe.fr"
                  className="text-[var(--gaspe-teal-600)] hover:text-[var(--gaspe-teal-700)] underline transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  www.gaspe.fr
                </a>
              </p>
            </div>
          </div>

          {/* Directeur de la publication */}
          <div className="rounded-2xl border border-[var(--gaspe-neutral-200)] bg-white p-6 sm:p-8">
            <h2 className="font-heading text-2xl font-bold text-[var(--gaspe-neutral-900)] mb-4">
              Directeur de la publication
            </h2>
            <p className="text-[var(--gaspe-neutral-900)]/80 leading-relaxed">
              Baudouin PAPPENS, Président du GASPE
            </p>
          </div>

          {/* Hébergement */}
          <div className="rounded-2xl border border-[var(--gaspe-neutral-200)] bg-white p-6 sm:p-8">
            <h2 className="font-heading text-2xl font-bold text-[var(--gaspe-neutral-900)] mb-4">
              Hébergement
            </h2>
            <div className="space-y-2 text-[var(--gaspe-neutral-900)]/80 leading-relaxed">
              <p className="font-semibold">Cloudflare, Inc.</p>
              <p>
                101 Townsend Street
                <br />
                San Francisco, CA 94107
                <br />
                États-Unis
              </p>
              <p>
                Site web&nbsp;:{" "}
                <a
                  href="https://www.cloudflare.com"
                  className="text-[var(--gaspe-teal-600)] hover:text-[var(--gaspe-teal-700)] underline transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  www.cloudflare.com
                </a>
              </p>
            </div>
          </div>

          {/* Propriété intellectuelle */}
          <div className="rounded-2xl border border-[var(--gaspe-neutral-200)] bg-white p-6 sm:p-8">
            <h2 className="font-heading text-2xl font-bold text-[var(--gaspe-neutral-900)] mb-4">
              Propriété intellectuelle
            </h2>
            <div className="space-y-4 text-[var(--gaspe-neutral-900)]/80 leading-relaxed">
              <p>
                L&apos;ensemble des contenus (photos, textes, vidéos, sons, etc.) disponibles
                sur ce site restent la propriété exclusive du GASPE et/ou de ses partenaires,
                et sont protégés par la législation française sur le droit d&apos;auteur et la
                propriété intellectuelle. Tous les droits de reproduction sont réservés, y
                compris pour les documents téléchargeables et les illustrations et
                photographies.
              </p>
              <p>
                Il est interdit d&apos;extraire et/ou de reproduire une partie substantielle
                des informations publiées sur le site sans l&apos;accord préalable du GASPE.
              </p>
              <p>
                Toute tentative en ce sens constitue une contrefaçon sanctionnée par les
                articles L.335-2 et suivants du Code de la propriété intellectuelle.
              </p>
              <p>
                Le Code de la propriété intellectuelle stipule qu&apos;il est nécessaire de
                citer la source de l&apos;information ou de demander l&apos;autorisation de
                l&apos;auteur des images. Les images (y compris les captures d&apos;écran) sont
                protégées par le droit d&apos;auteur (article L.112-2-9 du Code de la propriété
                intellectuelle).
              </p>
              <p>
                La reproduction ou la représentation d&apos;images, de textes ou de documents
                sans autorisation est punie par le droit civil d&apos;une condamnation à des
                dommages-intérêts. Il est également interdit d&apos;utiliser des captures
                d&apos;écran à des fins commerciales ou publicitaires.
              </p>
            </div>
          </div>

          {/* Limitation de responsabilité */}
          <div className="rounded-2xl border border-[var(--gaspe-neutral-200)] bg-white p-6 sm:p-8">
            <h2 className="font-heading text-2xl font-bold text-[var(--gaspe-neutral-900)] mb-4">
              Limitation de responsabilité
            </h2>
            <div className="space-y-4 text-[var(--gaspe-neutral-900)]/80 leading-relaxed">
              <p>
                Les informations publiées sur ce site sont la propriété du GASPE. Ces
                informations ne peuvent être reproduites, en tout ou en partie, sans le
                consentement du GASPE. L&apos;utilisateur est responsable des recherches
                qu&apos;il effectue ainsi que de l&apos;interprétation et de l&apos;utilisation
                qu&apos;il fait des résultats.
              </p>
              <p>
                Il leur appartient d&apos;utiliser les informations conformément à la
                réglementation en vigueur et aux recommandations de la CNIL lorsque les données
                concernées sont à caractère personnel.
              </p>
              <p>
                Le GASPE s&apos;efforce d&apos;assurer l&apos;exactitude et la mise à jour des
                informations diffusées sur ce site, dont il se réserve le droit de corriger le
                contenu à tout moment et sans préavis. Toutefois, le GASPE ne peut garantir
                l&apos;exactitude, la précision ou l&apos;exhaustivité des informations mises à
                disposition sur ce site.
              </p>
              <p>
                En conséquence, l&apos;utilisateur reconnaît utiliser ces informations sous sa
                responsabilité exclusive.
              </p>
            </div>
          </div>

          {/* Liens hypertextes */}
          <div className="rounded-2xl border border-[var(--gaspe-neutral-200)] bg-white p-6 sm:p-8">
            <h2 className="font-heading text-2xl font-bold text-[var(--gaspe-neutral-900)] mb-4">
              Liens hypertextes
            </h2>
            <div className="space-y-4 text-[var(--gaspe-neutral-900)]/80 leading-relaxed">
              <p>
                Tout tiers souhaitant créer des liens hypertextes vers des pages ou des
                documents disponibles sur ce site, qui pourraient en fait constituer une
                violation du droit d&apos;auteur, un acte de parasitisme ou de diffamation, doit
                préalablement obtenir l&apos;autorisation du GASPE. Les demandes
                d&apos;autorisation peuvent être adressées directement à l&apos;administrateur du
                site à l&apos;adresse{" "}
                <a
                  href="mailto:contact@gaspe.fr"
                  className="text-[var(--gaspe-teal-600)] hover:text-[var(--gaspe-teal-700)] underline transition-colors"
                >
                  contact@gaspe.fr
                </a>
                .
              </p>
              <p>
                Cette autorisation sera accordée dans la mesure où les liens ne portent pas
                atteinte aux intérêts du GASPE, et dans la mesure où ils garantissent que
                l&apos;utilisateur pourra identifier le document comme provenant du GASPE,
                notamment en cas d&apos;utilisation de liens profonds, de framing ou
                d&apos;insertion par liens.
              </p>
            </div>
          </div>

          {/* Données personnelles */}
          <div className="rounded-2xl border border-[var(--gaspe-neutral-200)] bg-white p-6 sm:p-8">
            <h2 className="font-heading text-2xl font-bold text-[var(--gaspe-neutral-900)] mb-4">
              Données personnelles
            </h2>
            <div className="space-y-4 text-[var(--gaspe-neutral-900)]/80 leading-relaxed">
              <p>
                Conformément au Règlement Général sur la Protection des Données (RGPD &mdash;
                Règlement UE 2016/679) et à la loi Informatique et Libertés du 6 janvier 1978
                modifiée, vous disposez d&apos;un droit d&apos;accès, de rectification, de
                suppression et d&apos;opposition aux données personnelles vous concernant.
              </p>
              <p>
                Pour en savoir plus sur la gestion de vos données personnelles, consultez notre{" "}
                <Link
                  href="/confidentialite"
                  className="text-[var(--gaspe-teal-600)] hover:text-[var(--gaspe-teal-700)] underline transition-colors"
                >
                  Politique de confidentialité
                </Link>
                .
              </p>
            </div>
          </div>

          {/* Droit applicable */}
          <div className="rounded-2xl border border-[var(--gaspe-neutral-200)] bg-white p-6 sm:p-8">
            <h2 className="font-heading text-2xl font-bold text-[var(--gaspe-neutral-900)] mb-4">
              Droit applicable
            </h2>
            <p className="text-[var(--gaspe-neutral-900)]/80 leading-relaxed">
              Les présentes conditions sont régies par le droit français. Les juridictions
              françaises sont seules compétentes pour connaître de tout litige se rapportant
              directement ou indirectement à l&apos;accès au présent site ou à son utilisation.
            </p>
          </div>

          {/* Crédits */}
          <div className="rounded-2xl border border-[var(--gaspe-neutral-200)] bg-white p-6 sm:p-8">
            <h2 className="font-heading text-2xl font-bold text-[var(--gaspe-neutral-900)] mb-4">
              Crédits
            </h2>
            <div className="space-y-2 text-[var(--gaspe-neutral-900)]/80 leading-relaxed">
              <p>Crédits photos&nbsp;: GASPE, Unsplash</p>
              <p>
                Conception et développement&nbsp;: site réalisé avec Next.js, hébergé sur
                Cloudflare Pages.
              </p>
            </div>
          </div>

          {/* Date de mise à jour */}
          <p className="text-center text-sm text-[var(--gaspe-neutral-900)]/50">
            Dernière mise à jour&nbsp;: mars 2026
          </p>
        </div>
      </section>
    </>
  );
}
