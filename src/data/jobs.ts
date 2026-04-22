export type Zone = 'normandie' | 'bretagne' | 'nouvelle-aquitaine' | 'pays-de-la-loire' | 'occitanie' | 'paca' | 'ile-de-france' | 'dom-tom';

export const ZONE_LABELS: Record<Zone, string> = {
  'normandie': 'Normandie',
  'bretagne': 'Bretagne',
  'nouvelle-aquitaine': 'Nouvelle-Aquitaine',
  'pays-de-la-loire': 'Pays de la Loire',
  'occitanie': 'Occitanie',
  'paca': 'PACA',
  'ile-de-france': 'Île-de-France',
  'dom-tom': 'Outre-mer',
};

export interface Job {
  id: string;
  slug: string;
  title: string;
  company: string;
  companySlug: string;
  location: string;
  zone: Zone;
  contractType: 'CDI' | 'CDD' | 'Saisonnier' | 'Stage' | 'Alternance' | 'Autres';
  category: string;
  brevet?: string;
  description: string;
  profile: string;
  conditions: string;
  contactEmail: string;
  contactName?: string;
  salaryRange?: string;
  salaryMin?: number;
  publishedAt: string;
  expiresAt?: string;
  published: boolean;

  // Hydros Alumni integration
  applicationUrl?: string;
  reference?: string;
  startDate?: string;
  contactFirstName?: string;
  contactLastName?: string;
  contactPhone?: string;
  handiAccessible?: boolean;
  hydrosOfferUrl?: string;
  hydrosOfferId?: string;
}

export const START_DATE_OPTIONS = [
  { value: 'Immédiat', label: 'Immédiat' },
  { value: 'Non précisé', label: 'Non précisé' },
  { value: 'Janvier', label: 'Janvier' },
  { value: 'Février', label: 'Février' },
  { value: 'Mars', label: 'Mars' },
  { value: 'Avril', label: 'Avril' },
  { value: 'Mai', label: 'Mai' },
  { value: 'Juin', label: 'Juin' },
  { value: 'Juillet', label: 'Juillet' },
  { value: 'Août', label: 'Août' },
  { value: 'Septembre', label: 'Septembre' },
  { value: 'Octobre', label: 'Octobre' },
  { value: 'Novembre', label: 'Novembre' },
  { value: 'Décembre', label: 'Décembre' },
];

