import { PageHeader } from "@/components/shared/PageHeader";

export default function MentionsLegalesPage() {
  return (
    <>
      <PageHeader
        title="Mentions légales"
        breadcrumbs={[{ label: "Mentions légales" }]}
      />
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="prose prose-headings:font-heading prose-headings:text-foreground prose-p:text-foreground-muted max-w-none space-y-8">
          <section>
            <h2>Éditeur du site</h2>
            <p>
              <strong>GASPE — Groupement des Armateurs de Services Publics Maritimes de Passages d&apos;Eau</strong><br />
              Association loi 1901<br />
              Siège social : Paris, France<br />
              Email : <a href="mailto:contact@gaspe.fr" className="text-[var(--gaspe-teal-600)]">contact@gaspe.fr</a>
            </p>
          </section>

          <section>
            <h2>Directeur de la publication</h2>
            <p>Le Président du GASPE, en qualité de représentant légal de l&apos;association.</p>
          </section>

          <section>
            <h2>Hébergement</h2>
            <p>
              <strong>Cloudflare, Inc.</strong><br />
              101 Townsend St, San Francisco, CA 94107, États-Unis<br />
              Site : <a href="https://www.cloudflare.com" target="_blank" rel="noopener noreferrer" className="text-[var(--gaspe-teal-600)]">www.cloudflare.com</a>
            </p>
          </section>

          <section>
            <h2>Propriété intellectuelle</h2>
            <p>
              L&apos;ensemble des contenus présents sur le site (textes, images, graphismes, logo, icônes, sons, logiciels)
              est la propriété du GASPE ou de ses partenaires. Toute reproduction, représentation, modification,
              publication ou adaptation de tout ou partie des éléments du site est interdite sans autorisation écrite préalable.
            </p>
          </section>

          <section>
            <h2>Limitation de responsabilité</h2>
            <p>
              Le GASPE s&apos;efforce d&apos;assurer l&apos;exactitude et la mise à jour des informations diffusées sur ce site.
              Toutefois, le GASPE décline toute responsabilité en cas d&apos;erreur, d&apos;inexactitude ou d&apos;omission.
              Les informations présentes sur ce site sont fournies à titre indicatif et sont susceptibles d&apos;évoluer.
            </p>
          </section>

          <section>
            <h2>Liens hypertextes</h2>
            <p>
              Le site peut contenir des liens vers d&apos;autres sites internet. Le GASPE n&apos;exerce aucun contrôle
              sur le contenu de ces sites tiers et décline toute responsabilité quant à leur contenu.
            </p>
          </section>

          <section>
            <h2>Droit applicable</h2>
            <p>
              Les présentes mentions légales sont soumises au droit français. En cas de litige, les tribunaux
              français seront seuls compétents.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
