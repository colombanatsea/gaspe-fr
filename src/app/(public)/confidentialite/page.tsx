"use client";

import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";

export default function ConfidentialitePage() {
  return (
    <>
      <PageHeader
        title="Politique de confidentialité"
        description="Comment nous protégeons vos données personnelles"
        breadcrumbs={[{ label: "Politique de confidentialité" }]}
      />

      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="space-y-12">
          {/* Introduction */}
          <div className="rounded-2xl border border-[var(--gaspe-neutral-200)] bg-white p-6 sm:p-8">
            <h2 className="font-heading text-2xl font-bold text-[var(--gaspe-neutral-900)] mb-4">
              Introduction
            </h2>
            <div className="space-y-4 text-[var(--gaspe-neutral-900)]/80 leading-relaxed">
              <p>
                Le GASPE (Groupement des Armateurs de Services Publics Maritimes de Passages
                d&apos;Eau), association loi 1901, s&apos;engage à protéger la vie privée des
                utilisateurs de son site internet{" "}
                <a
                  href="https://www.gaspe.fr"
                  className="text-[var(--gaspe-teal-600)] hover:text-[var(--gaspe-teal-700)] underline transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  gaspe.fr
                </a>{" "}
                (ci-après &laquo;&nbsp;le Site&nbsp;&raquo;).
              </p>
              <p>
                La présente politique de confidentialité a pour objet de vous informer sur la
                manière dont nous collectons, utilisons et protégeons vos données personnelles,
                conformément au Règlement Général sur la Protection des Données (RGPD &mdash;
                Règlement UE 2016/679) et à la loi Informatique et Libertés du 6 janvier 1978
                modifiée.
              </p>
            </div>
          </div>

          {/* Responsable du traitement */}
          <div className="rounded-2xl border border-[var(--gaspe-neutral-200)] bg-white p-6 sm:p-8">
            <h2 className="font-heading text-2xl font-bold text-[var(--gaspe-neutral-900)] mb-4">
              Responsable du traitement
            </h2>
            <div className="space-y-2 text-[var(--gaspe-neutral-900)]/80 leading-relaxed">
              <p>Le responsable du traitement des données est&nbsp;:</p>
              <p className="font-semibold">
                GASPE &mdash; Groupement des Armateurs de Services Publics Maritimes de
                Passages d&apos;Eau
              </p>
              <p>
                Maison de la Mer &mdash; Daniel Gilard
                <br />
                Quai de la Fosse
                <br />
                44 000 Nantes
              </p>
              <p>
                Contact&nbsp;:{" "}
                <a
                  href="mailto:contact@gaspe.fr"
                  className="text-[var(--gaspe-teal-600)] hover:text-[var(--gaspe-teal-700)] underline transition-colors"
                >
                  contact@gaspe.fr
                </a>
              </p>
            </div>
          </div>

          {/* Données collectées */}
          <div className="rounded-2xl border border-[var(--gaspe-neutral-200)] bg-white p-6 sm:p-8">
            <h2 className="font-heading text-2xl font-bold text-[var(--gaspe-neutral-900)] mb-4">
              Données collectées
            </h2>
            <div className="space-y-4 text-[var(--gaspe-neutral-900)]/80 leading-relaxed">
              <p>
                Dans le cadre de l&apos;utilisation du Site, nous sommes susceptibles de
                collecter les catégories de données suivantes&nbsp;:
              </p>

              <div>
                <h3 className="font-heading text-lg font-semibold text-[var(--gaspe-neutral-900)] mb-2">
                  Formulaire de contact
                </h3>
                <p>
                  Nom, adresse email, société (optionnel), sujet et contenu du message. Ces
                  données sont nécessaires pour traiter votre demande et vous répondre.
                </p>
              </div>

              <div>
                <h3 className="font-heading text-lg font-semibold text-[var(--gaspe-neutral-900)] mb-2">
                  Inscription newsletter
                </h3>
                <p>
                  Adresse email. Cette donnée est utilisée uniquement pour l&apos;envoi
                  d&apos;informations relatives aux activités du GASPE.
                </p>
              </div>

              <div>
                <h3 className="font-heading text-lg font-semibold text-[var(--gaspe-neutral-900)] mb-2">
                  Création de compte (adhérent ou candidat)
                </h3>
                <p>
                  Nom, prénom, adresse email, mot de passe (chiffré), informations
                  professionnelles selon le type de compte. Ces données sont stockées
                  localement dans votre navigateur (localStorage) et ne sont pas transmises à
                  des serveurs tiers.
                </p>
              </div>

              <div>
                <h3 className="font-heading text-lg font-semibold text-[var(--gaspe-neutral-900)] mb-2">
                  Candidatures (espace candidat)
                </h3>
                <p>
                  Informations de profil, CV (nom de fichier), historique de candidatures.
                  Ces données sont stockées localement dans votre navigateur.
                </p>
              </div>
            </div>
          </div>

          {/* Base légale */}
          <div className="rounded-2xl border border-[var(--gaspe-neutral-200)] bg-white p-6 sm:p-8">
            <h2 className="font-heading text-2xl font-bold text-[var(--gaspe-neutral-900)] mb-4">
              Base légale des traitements
            </h2>
            <div className="space-y-4 text-[var(--gaspe-neutral-900)]/80 leading-relaxed">
              <p>
                Les traitements de données personnelles mis en &oelig;uvre sur le Site reposent
                sur les bases légales suivantes&nbsp;:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Consentement</strong> (article 6.1.a du RGPD)&nbsp;: inscription à la
                  newsletter, dépôt de cookies analytiques.
                </li>
                <li>
                  <strong>Exécution de mesures précontractuelles</strong> (article 6.1.b du
                  RGPD)&nbsp;: création de compte, candidatures aux offres d&apos;emploi.
                </li>
                <li>
                  <strong>Intérêt légitime</strong> (article 6.1.f du RGPD)&nbsp;: traitement
                  des demandes de contact, amélioration du Site.
                </li>
              </ul>
            </div>
          </div>

          {/* Cookies et traceurs */}
          <div className="rounded-2xl border border-[var(--gaspe-neutral-200)] bg-white p-6 sm:p-8">
            <h2 className="font-heading text-2xl font-bold text-[var(--gaspe-neutral-900)] mb-4">
              Cookies et traceurs
            </h2>
            <div className="space-y-4 text-[var(--gaspe-neutral-900)]/80 leading-relaxed">
              <p>
                Le Site utilise le stockage local du navigateur (localStorage) pour le
                fonctionnement des comptes utilisateurs et la persistance de certaines
                préférences. Le localStorage n&apos;est pas un cookie et n&apos;est pas
                transmis aux serveurs lors des requêtes HTTP.
              </p>

              <div>
                <h3 className="font-heading text-lg font-semibold text-[var(--gaspe-neutral-900)] mb-2">
                  Mesure d&apos;audience
                </h3>
                <p>
                  Nous utilisons Cloudflare Web Analytics pour mesurer l&apos;audience du Site.
                  Cet outil respecte la vie privée&nbsp;: il ne dépose aucun cookie, ne
                  collecte aucune donnée personnelle et ne suit pas les utilisateurs entre les
                  sites. Les données d&apos;audience sont anonymes et agrégées.
                </p>
                <p className="mt-2">
                  L&apos;activation de cette mesure d&apos;audience est soumise à votre
                  consentement via le bandeau cookies affiché lors de votre première visite.
                </p>
              </div>

              <div>
                <h3 className="font-heading text-lg font-semibold text-[var(--gaspe-neutral-900)] mb-2">
                  Données stockées localement
                </h3>
                <p>Les clés localStorage utilisées par le Site concernent&nbsp;:</p>
                <ul className="list-disc pl-6 space-y-1 mt-2">
                  <li>L&apos;authentification et la session utilisateur</li>
                  <li>Les préférences de consentement cookies (RGPD)</li>
                  <li>Les données de formulaires et candidatures</li>
                  <li>Les contenus CMS (offres, formations, documents)</li>
                </ul>
                <p className="mt-2">
                  Ces données restent exclusivement sur votre appareil et peuvent être
                  supprimées à tout moment en vidant le stockage local de votre navigateur.
                </p>
              </div>
            </div>
          </div>

          {/* Durée de conservation */}
          <div className="rounded-2xl border border-[var(--gaspe-neutral-200)] bg-white p-6 sm:p-8">
            <h2 className="font-heading text-2xl font-bold text-[var(--gaspe-neutral-900)] mb-4">
              Durée de conservation
            </h2>
            <div className="space-y-4 text-[var(--gaspe-neutral-900)]/80 leading-relaxed">
              <p>
                Les données personnelles sont conservées pour une durée proportionnée à la
                finalité du traitement&nbsp;:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Formulaire de contact</strong>&nbsp;: les messages sont conservés
                  pendant une durée maximale de 12 mois après le dernier échange.
                </li>
                <li>
                  <strong>Newsletter</strong>&nbsp;: votre adresse email est conservée
                  jusqu&apos;à votre désinscription.
                </li>
                <li>
                  <strong>Comptes utilisateurs</strong>&nbsp;: les données sont conservées
                  pendant la durée d&apos;activité du compte, puis supprimées 12 mois après la
                  dernière connexion en l&apos;absence d&apos;activité.
                </li>
                <li>
                  <strong>Candidatures</strong>&nbsp;: les données sont conservées pendant
                  24 mois maximum conformément aux recommandations de la CNIL.
                </li>
                <li>
                  <strong>Données localStorage</strong>&nbsp;: conservées indéfiniment sur votre
                  appareil jusqu&apos;à suppression manuelle par vos soins.
                </li>
              </ul>
            </div>
          </div>

          {/* Droits des utilisateurs */}
          <div className="rounded-2xl border border-[var(--gaspe-neutral-200)] bg-white p-6 sm:p-8">
            <h2 className="font-heading text-2xl font-bold text-[var(--gaspe-neutral-900)] mb-4">
              Vos droits
            </h2>
            <div className="space-y-4 text-[var(--gaspe-neutral-900)]/80 leading-relaxed">
              <p>
                Conformément au RGPD et à la loi Informatique et Libertés, vous disposez des
                droits suivants concernant vos données personnelles&nbsp;:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Droit d&apos;accès</strong> (article 15 du RGPD)&nbsp;: obtenir la
                  confirmation que des données vous concernant sont traitées et en recevoir une
                  copie.
                </li>
                <li>
                  <strong>Droit de rectification</strong> (article 16 du RGPD)&nbsp;: demander
                  la correction de données inexactes ou incomplètes.
                </li>
                <li>
                  <strong>Droit à l&apos;effacement</strong> (article 17 du RGPD)&nbsp;:
                  demander la suppression de vos données dans les conditions prévues par la
                  réglementation.
                </li>
                <li>
                  <strong>Droit à la limitation du traitement</strong> (article 18 du
                  RGPD)&nbsp;: demander la limitation du traitement de vos données.
                </li>
                <li>
                  <strong>Droit à la portabilité</strong> (article 20 du RGPD)&nbsp;: recevoir
                  vos données dans un format structuré et lisible par machine.
                </li>
                <li>
                  <strong>Droit d&apos;opposition</strong> (article 21 du RGPD)&nbsp;: vous
                  opposer à tout moment au traitement de vos données pour des motifs légitimes.
                </li>
                <li>
                  <strong>Droit de retrait du consentement</strong>&nbsp;: retirer votre
                  consentement à tout moment pour les traitements fondés sur celui-ci, sans
                  remettre en cause la licéité du traitement antérieur.
                </li>
              </ul>
              <p>
                Pour exercer ces droits, vous pouvez nous contacter à l&apos;adresse&nbsp;:{" "}
                <a
                  href="mailto:contact@gaspe.fr"
                  className="text-[var(--gaspe-teal-600)] hover:text-[var(--gaspe-teal-700)] underline transition-colors"
                >
                  contact@gaspe.fr
                </a>
              </p>
              <p>
                Nous nous engageons à répondre à votre demande dans un délai d&apos;un mois
                suivant sa réception.
              </p>
              <p>
                Vous disposez également du droit d&apos;introduire une réclamation auprès de la
                CNIL (Commission Nationale de l&apos;Informatique et des Libertés)&nbsp;:{" "}
                <a
                  href="https://www.cnil.fr"
                  className="text-[var(--gaspe-teal-600)] hover:text-[var(--gaspe-teal-700)] underline transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  www.cnil.fr
                </a>
              </p>
            </div>
          </div>

          {/* Transferts de données */}
          <div className="rounded-2xl border border-[var(--gaspe-neutral-200)] bg-white p-6 sm:p-8">
            <h2 className="font-heading text-2xl font-bold text-[var(--gaspe-neutral-900)] mb-4">
              Transferts de données
            </h2>
            <div className="space-y-4 text-[var(--gaspe-neutral-900)]/80 leading-relaxed">
              <p>
                Le Site est hébergé par Cloudflare, Inc. dont les serveurs peuvent être situés
                en dehors de l&apos;Union européenne. Cloudflare est conforme au Cadre de
                protection des données UE-États-Unis (EU-US Data Privacy Framework) et met en
                &oelig;uvre des clauses contractuelles types approuvées par la Commission
                européenne.
              </p>
              <p>
                Les données stockées en localStorage ne quittent pas votre navigateur et ne
                font l&apos;objet d&apos;aucun transfert international.
              </p>
              <p>
                Vos données personnelles ne sont ni vendues, ni échangées, ni louées à des
                tiers. Elles ne sont communiquées qu&apos;aux seuls destinataires habilités
                dans le cadre des finalités décrites ci-dessus.
              </p>
            </div>
          </div>

          {/* Sécurité */}
          <div className="rounded-2xl border border-[var(--gaspe-neutral-200)] bg-white p-6 sm:p-8">
            <h2 className="font-heading text-2xl font-bold text-[var(--gaspe-neutral-900)] mb-4">
              Sécurité des données
            </h2>
            <div className="space-y-4 text-[var(--gaspe-neutral-900)]/80 leading-relaxed">
              <p>
                Le GASPE met en &oelig;uvre les mesures techniques et organisationnelles
                appropriées pour assurer la sécurité et la confidentialité de vos données
                personnelles, notamment&nbsp;:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Connexion sécurisée via HTTPS (certificat SSL/TLS)</li>
                <li>Protection contre les attaques XSS et injections (sanitisation des entrées)</li>
                <li>Hébergement sur infrastructure Cloudflare (protection DDoS, WAF)</li>
                <li>Limitation des accès aux données aux seules personnes habilitées</li>
              </ul>
            </div>
          </div>

          {/* Contact DPO */}
          <div className="rounded-2xl border border-[var(--gaspe-neutral-200)] bg-white p-6 sm:p-8">
            <h2 className="font-heading text-2xl font-bold text-[var(--gaspe-neutral-900)] mb-4">
              Contact
            </h2>
            <div className="space-y-4 text-[var(--gaspe-neutral-900)]/80 leading-relaxed">
              <p>
                Pour toute question relative à la protection de vos données personnelles ou
                pour exercer vos droits, vous pouvez nous contacter&nbsp;:
              </p>
              <div className="rounded-xl bg-[var(--gaspe-neutral-100)] p-4 space-y-1">
                <p className="font-semibold">GASPE &mdash; Protection des données</p>
                <p>Maison de la Mer &mdash; Daniel Gilard</p>
                <p>Quai de la Fosse, 44 000 Nantes</p>
                <p>
                  Email&nbsp;:{" "}
                  <a
                    href="mailto:contact@gaspe.fr"
                    className="text-[var(--gaspe-teal-600)] hover:text-[var(--gaspe-teal-700)] underline transition-colors"
                  >
                    contact@gaspe.fr
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Modification */}
          <div className="rounded-2xl border border-[var(--gaspe-neutral-200)] bg-white p-6 sm:p-8">
            <h2 className="font-heading text-2xl font-bold text-[var(--gaspe-neutral-900)] mb-4">
              Modification de la politique
            </h2>
            <p className="text-[var(--gaspe-neutral-900)]/80 leading-relaxed">
              Le GASPE se réserve le droit de modifier la présente politique de confidentialité
              à tout moment. Les modifications entrent en vigueur dès leur publication sur le
              Site. Nous vous invitons à consulter régulièrement cette page pour prendre
              connaissance des éventuelles mises à jour.
            </p>
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
              href="/cgu"
              className="text-[var(--gaspe-teal-600)] hover:text-[var(--gaspe-teal-700)] underline transition-colors"
            >
              Conditions générales d&apos;utilisation
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