export const jobs: Job[] = [
  // ──────────────────────────────────────────────────
  //  Karu'Ferry / Step Group
  // ──────────────────────────────────────────────────
  {
    id: 'karu-responsable-technique',
    slug: 'responsable-technique-flotte-guadeloupe',
    title: 'Responsable Technique Flotte',
    company: "Karu'Ferry / Step Group",
    companySlug: 'karu-ferry',
    location: 'Baie-Mahault, Guadeloupe',
    zone: 'dom-tom',
    contractType: 'CDI',
    category: 'Technique',
    description: `
      <h3>Présentation</h3>
      <p>Karu'Ferry, filiale du groupe Step Group, est l'opérateur principal de transport maritime de passagers en Guadeloupe. La compagnie assure les dessertes vers Les Saintes et Marie-Galante avec une flotte de <strong>5 navires</strong> : CAPO ROSSO, CAPO ROSSO 1, ATLANTIC JET, MARCUS GARVEY et GUY TIROLIEN.</p>

      <h3>Missions principales</h3>
      <ul>
        <li>Superviser la maintenance et l'entretien de l'ensemble de la flotte (5 navires)</li>
        <li>Planifier et coordonner les arrêts techniques, carénages et visites réglementaires</li>
        <li>Piloter la GMAO et optimiser les plans de maintenance préventive</li>
        <li>Gérer les budgets techniques et les relations avec les chantiers navals et fournisseurs</li>
        <li>Assurer la conformité réglementaire de la flotte (société de classification, Affaires Maritimes)</li>
        <li>Encadrer les Chefs Mécaniciens et le personnel technique à terre</li>
        <li>Participer à l'élaboration des spécifications pour les projets de modernisation ou d'acquisition</li>
        <li>Rédiger les rapports techniques et assurer le reporting auprès de la direction</li>
        <li>Mettre en œuvre la politique ISM et ISPS au niveau technique</li>
      </ul>
    `,
    profile: `
      <h3>Profil recherché</h3>
      <ul>
        <li><strong>Formation :</strong> Ingénieur mécanicien naval ou Brevet supérieur machine (Chef Mécanicien 8000 kW minimum)</li>
        <li>Expérience significative (5 ans+) en gestion technique de flotte ou en tant que Chef Mécanicien</li>
        <li>Maîtrise de la GMAO et des outils de gestion de maintenance</li>
        <li>Connaissance des réglementations maritimes internationales (SOLAS, MARPOL, ISM)</li>
        <li>Compétences en gestion de projet et en management</li>
        <li>Capacité à travailler en environnement tropical (chaleur, humidité)</li>
        <li>Autonomie, leadership et excellent relationnel</li>
      </ul>
    `,
    conditions: `
      <h3>Conditions & avantages</h3>
      <ul>
        <li><strong>Contrat :</strong> CDI</li>
        <li><strong>Statut :</strong> Cadre</li>
        <li><strong>Poste :</strong> Sédentaire, basé à Baie-Mahault (Guadeloupe)</li>
        <li>Cadre de vie exceptionnel en Guadeloupe</li>
        <li>Rôle stratégique au sein d'un groupe en développement</li>
        <li>Gestion d'une flotte variée (catamarans rapides, ferries classiques)</li>
      </ul>
    `,
    contactEmail: 'service.rh@stepgroup.gp',
    salaryMin: 5000,
    publishedAt: '2026-03-26',
    published: true,
  },
  {
    id: 'karu-chef-meca-3000',
    slug: 'chef-mecanicien-3000-kw-guadeloupe',
    title: 'Chef Mécanicien 3000 kW',
    company: "Karu'Ferry / Step Group",
    companySlug: 'karu-ferry',
    location: 'Guadeloupe',
    zone: 'dom-tom',
    contractType: 'CDI',
    category: 'Machine',
    brevet: 'Chef Mécanicien 3000 kW (STCW III/3)',
    description: `
      <h3>Présentation</h3>
      <p>Karu'Ferry, filiale du groupe Step Group, recrute un Chef Mécanicien embarqué pour ses navires à passagers assurant la desserte des Saintes et de Marie-Galante au départ de la Guadeloupe.</p>

      <h3>Missions principales</h3>
      <ul>
        <li>Assurer la conduite et la surveillance des installations machines des navires à passagers</li>
        <li>Réaliser la maintenance préventive et curative de l'appareil propulsif et des auxiliaires</li>
        <li>Encadrer l'équipe machine embarquée</li>
        <li>Gérer les consommables, pièces de rechange et outillage</li>
        <li>Tenir à jour les registres machine et la GMAO</li>
        <li>Veiller au respect des normes ISM et des procédures de sécurité</li>
        <li>Participer aux arrêts techniques et aux visites réglementaires</li>
        <li>Rendre compte au Responsable Technique Flotte</li>
      </ul>
    `,
    profile: `
      <h3>Profil recherché</h3>
      <ul>
        <li><strong>Brevet :</strong> Chef Mécanicien 3000 kW (STCW III/3)</li>
        <li>CFBS à jour</li>
        <li>Expérience sur navires à passagers souhaitée</li>
        <li>Connaissances en motorisation diesel rapide et systèmes de propulsion marine</li>
        <li>Capacité à travailler en milieu tropical</li>
        <li>Rigueur, autonomie et esprit d'initiative</li>
      </ul>
    `,
    conditions: `
      <h3>Conditions & avantages</h3>
      <ul>
        <li><strong>Contrat :</strong> CDI (embarqué)</li>
        <li><strong>Régime social :</strong> ENIM</li>
        <li>Cadre de vie caribéen exceptionnel</li>
        <li>Desserte inter-îles (Saintes, Marie-Galante)</li>
        <li>Possibilité d'évolution vers le poste de Responsable Technique</li>
      </ul>
    `,
    contactEmail: 'service.rh@stepgroup.gp',
    salaryMin: 4500,
    publishedAt: '2026-03-26',
    published: true,
  },
  {
    id: 'karu-chef-meca-8000',
    slug: 'chef-mecanicien-8000-kw-guadeloupe',
    title: 'Chef Mécanicien 8000 kW',
    company: "Karu'Ferry / Step Group",
    companySlug: 'karu-ferry',
    location: 'Guadeloupe',
    zone: 'dom-tom',
    contractType: 'CDI',
    category: 'Machine',
    brevet: 'Chef Mécanicien 8000 kW (STCW III/2)',
    description: `
      <h3>Présentation</h3>
      <p>Karu'Ferry, filiale du groupe Step Group, recrute un Chef Mécanicien 8000 kW embarqué pour ses navires les plus puissants : catamarans rapides et ferries assurant les liaisons inter-îles en Guadeloupe.</p>

      <h3>Missions principales</h3>
      <ul>
        <li>Assurer la conduite et la maintenance des installations machines complexes (catamaran rapide / ferry)</li>
        <li>Superviser l'ensemble des systèmes propulsifs, hydrauliques et électriques</li>
        <li>Planifier et exécuter la maintenance préventive via la GMAO</li>
        <li>Encadrer l'équipe machine et former les mécaniciens juniors</li>
        <li>Gérer les stocks techniques et les approvisionnements</li>
        <li>Assurer la liaison technique avec le Responsable Technique Flotte à terre</li>
        <li>Veiller au respect strict du Code ISM et des normes MARPOL</li>
        <li>Participer activement aux arrêts techniques et aux carénages</li>
      </ul>
    `,
    profile: `
      <h3>Profil recherché</h3>
      <ul>
        <li><strong>Brevet :</strong> Chef Mécanicien 8000 kW (STCW III/2)</li>
        <li>CFBS à jour</li>
        <li>Expérience confirmée sur navires à passagers rapides ou ferries</li>
        <li>Maîtrise des motorisations diesel rapides et des systèmes de propulsion à jets d'eau</li>
        <li>Compétences en GMAO et en gestion de maintenance</li>
        <li>Leadership, rigueur et capacité de décision en situation d'urgence</li>
      </ul>
    `,
    conditions: `
      <h3>Conditions & avantages</h3>
      <ul>
        <li><strong>Contrat :</strong> CDI (embarqué)</li>
        <li><strong>Régime social :</strong> ENIM</li>
        <li>Gestion d'installations complexes sur catamarans rapides</li>
        <li>Cadre de vie caribéen</li>
        <li>Possibilité d'évolution vers le poste de Responsable Technique Flotte</li>
      </ul>
    `,
    contactEmail: 'service.rh@stepgroup.gp',
    salaryMin: 5500,
    publishedAt: '2026-03-26',
    published: true,
  },
  {
    id: 'karu-capitaine-500',
    slug: 'capitaine-500-guadeloupe',
    title: 'Capitaine 500',
    company: "Karu'Ferry / Step Group",
    companySlug: 'karu-ferry',
    location: 'Guadeloupe',
    zone: 'dom-tom',
    contractType: 'CDI',
    category: 'Pont',
    brevet: 'Capitaine 500',
    description: `
      <h3>Présentation</h3>
      <p>Karu'Ferry, filiale du groupe Step Group, recrute un Capitaine 500 pour ses navires à passagers assurant la desserte des îles de Guadeloupe (Les Saintes, Marie-Galante) dans les eaux caribéennes.</p>

      <h3>Missions principales</h3>
      <ul>
        <li>Commander le navire et assurer la sécurité de la navigation en eaux caribéennes</li>
        <li>Diriger les manœuvres d'accostage et d'appareillage dans les ports insulaires</li>
        <li>Encadrer l'équipage et organiser le service à bord</li>
        <li>Veiller à la sécurité des passagers et au respect des capacités d'embarquement</li>
        <li>Appliquer les procédures ISM, ISPS et les consignes de la compagnie</li>
        <li>Assurer la tenue des documents de bord (journal de passerelle, rapports de traversée)</li>
        <li>Gérer les situations d'urgence et coordonner les exercices de sécurité</li>
        <li>Collaborer avec les autorités portuaires locales et le CROSS Antilles-Guyane</li>
      </ul>
    `,
    profile: `
      <h3>Profil recherché</h3>
      <ul>
        <li><strong>Brevet :</strong> Capitaine 500 (STCW II/3) ou supérieur</li>
        <li>CFBS à jour</li>
        <li>Expérience en navigation passagers souhaitée</li>
        <li>Connaissance des eaux caribéennes appréciée</li>
        <li>Sens du commandement et de la relation passagers</li>
        <li>Maîtrise du français ; anglais ou créole appréciés</li>
      </ul>
    `,
    conditions: `
      <h3>Conditions & avantages</h3>
      <ul>
        <li><strong>Contrat :</strong> CDI (embarqué)</li>
        <li><strong>Rémunération :</strong> 2 998,91 €/mois sur 13 mois</li>
        <li><strong>Régime social :</strong> ENIM (Catégorie 12)</li>
        <li>Cadre de vie caribéen exceptionnel</li>
        <li>Navigation inter-îles au cœur de l'archipel guadeloupéen</li>
      </ul>
    `,
    contactEmail: 'service.rh@stepgroup.gp',
    salaryRange: '2 998,91 €/mois sur 13 mois',
    salaryMin: 3000,
    publishedAt: '2026-03-26',
    published: true,
  },
];

/** Published jobs sorted by date (most recent first) */
export const publishedJobs = jobs
  .filter((j) => j.published)
  .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
