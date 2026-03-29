"use client";

import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";

export default function CGUPage() {
  return (
    <>
      <PageHeader
        title="Conditions générales d'utilisation"
        description="Règles d'utilisation du site gaspe.fr et de ses services"
        breadcrumbs={[{ label: "Conditions générales d'utilisation" }]}
      />

      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="space-y-12">
          {/* Objet */}
          <div className="rounded-2xl border border-[var(--gaspe-neutral-200)] bg-white p-6 sm:p-8">
            <h2 className="font-heading text-2xl font-bold text-[var(--gaspe-neutral-900)] mb-4">
              Article 1 &mdash; Objet
            </h2>
            <div className="space-y-4 text-[var(--gaspe-neutral-900)]/80 leading-relaxed">
              <p>
                Les présentes Conditions Générales d&apos;Utilisation (ci-après
                &laquo;&nbsp;CGU&nbsp;&raquo;) ont pour objet de définir les modalités et
                conditions d&apos;utilisation du site internet{" "}
                <a
                  href="https://www.gaspe.fr"
                  className="text-[var(--gaspe-teal-600)] hover:text-[var(--gaspe-teal-700)] underline transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  gaspe.fr
                </a>{" "}
                (ci-après &laquo;&nbsp;le Site&nbsp;&raquo;), édité par le GASPE (Groupement
                des Armateurs de Services Publics Maritimes de Passages d&apos;Eau),
                association loi 1901.
              </p>
              <p>
                L&apos;accès au Site et son utilisation impliquent l&apos;acceptation pleine et
                entière des présentes CGU. Si vous n&apos;acceptez pas ces conditions, vous
                êtes invité à ne pas utiliser le Site.
              </p>
            </div>
          </div>

          {/* Accès au site */}
          <div className="rounded-2xl border border-[var(--gaspe-neutral-200)] bg-white p-6 sm:p-8">
            <h2 className="font-heading text-2xl font-bold text-[var(--gaspe-neutral-900)] mb-4">
              Article 2 &mdash; Accès au site
            </h2>
            <div className="space-y-4 text-[var(--gaspe-neutral-900)]/80 leading-relaxed">
              <p>
                Le Site est accessible gratuitement à tout utilisateur disposant d&apos;un
                accès à internet. Tous les frais liés à l&apos;accès au Site (matériel
                informatique, connexion internet, etc.) sont à la charge de l&apos;utilisateur.
              </p>
              <p>
                Le GASPE met tout en &oelig;uvre pour assurer la disponibilité du Site 24h/24
                et 7j/7. Toutefois, il ne saurait être tenu responsable en cas
                d&apos;indisponibilité du Site, pour quelque cause que ce soit (maintenance,
                panne, force majeure, etc.).
              </p>
              <p>
                Le GASPE se réserve le droit de suspendre, modifier ou interrompre
                temporairement ou définitivement l&apos;accès à tout ou partie du Site, sans
                préavis et sans obligation d&apos;indemnisation.
              </p>
            </div>
          </div>

          {/* Comptes utilisateurs */}
          <div className="rounded-2xl border border-[var(--gaspe-neutral-200)] bg-white p-6 sm:p-8">
            <h2 className="font-heading text-2xl font-bold text-[var(--gaspe-neutral-900)] mb-4">
              Article 3 &mdash; Comptes utilisateurs
            </h2>
            <div className="space-y-4 text-[var(--gaspe-neutral-900)]/80 leading-relaxed">
              <p>
                Certaines fonctionnalités du Site nécessitent la création d&apos;un compte
                utilisateur. Deux types de comptes sont disponibles&nbsp;:
              </p>

              <div>
                <h3 className="font-heading text-lg font-semibold text-[var(--gaspe-neutral-900)] mb-2">
                  Compte Adhérent
                </h3>
                <p>
                  Réservé aux compagnies membres du GASPE. L&apos;inscription est soumise à
                  validation par l&apos;administrateur du Site. Le compte adhérent donne accès à
                  l&apos;espace adhérent (offres d&apos;emploi, documents, formations,
                  annuaire).
                </p>
              </div>

              <div>
                <h3 className="font-heading text-lg font-semibold text-[var(--gaspe-neutral-900)] mb-2">
                  Compte Candidat
                </h3>
                <p>
                  Ouvert à toute personne souhaitant postuler aux offres d&apos;emploi
                  publiées sur le Site. La création du compte est automatique après validation
                  du formulaire d&apos;inscription.
                </p>
              </div>

              <p>
                L&apos;utilisateur s&apos;engage à fournir des informations exactes et à jour
                lors de son inscription. Il est seul responsable de la confidentialité de ses
                identifiants de connexion et de toute activité réalisée depuis son compte.
              </p>
              <p>
                En cas d&apos;utilisation non autorisée de votre compte, vous devez en informer
                immédiatement le GASPE à l&apos;adresse{" "}
                <a
                  href="mailto:contact@gaspe.fr"
                  className="text-[var(--gaspe-teal-600)] hover:text-[var(--gaspe-teal-700)] underline transition-colors"
                >
                  contact@gaspe.fr
                </a>
                .
              </p>
              <p>
                Le GASPE se réserve le droit de suspendre ou supprimer un compte utilisateur en
                cas de non-respect des présentes CGU ou de comportement contraire aux bonnes
                m&oelig;urs.
              </p>
            </div>
          </div>

          {/* Propriété intellectuelle */}
          <div className="rounded-2xl border border-[var(--gaspe-neutral-200)] bg-white p-6 sm:p-8">
            <h2 className="font-heading text-2xl font-bold text-[var(--gaspe-neutral-900)] mb-4">
              Article 4 &mdash; Propriété intellectuelle
            </h2>
            <div className="space-y-4 text-[var(--gaspe-neutral-900)]/80 leading-relaxed">
              <p>
                L&apos;ensemble des éléments constituant le Site (textes, graphiques, images,
                vidéos, logos, icônes, sons, logiciels, base de données, structure, etc.) est
                la propriété exclusive du GASPE ou de ses partenaires, et est protégé par les
                lois françaises et internationales relatives à la propriété intellectuelle.
              </p>
              <p>
                Toute reproduction, représentation, modification, publication, transmission ou
                dénaturation, totale ou partielle, du Site ou de son contenu, par quelque
                procédé que ce soit, et sur quelque support que ce soit, est interdite sans
                l&apos;autorisation écrite préalable du GASPE.
              </p>
              <p>
                Toute exploitation non autorisée du Site ou de son contenu est constitutive de
                contrefaçon et sanctionnée par les articles L.335-2 et suivants du Code de la
                propriété intellectuelle.
              </p>
            </div>
          </div>

          {/* Contenus utilisateurs */}
          <div className="rounded-2xl border border-[var(--gaspe-neutral-200)] bg-white p-6 sm:p-8">
            <h2 className="font-heading text-2xl font-bold text-[var(--gaspe-neutral-900)] mb-4">
              Article 5 &mdash; Contenus publiés par les utilisateurs
            </h2>
            <div className="space-y-4 text-[var(--gaspe-neutral-900)]/80 leading-relaxed">
              <p>
                Les utilisateurs disposant d&apos;un compte adhérent peuvent publier des offres
                d&apos;emploi et des contenus via les espaces dédiés. En publiant du contenu
                sur le Site, l&apos;utilisateur garantit&nbsp;:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  Qu&apos;il dispose des droits nécessaires pour publier ce contenu.
                </li>
                <li>
                  Que le contenu ne porte pas atteinte aux droits de tiers (propriété
                  intellectuelle, vie privée, image, etc.).
                </li>
                <li>
                  Que le contenu n&apos;est pas contraire à l&apos;ordre public, aux bonnes
                  m&oelig;urs ou à la législation en vigueur.
                </li>
                <li>
                  Que les offres d&apos;emploi publiées sont conformes au droit du travail
                  français et à la Convention Collective Nationale des personnels navigants des
                  entreprises de transport et services maritimes (CCN 3228).
                </li>
              </ul>
              <p>
                Le GASPE se réserve le droit de supprimer tout contenu qu&apos;il jugerait
                inapproprié, sans préavis ni indemnité.
              </p>
            </div>
          </div>

          {/* Plateforme de recrutement */}
          <div className="rounded-2xl border border-[var(--gaspe-neutral-200)] bg-white p-6 sm:p-8">
            <h2 className="font-heading text-2xl font-bold text-[var(--gaspe-neutral-900)] mb-4">
              Article 6 &mdash; Plateforme de recrutement
            </h2>
            <div className="space-y-4 text-[var(--gaspe-neutral-900)]/80 leading-relaxed">
              <p>
                Le Site propose une plateforme de mise en relation entre les compagnies
                adhérentes du GASPE (offrant des postes) et les candidats (recherchant un
                emploi dans le secteur maritime).
              </p>
              <p>
                Le GASPE agit en qualité d&apos;intermédiaire et ne saurait être tenu
                responsable&nbsp;:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Du contenu des offres d&apos;emploi publiées par les adhérents.</li>
                <li>De l&apos;exactitude des informations fournies par les candidats.</li>
                <li>
                  De l&apos;issue des processus de recrutement entre adhérents et candidats.
                </li>
                <li>
                  Des éventuels litiges survenant entre les parties dans le cadre d&apos;un
                  recrutement.
                </li>
              </ul>
            </div>
          </div>

          {/* Responsabilité */}
          <div className="rounded-2xl border border-[var(--gaspe-neutral-200)] bg-white p-6 sm:p-8">
            <h2 className="font-heading text-2xl font-bold text-[var(--gaspe-neutral-900)] mb-4">
              Article 7 &mdash; Responsabilité
            </h2>
            <div className="space-y-4 text-[var(--gaspe-neutral-900)]/80 leading-relaxed">
              <p>
                Le GASPE s&apos;efforce d&apos;assurer l&apos;exactitude et la mise à jour des
                informations diffusées sur le Site. Toutefois, il ne garantit pas
                l&apos;exactitude, la précision ou l&apos;exhaustivité des informations mises à
                disposition.
              </p>
              <p>
                Le GASPE ne saurait être tenu responsable&nbsp;:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  Des dommages directs ou indirects résultant de l&apos;accès au Site ou de
                  l&apos;impossibilité d&apos;y accéder.
                </li>
                <li>
                  Des dommages résultant de l&apos;utilisation du Site ou de
                  l&apos;impossibilité d&apos;utiliser les informations qu&apos;il contient.
                </li>
                <li>
                  Du contenu des sites tiers vers lesquels le Site comporte des liens
                  hypertextes.
                </li>
                <li>
                  De tout virus ou programme malveillant qui pourrait infecter
                  l&apos;équipement informatique de l&apos;utilisateur suite à une utilisation
                  du Site.
                </li>
              </ul>
              <p>
                L&apos;utilisateur est seul responsable de l&apos;utilisation qu&apos;il fait
                du Site et des informations qui y sont publiées.
              </p>
            </div>
          </div>

          {/* Liens externes */}
          <div className="rounded-2xl border border-[var(--gaspe-neutral-200)] bg-white p-6 sm:p-8">
            <h2 className="font-heading text-2xl font-bold text-[var(--gaspe-neutral-900)] mb-4">
              Article 8 &mdash; Liens hypertextes
            </h2>
            <div className="space-y-4 text-[var(--gaspe-neutral-900)]/80 leading-relaxed">
              <p>
                Le Site peut contenir des liens hypertextes vers d&apos;autres sites internet.
                Le GASPE n&apos;exerce aucun contrôle sur le contenu de ces sites tiers et
                décline toute responsabilité quant à leur contenu ou aux pratiques de
                confidentialité qu&apos;ils appliquent.
              </p>
              <p>
                La création de liens hypertextes vers le Site est soumise à
                l&apos;autorisation préalable du GASPE. Toute demande peut être adressée à{" "}
                <a
                  href="mailto:contact@gaspe.fr"
                  className="text-[var(--gaspe-teal-600)] hover:text-[var(--gaspe-teal-700)] underline transition-colors"
                >
                  contact@gaspe.fr
                </a>
                .
              </p>
            </div>
          </div>

          {/* Données personnelles */}
          <div className="rounded-2xl border border-[var(--gaspe-neutral-200)] bg-white p-6 sm:p-8">
            <h2 className="font-heading text-2xl font-bold text-[var(--gaspe-neutral-900)] mb-4">
              Article 9 &mdash; Données personnelles
            </h2>
            <div className="space-y-4 text-[var(--gaspe-neutral-900)]/80 leading-relaxed">
              <p>
                L&apos;utilisation du Site est susceptible d&apos;entraîner le traitement de
                données à caractère personnel. Pour connaître les modalités de collecte, de
                traitement et de protection de vos données, veuillez consulter notre{" "}
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

          {/* Modification des CGU */}
          <div className="rounded-2xl border border-[var(--gaspe-neutral-200)] bg-white p-6 sm:p-8">
            <h2 className="font-heading text-2xl font-bold text-[var(--gaspe-neutral-900)] mb-4">
              Article 10 &mdash; Modification des CGU
            </h2>
            <div className="space-y-4 text-[var(--gaspe-neutral-900)]/80 leading-relaxed">
              <p>
                Le GASPE se réserve le droit de modifier les présentes CGU à tout moment. Les
                modifications entrent en vigueur dès leur publication sur le Site.
              </p>
              <p>
                L&apos;utilisation du Site après la publication de CGU modifiées vaut
                acceptation des nouvelles conditions. Il est recommandé de consulter
                régulièrement cette page.
              </p>
            </div>
          </div>

          {/* Droit applicable */}
          <div className="rounded-2xl border border-[var(--gaspe-neutral-200)] bg-white p-6 sm:p-8">
            <h2 className="font-heading text-2xl font-bold text-[var(--gaspe-neutral-900)] mb-4">
              Article 11 &mdash; Droit applicable et juridiction compétente
            </h2>
            <div className="space-y-4 text-[var(--gaspe-neutral-900)]/80 leading-relaxed">
              <p>
                Les présentes CGU sont régies par le droit français. Tout litige relatif à
                l&apos;interprétation ou à l&apos;exécution des présentes CGU sera soumis aux
                juridictions compétentes de Nantes, sauf disposition légale contraire.
              </p>
              <p>
                En cas de litige, les parties s&apos;engagent à rechercher une solution
                amiable avant toute action judiciaire. Conformément à l&apos;article L.612-1 du
                Code de la consommation, l&apos;utilisateur peut recourir gratuitement au
                service de médiation de la consommation.
              </p>
            </div>
          </div>

          {/* Liens vers les autres pages légales */}
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link
              href="/mentions-legales"
              className="text-[var(--gaspe-teal-600)] hover:text-[var(--gaspe-teal-700)] underline transition-colors"
            >
              Mentions légales
            </Link>
            <span className="text-[var(--gaspe-neutral-900)]/30">|</span>
            <Link
              href="/confidentialite"
              className="text-[var(--gaspe-teal-600)] hover:text-[var(--gaspe-teal-700)] underline transition-colors"
            >
              Politique de confidentialité
            </Link>
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
