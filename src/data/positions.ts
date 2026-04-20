/**
 * Prises de parole, tribunes et actualités du GASPE.
 *
 * Rôle : alimenter `/positions` (liste) et `/positions/[slug]` (détail),
 * ainsi que `/positions/feed.xml` (flux RSS) et le `sitemap.xml`.
 *
 * Pour ajouter un nouvel article :
 *   1. Créer une entrée ci-dessous avec un `slug` unique (kebab-case).
 *   2. Renseigner `body` (HTML simple : <p>, <h3>, <ul>, <strong>, <a>).
 *   3. `datePublished` au format ISO (YYYY-MM-DD) — sert au tri + JSON-LD + sitemap.
 *   4. Le `sortKey` reste `YYYY-MM` (compat page liste) — pas dérivé pour garder la flexibilité.
 *   5. `tag` : Position | Actualité | Presse.
 *
 * NB : tirets semi-quadratiques "–" uniquement dans le contenu éditorial.
 */

export type PositionTag = "Position" | "Actualité" | "Presse";

export interface Position {
  slug: string;
  title: string;
  /** Libellé humain (ex. "Février 2026") */
  date: string;
  /** Format YYYY-MM pour trier */
  sortKey: string;
  /** Format ISO YYYY-MM-DD pour JSON-LD / sitemap / RSS */
  datePublished: string;
  /** Dernière modif (optionnel) */
  dateModified?: string;
  /** Résumé court affiché sur la liste + description OG/RSS */
  excerpt: string;
  tag: PositionTag;
  /** Contenu de l'article en HTML simple (sanitisé au rendu) */
  body: string;
  /** Nom éventuel de l'auteur (affiché dans l'article + JSON-LD) */
  author?: string;
  /** URL d'une image d'illustration (optionnel, sert aux méta OG + JSON-LD) */
  imageUrl?: string;
}

