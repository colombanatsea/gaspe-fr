import { PageHeader } from "@/components/shared/PageHeader";

export default function ConfidentialitePage() {
  return (
    <>
      <PageHeader
        title="Politique de confidentialité"
        description="Protection de vos données personnelles conformément au RGPD."
        breadcrumbs={[{ label: "Confidentialité" }]}
      />
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="prose prose-headings:font-heading prose-headings:text-foreground prose-p:text-foreground-muted max-w-none space-y-8">
          <section>
            <h2>Responsable du traitement</h2>
            <p>
              Le GASPE (Groupement des Armateurs de Services Publics Maritimes de Passages d&apos;Eau),
              association loi 1901, est responsable du traitement des données personnelles collectées sur ce site.
            </p>
            <p>Contact DPO : <a href="mailto:contact@gaspe.fr" className="text-[var(--gaspe-teal-600)]">contact@gaspe.fr</a></p>
          </section>

          <section>
            <h2>Données collectées</h2>
            <p>Nous collectons les données suivantes dans le cadre de l&apos;utilisation du site :</p>
            <ul>
              <li><strong>Formulaire de contact :</strong> nom, email, société, sujet, message</li>
              <li><strong>Inscription candidat :</strong> nom, email, téléphone, poste actuel, poste recherché, certifications, CV</li>
              <li><strong>Inscription adhérent :</strong> nom, email, téléphone, société</li>
              <li><strong>Newsletter :</strong> adresse email</li>
            </ul>
          </section>

          <section>
            <h2>Finalités du traitement</h2>
            <ul>
              <li>Gestion des candidatures et mise en relation avec les compagnies adhérentes</li>
              <li>Gestion des comptes adhérents et accès aux services réservés</li>
              <li>Réponse aux demandes de contact</li>
              <li>Envoi de la newsletter (avec consentement)</li>
              <li>Statistiques de fréquentation anonymisées (Cloudflare Web Analytics)</li>
            </ul>
          </section>

          <section>
            <h2>Base légale</h2>
            <p>
              Le traitement est fondé sur le consentement de l&apos;utilisateur (article 6.1.a du RGPD)
              et l&apos;exécution de mesures précontractuelles (article 6.1.b) pour les candidatures et inscriptions.
            </p>
          </section>

          <section>
            <h2>Durée de conservation</h2>
            <ul>
              <li><strong>Données de candidature :</strong> 24 mois après la dernière connexion</li>
              <li><strong>Données adhérent :</strong> durée de l&apos;adhésion + 12 mois</li>
              <li><strong>Messages de contact :</strong> 12 mois</li>
              <li><strong>Newsletter :</strong> jusqu&apos;au désabonnement</li>
            </ul>
          </section>

          <section>
            <h2>Stockage des données</h2>
            <p>
              Les données sont actuellement stockées localement dans votre navigateur (localStorage).
              Aucune donnée personnelle n&apos;est transmise à des serveurs tiers sans votre consentement.
              Lors du déploiement de l&apos;API backend, les données seront stockées sur des serveurs
              Cloudflare situés en Union Européenne (Frankfurt).
            </p>
          </section>

          <section>
            <h2>Vos droits</h2>
            <p>Conformément au RGPD, vous disposez des droits suivants :</p>
            <ul>
              <li><strong>Droit d&apos;accès</strong> — obtenir une copie de vos données</li>
              <li><strong>Droit de rectification</strong> — corriger vos données inexactes</li>
              <li><strong>Droit à l&apos;effacement</strong> — demander la suppression de vos données</li>
              <li><strong>Droit à la portabilité</strong> — recevoir vos données dans un format structuré</li>
              <li><strong>Droit d&apos;opposition</strong> — vous opposer au traitement de vos données</li>
              <li><strong>Droit de retrait du consentement</strong> — retirer votre consentement à tout moment</li>
            </ul>
            <p>
              Pour exercer ces droits, contactez-nous à{" "}
              <a href="mailto:contact@gaspe.fr" className="text-[var(--gaspe-teal-600)]">contact@gaspe.fr</a>.
              Vous pouvez également introduire une réclamation auprès de la CNIL.
            </p>
          </section>

          <section>
            <h2>Cookies et traceurs</h2>
            <p>
              Ce site utilise Cloudflare Web Analytics, un outil de mesure d&apos;audience qui ne dépose aucun cookie
              et ne collecte aucune donnée personnelle. Il est activé uniquement avec votre consentement
              via le bandeau cookie.
            </p>
            <p>
              Un cookie fonctionnel (<code>gaspe_cookie_consent</code>) est utilisé pour mémoriser votre choix
              d&apos;acceptation ou de refus des cookies analytiques.
            </p>
          </section>

          <section>
            <h2>Mise à jour</h2>
            <p>
              Cette politique de confidentialité peut être modifiée à tout moment.
              Dernière mise à jour : mars 2026.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
