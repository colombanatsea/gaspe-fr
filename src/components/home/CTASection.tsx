import { Button } from "@/components/ui/Button";

export function CTASection() {
  return (
    <section className="gaspe-gradient py-16">
      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="font-heading text-3xl font-bold text-white sm:text-4xl">
          Rejoignez le service public maritime
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-white/90">
          Nos compagnies recrutent des profils variés : officiers, matelots,
          mécaniciens, personnels à terre.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Button
            href="/nos-compagnies-recrutent"
            className="bg-white text-[var(--gaspe-teal-700)] hover:bg-white/90"
          >
            Voir les offres d&apos;emploi
          </Button>
          <Button
            href="/contact"
            variant="secondary"
            className="border-white text-white hover:bg-white/10"
          >
            Nous contacter
          </Button>
        </div>
      </div>
    </section>
  );
}