export const positions: Position[] = [
  {
    slug: "transition-energetique-flottes",
    title: "Transition énergétique des flottes côtières",
    date: "Février 2026",
    sortKey: "2026-02",
    datePublished: "2026-02-12",
    excerpt:
      "Les armateurs du GASPE s'engagent pour la décarbonation des liaisons maritimes de service public.",
    tag: "Position",
    author: "GASPE",
    body: `
<p>La transition énergétique du maritime côtier n'est plus une option : c'est une trajectoire structurante pour les 27 compagnies adhérentes du GASPE. L'appel à projets ADEME 2026 – doté de 70 M€ avec un plafond par projet porté à 6 M€ – ouvre une fenêtre d'opportunité sans précédent pour accélérer le renouvellement des flottes de service public.</p>
<h3>Une trajectoire pragmatique et graduée</h3>
<p>Le GASPE défend une approche pragmatique et graduée, adaptée à la diversité des liaisons côtières françaises :</p>
<ul>
  <li><strong>Hybridation diesel-électrique</strong> pour les navires à forte rotation portuaire, déjà opérationnelle chez plusieurs adhérents ;</li>
  <li><strong>Propulsion 100 % électrique</strong> pour les liaisons courtes inférieures à 30 minutes et à quai fréquent ;</li>
  <li><strong>Biocarburants HVO et GNL bio</strong> en transition pour les liaisons longues, sans nécessiter de refonte complète des motorisations ;</li>
  <li><strong>Hydrogène</strong> à moyen terme (2030+) sur des démonstrateurs outre-mer et sur les lignes courtes.</li>
</ul>
<h3>Les freins identifiés</h3>
<p>La décarbonation impose de lever simultanément trois obstacles : infrastructures portuaires d'avitaillement (bornes de recharge haute puissance, avitaillement GNL/H2), coût d'investissement (surcoût unitaire de 30 à 60 % vs diesel conventionnel) et formation des équipages aux nouvelles technologies. Le GASPE plaide pour un guichet unique État–ADEME–Régions permettant de financer l'ensemble de la chaîne.</p>
<h3>Appel aux pouvoirs publics</h3>
<p>Le Groupement invite l'État à pérenniser l'AAP ADEME sur une trajectoire 2026–2030 avec une enveloppe annuelle équivalente, à harmoniser les règles portuaires outre-mer et à sanctuariser les aides à l'avitaillement vert dans les délégations de service public. Sans visibilité pluriannuelle, les plans d'investissement des armateurs côtiers ne pourront pas être déclenchés.</p>
<p><a href="/transition-ecologique">En savoir plus sur la transition écologique du maritime côtier &rarr;</a></p>
    `.trim(),
  },
  {
    slug: "accessibilite-pmr-liaisons-maritimes",
    title: "Accessibilité PMR sur les liaisons maritimes côtières",
    date: "Janvier 2026",
    sortKey: "2026-01",
    datePublished: "2026-01-22",
    excerpt:
      "Le GASPE publie ses recommandations pour améliorer l'accès aux personnes à mobilité réduite.",
    tag: "Position",
    author: "GASPE",
    body: `
<p>L'accessibilité des liaisons maritimes côtières aux personnes à mobilité réduite (PMR) reste un défi majeur – en particulier sur les infrastructures historiques que sont les gares maritimes, les cales et certains navires en service depuis plus de 20 ans.</p>
<h3>Un diagnostic partagé</h3>
<p>Le GASPE, en concertation avec les associations représentant les usagers en situation de handicap, a établi un diagnostic partagé : 62 % des navires adhérents sont aujourd'hui accessibles PMR (ascenseurs, rampes, toilettes adaptées, signalétique visuelle et sonore), mais seulement 38 % des quais et gares maritimes le sont pleinement.</p>
<h3>Nos engagements</h3>
<ul>
  <li>Porter à <strong>90 % la part des navires accessibles</strong> d'ici 2030 dans nos flottes ;</li>
  <li>Co-financer avec les autorités portuaires les travaux d'accessibilité des quais (plateformes élévatrices, cheminements podotactiles) ;</li>
  <li>Former l'ensemble des personnels embarqués et sédentaires à l'accueil des usagers en situation de handicap (MLC 2006 + module PMR) ;</li>
  <li>Systématiser la pré-réservation d'assistance en ligne sans surcoût.</li>
</ul>
<h3>Ce que nous demandons</h3>
<p>Le GASPE demande à l'État d'intégrer explicitement un volet "accessibilité PMR" dans les DSP renouvelées à partir de 2027, avec un financement dédié des travaux portuaires et une compensation tarifaire des surcoûts d'exploitation. L'accès à la mer est un service public – il doit l'être pour tous.</p>
    `.trim(),
  },
  {
    slug: "continuite-territoriale-service-public",
    title: "Continuité territoriale et service public maritime",
    date: "Décembre 2025",
    sortKey: "2025-12",
    datePublished: "2025-12-15",
    excerpt:
      "Position du GASPE sur le maintien des liaisons essentielles vers les îles françaises.",
    tag: "Position",
    author: "GASPE",
    body: `
<p>Les liaisons maritimes côtières françaises ne sont pas un transport comme les autres. Elles constituent <strong>le lien vital</strong> entre le littoral continental et plus de 30 îles habitées – de Bréhat à la Réunion, d'Ouessant à Saint-Pierre-et-Miquelon – totalisant plus de 230 000 habitants permanents et 25 millions de passagers par an.</p>
<h3>Continuité, pas continuation</h3>
<p>La continuité territoriale maritime est d'abord un droit constitutionnel (principe d'égalité des citoyens devant le service public) avant d'être une politique de transport. Elle doit être pensée comme telle : indépendamment du modèle économique retenu (DSP, contrat de service public, obligations de service public), l'État et les collectivités ont la responsabilité de garantir un niveau minimal de service – fréquence, tarifs, continuité en toutes saisons.</p>
<h3>Les réalités que nous défendons</h3>
<ul>
  <li>Des <strong>DSP pluriannuelles</strong> (8 à 12 ans) pour permettre l'investissement dans de nouvelles unités ;</li>
  <li>Une <strong>clause de revoyure</strong> obligatoire tous les 3 ans face aux chocs exogènes (carburant, inflation, normes) ;</li>
  <li>Un <strong>plancher de service minimum</strong> en hiver, même quand le modèle commercial ne le justifie pas ;</li>
  <li>La <strong>péréquation tarifaire outre-mer</strong> avec les lignes métropolitaines, via une dotation État fléchée.</li>
</ul>
<h3>Le rôle du GASPE</h3>
<p>Le Groupement est l'interlocuteur référent de la DGITM et des Régions sur les sujets de continuité territoriale maritime. Nous portons la voix des 27 compagnies adhérentes dans les négociations conventionnelles et les groupes de travail institutionnels – notamment au sein de l'ADF (Association pour le Développement de la Formation dans les transports).</p>
    `.trim(),
  },
  {
    slug: "formation-attractivite-metiers-maritimes",
    title: "Formation et attractivité des métiers maritimes",
    date: "Novembre 2025",
    sortKey: "2025-11",
    datePublished: "2025-11-10",
    excerpt:
      "Le GASPE s'engage pour le renouvellement des équipages et l'attractivité de la profession.",
    tag: "Position",
    author: "GASPE",
    body: `
<p>Le maritime côtier français emploie 1 494 marins et plus de 2 800 collaborateurs à terre. Comme l'ensemble des secteurs de la mer, il fait face à un défi d'attractivité : près de 40 % des marins actuels partiront à la retraite d'ici 2035, alors que les flux entrants en formation restent insuffisants.</p>
<h3>Des métiers qui ont du sens</h3>
<p>Les métiers du maritime côtier conjuguent utilité publique, ancrage local et technicité. Un capitaine 200, un mécanicien 750 kW, un matelot pont aux côtés d'équipages stables et de flottes modernes – c'est un environnement de travail qui attire à condition d'être mieux fait connaître.</p>
<h3>Nos leviers d'action</h3>
<ul>
  <li><strong>Valoriser les formations STCW</strong> et les brevets capitaine 200 / mécanicien 750 kW dans les CFA maritimes et les lycées pros du littoral ;</li>
  <li><strong>Développer l'alternance</strong> : le GASPE accompagne ses adhérents dans le recrutement d'apprentis, avec un objectif de +20 % d'apprentis embauchés d'ici 2027 ;</li>
  <li><strong>Financer les reconversions</strong> via l'OPCO Mobilités – les matelots issus de la pêche ou de la marine marchande trouvent dans le côtier une deuxième carrière adaptée ;</li>
  <li><strong>Féminiser</strong> la profession : seulement 12 % de femmes embarquées aujourd'hui, objectif 25 % en 2030 à la faveur d'aménagements de carrière et de mesures anti-discrimination.</li>
</ul>
<h3>Ce que le GASPE propose</h3>
<p>Nous proposons à l'État et aux Régions un "pacte emploi maritime côtier" 2026–2030, articulant financement ciblé des CFA littoraux, campagne nationale de communication "Métiers de la mer côtière", et reconnaissance des parcours de mobilité interne entre nos compagnies. Le maritime côtier recrute – faisons-le savoir.</p>
<p><a href="/formations">Voir notre catalogue de formations maritimes &rarr;</a></p>
    `.trim(),
  },
];

/**
 * Helpers utilisés par la page liste, la page détail et le sitemap/RSS.
 * Tri décroissant par défaut (plus récent en haut).
 */
export function getSortedPositions(): Position[] {
  return [...positions].sort((a, b) => b.sortKey.localeCompare(a.sortKey));
}

export function getPositionBySlug(slug: string): Position | undefined {
  return positions.find((p) => p.slug === slug);
}
