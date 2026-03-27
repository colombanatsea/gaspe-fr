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
  contractType: 'CDI' | 'CDD' | 'Saisonnier';
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
}

export const jobs: Job[] = [
  // ──────────────────────────────────────────────────
  //  Manche Iles Express
  // ──────────────────────────────────────────────────
  {
    id: 'mie-chef-meca-3000',
    slug: 'chef-mecanicien-3000-kw-manche-iles-express',
    title: 'Chef Mécanicien 3000 kW',
    company: 'Manche Iles Express',
    companySlug: 'manche-iles-express',
    location: 'Granville / Barneville-Carteret / Diélette',
    zone: 'normandie',
    contractType: 'CDD',
    category: 'Machine',
    brevet: 'Chef Mécanicien 3000 kW (STCW III/3)',
    description: `
      <h3>Présentation de la compagnie</h3>
      <p>Manche Iles Express, compagnie maritime de la Direction Normande de l'Océan (DNO), assure les liaisons entre la Normandie et les Îles Anglo-Normandes (Jersey, Guernesey, Sercq) à bord de Navires à Grande Vitesse (HSC). Nos navires opèrent au départ de Granville, Barneville-Carteret et Diélette.</p>

      <h3>Missions principales</h3>
      <ul>
        <li>Conduire et surveiller l'ensemble des installations machines des navires HSC</li>
        <li>Assurer la maintenance préventive et curative via la GMAO</li>
        <li>Gérer les stocks de carburant, lubrifiants et pièces de rechange</li>
        <li>Encadrer et animer l'équipe machine (mécaniciens, graisseurs)</li>
        <li>Veiller au respect du Code ISM et des procédures de sécurité</li>
        <li>Participer aux inspections et audits réglementaires (société de classification, Affaires Maritimes)</li>
        <li>Rédiger les rapports techniques et tenir à jour la documentation machine</li>
        <li>Collaborer avec le Capitaine pour optimiser la consommation et les performances</li>
      </ul>
    `,
    profile: `
      <h3>Profil recherché</h3>
      <ul>
        <li><strong>Brevet :</strong> Chef Mécanicien 3000 kW (STCW III/3 ou III/2)</li>
        <li><strong>Formation sécurité :</strong> CFBS (Certificat de Formation de Base à la Sécurité) à jour</li>
        <li>Expérience significative sur navires à passagers, idéalement HSC (High Speed Craft)</li>
        <li>Connaissance des motorisations à grande vitesse et des systèmes hydrauliques complexes</li>
        <li>Maîtrise des outils de GMAO</li>
        <li>Rigueur, réactivité et capacité à travailler en équipe</li>
        <li>La maîtrise de l'anglais technique est un plus</li>
      </ul>
    `,
    conditions: `
      <h3>Conditions & avantages</h3>
      <ul>
        <li><strong>Contrat :</strong> CDD de 6 mois (renouvelable)</li>
        <li><strong>Rémunération :</strong> 4 500 €/mois brut</li>
        <li><strong>Régime social :</strong> ENIM (Établissement National des Invalides de la Marine)</li>
        <li><strong>Rythme :</strong> Service 7j/7j en saison, rotation équipage</li>
        <li>Cadre de travail exceptionnel entre la Normandie et les Îles Anglo-Normandes</li>
        <li>Intégration au sein d'une équipe maritime passionnée et expérimentée</li>
      </ul>
    `,
    contactEmail: 'recrutement@manche-iles.com',
    salaryRange: '4 500 €/mois',
    salaryMin: 4500,
    publishedAt: '2026-03-26',
    published: true,
  },

  // ──────────────────────────────────────────────────
  //  Direction des Transports Maritimes de la Gironde
  // ──────────────────────────────────────────────────
  {
    id: 'gironde-capitaine-illimite',
    slug: 'capitaine-brevet-illimite-gironde',
    title: 'Capitaine - Brevet illimité',
    company: 'Direction des Transports Maritimes de la Gironde',
    companySlug: 'direction-transports-maritimes-gironde',
    location: 'Le Verdon-sur-Mer / Royan',
    zone: 'nouvelle-aquitaine',
    contractType: 'Saisonnier',
    category: 'Pont',
    brevet: 'Capitaine 3000 (brevet illimité)',
    description: `
      <h3>Présentation</h3>
      <p>La Direction des Transports Maritimes de la Gironde exploite les bacs girondins, véritables maillons du réseau de transport public départemental. Les ferries <strong>L'Estuaire</strong> (3705 UMS) et <strong>La Gironde</strong> (3684 UMS), d'une longueur de 78 mètres, sont équipés d'une propulsion <strong>Voith Schneider</strong> et assurent la traversée de l'estuaire de la Gironde entre Le Verdon-sur-Mer et Royan.</p>

      <h3>Missions principales</h3>
      <ul>
        <li>Commander le navire et assurer la sécurité de la navigation dans l'estuaire de la Gironde</li>
        <li>Diriger les manœuvres d'accostage et d'appareillage avec propulsion Voith Schneider</li>
        <li>Encadrer l'équipage pont et machine</li>
        <li>Veiller au respect des règlements maritimes, du code ISM et des consignes de sécurité</li>
        <li>Assurer le chargement et le déchargement des véhicules et passagers en toute sécurité</li>
        <li>Gérer les situations d'urgence et coordonner les exercices de sécurité</li>
        <li>Renseigner les documents de bord et les rapports de traversée</li>
      </ul>
    `,
    profile: `
      <h3>Profil recherché</h3>
      <ul>
        <li><strong>Brevet :</strong> Capitaine illimité (STCW II/2)</li>
        <li>CFBS à jour</li>
        <li>Expérience souhaitée en navigation estuarienne ou côtière</li>
        <li>Connaissance de la propulsion Voith Schneider appréciée</li>
        <li>Aptitude au commandement et sens des responsabilités</li>
        <li>Capacité à gérer le transport de passagers et véhicules</li>
      </ul>
    `,
    conditions: `
      <h3>Conditions & avantages</h3>
      <ul>
        <li><strong>Contrat :</strong> Saisonnier (Juin à Septembre)</li>
        <li><strong>Classification :</strong> Niveau 8 CCN GASPE (IDCC 3228)</li>
        <li><strong>Régime social :</strong> ENIM</li>
        <li>Intégration au sein d'un service public départemental reconnu</li>
        <li>Navigation en estuaire, pas de découcher</li>
      </ul>
    `,
    contactEmail: 'y.roussel@gironde.fr',
    contactName: 'Yannick ROUSSEL',
    salaryMin: 5000,
    publishedAt: '2026-03-26',
    published: true,
  },
  {
    id: 'gironde-capitaine-3000',
    slug: 'capitaine-3000-ums-blaye-lamarque',
    title: 'Capitaine 3000 UMS',
    company: 'Direction des Transports Maritimes de la Gironde',
    companySlug: 'direction-transports-maritimes-gironde',
    location: 'Blaye / Lamarque',
    zone: 'nouvelle-aquitaine',
    contractType: 'Saisonnier',
    category: 'Pont',
    brevet: 'Capitaine 3000 UMS',
    description: `
      <h3>Présentation</h3>
      <p>La Direction des Transports Maritimes de la Gironde exploite la ligne Blaye – Lamarque avec le bac <strong>Sébastien Vauban</strong> (1024 UMS), équipé d'une propulsion <strong>Schottel</strong>. Cette traversée fluviale historique relie le Médoc à la rive droite de la Gironde.</p>

      <h3>Missions principales</h3>
      <ul>
        <li>Commander le bac Sébastien Vauban sur la traversée Blaye – Lamarque</li>
        <li>Assurer la sécurité de la navigation et des manœuvres avec propulsion Schottel</li>
        <li>Encadrer l'équipage et veiller à la bonne organisation du service</li>
        <li>Superviser le chargement/déchargement des véhicules et passagers</li>
        <li>Appliquer les procédures ISM et les consignes de sécurité</li>
        <li>Tenir à jour la documentation de bord</li>
        <li>Participer aux exercices de sécurité réglementaires</li>
      </ul>
    `,
    profile: `
      <h3>Profil recherché</h3>
      <ul>
        <li><strong>Brevet :</strong> Capitaine 3000 UMS minimum</li>
        <li>CFBS à jour</li>
        <li>Expérience sur navires à passagers et/ou bacs appréciée</li>
        <li>Connaissance de la propulsion Schottel est un plus</li>
        <li>Sens des responsabilités et aptitude au travail en équipe</li>
      </ul>
    `,
    conditions: `
      <h3>Conditions & avantages</h3>
      <ul>
        <li><strong>Contrat :</strong> Saisonnier (Juin à Septembre)</li>
        <li><strong>Classification :</strong> Niveau 7 ou 8 CCN GASPE (IDCC 3228)</li>
        <li><strong>Régime social :</strong> ENIM</li>
        <li>Navigation estuarienne, retour à terre quotidien</li>
      </ul>
    `,
    contactEmail: 'y.roussel@gironde.fr',
    contactName: 'Yannick ROUSSEL',
    salaryMin: 4000,
    publishedAt: '2026-03-26',
    published: true,
  },
  {
    id: 'gironde-chef-meca-8000',
    slug: 'chef-mecanicien-8000-kw-verdon-royan',
    title: 'Chef Mécanicien 8000 kW',
    company: 'Direction des Transports Maritimes de la Gironde',
    companySlug: 'direction-transports-maritimes-gironde',
    location: 'Le Verdon-sur-Mer / Royan',
    zone: 'nouvelle-aquitaine',
    contractType: 'Saisonnier',
    category: 'Machine',
    brevet: 'Chef Mécanicien 8000 kW (STCW III/2)',
    description: `
      <h3>Présentation</h3>
      <p>La Direction des Transports Maritimes de la Gironde recrute un Chef Mécanicien pour ses ferries <strong>L'Estuaire</strong> et <strong>La Gironde</strong>, navires de 78 mètres équipés d'une puissance totale de <strong>4 820 kW</strong> et d'une propulsion <strong>Voith Schneider</strong>. Ces bacs assurent la traversée Le Verdon-sur-Mer – Royan.</p>

      <h3>Missions principales</h3>
      <ul>
        <li>Assurer la conduite, la surveillance et l'entretien de l'ensemble des installations machines (4 820 kW)</li>
        <li>Superviser la propulsion Voith Schneider et les systèmes auxiliaires</li>
        <li>Planifier et réaliser la maintenance préventive et curative</li>
        <li>Encadrer l'équipe machine (maîtres machine, mécaniciens)</li>
        <li>Gérer les approvisionnements en carburant, lubrifiants et pièces détachées</li>
        <li>Veiller au respect du Code ISM et des normes environnementales</li>
        <li>Participer aux visites réglementaires et aux arrêts techniques</li>
        <li>Rédiger les rapports techniques et alimenter la GMAO</li>
      </ul>
    `,
    profile: `
      <h3>Profil recherché</h3>
      <ul>
        <li><strong>Brevet :</strong> Chef Mécanicien 8000 kW (STCW III/2 ou équivalent)</li>
        <li>CFBS à jour</li>
        <li>Expérience sur navires à passagers, idéalement avec propulsion Voith Schneider</li>
        <li>Compétences en gestion de maintenance (GMAO)</li>
        <li>Leadership, rigueur et sens de l'organisation</li>
      </ul>
    `,
    conditions: `
      <h3>Conditions & avantages</h3>
      <ul>
        <li><strong>Contrat :</strong> Saisonnier (Mai à Septembre)</li>
        <li><strong>Classification :</strong> Niveau 7 ou 8 CCN GASPE (IDCC 3228)</li>
        <li><strong>Régime social :</strong> ENIM</li>
        <li>Navigation estuarienne, retour à terre quotidien</li>
        <li>Intégration dans une structure publique départementale</li>
      </ul>
    `,
    contactEmail: 'y.roussel@gironde.fr',
    contactName: 'Yannick ROUSSEL',
    salaryMin: 5500,
    publishedAt: '2026-03-26',
    published: true,
  },
  {
    id: 'gironde-chef-meca-3000',
    slug: 'chef-mecanicien-3000-kw-blaye-lamarque',
    title: 'Chef Mécanicien 3000 kW',
    company: 'Direction des Transports Maritimes de la Gironde',
    companySlug: 'direction-transports-maritimes-gironde',
    location: 'Blaye / Lamarque',
    zone: 'nouvelle-aquitaine',
    contractType: 'Saisonnier',
    category: 'Machine',
    brevet: 'Chef Mécanicien 3000 kW (STCW III/3)',
    description: `
      <h3>Présentation</h3>
      <p>La Direction des Transports Maritimes de la Gironde recrute un Chef Mécanicien pour le bac <strong>Sébastien Vauban</strong> (1024 UMS), équipé d'une puissance de <strong>2 139 kW</strong> et d'une propulsion <strong>Schottel</strong>, sur la ligne Blaye – Lamarque.</p>

      <h3>Missions principales</h3>
      <ul>
        <li>Assurer la conduite et la maintenance de l'appareil propulsif Schottel (2 139 kW)</li>
        <li>Surveiller et entretenir l'ensemble des installations machines du bac</li>
        <li>Planifier la maintenance préventive et intervenir en curatif</li>
        <li>Gérer les stocks de consommables et pièces de rechange</li>
        <li>Encadrer le personnel machine</li>
        <li>Respecter les procédures ISM et les normes de sécurité</li>
        <li>Collaborer avec le Capitaine pour le bon fonctionnement du navire</li>
      </ul>
    `,
    profile: `
      <h3>Profil recherché</h3>
      <ul>
        <li><strong>Brevet :</strong> Chef Mécanicien 3000 kW (STCW III/3)</li>
        <li>CFBS à jour</li>
        <li>Expérience sur bacs ou navires à passagers appréciée</li>
        <li>Connaissance de la propulsion Schottel est un atout</li>
        <li>Autonomie, rigueur et esprit d'équipe</li>
      </ul>
    `,
    conditions: `
      <h3>Conditions & avantages</h3>
      <ul>
        <li><strong>Contrat :</strong> Saisonnier (Juin à Septembre)</li>
        <li><strong>Classification :</strong> Niveau 7 CCN GASPE (IDCC 3228)</li>
        <li><strong>Régime social :</strong> ENIM</li>
        <li>Navigation estuarienne, retour à terre quotidien</li>
      </ul>
    `,
    contactEmail: 'y.roussel@gironde.fr',
    contactName: 'Yannick ROUSSEL',
    salaryMin: 4500,
    publishedAt: '2026-03-26',
    published: true,
  },
  {
    id: 'gironde-maitre-machine',
    slug: 'maitre-machine-mecanicien-750-kw-verdon-royan',
    title: 'Maître Machine - Mécanicien 750 kW',
    company: 'Direction des Transports Maritimes de la Gironde',
    companySlug: 'direction-transports-maritimes-gironde',
    location: 'Le Verdon-sur-Mer / Royan',
    zone: 'nouvelle-aquitaine',
    contractType: 'Saisonnier',
    category: 'Machine',
    brevet: 'Mécanicien 750 kW',
    description: `
      <h3>Présentation</h3>
      <p>La Direction des Transports Maritimes de la Gironde recrute un Maître Machine pour ses ferries <strong>L'Estuaire</strong> et <strong>La Gironde</strong> (4 820 kW, propulsion Voith Schneider) sur la traversée Le Verdon-sur-Mer – Royan.</p>

      <h3>Missions principales</h3>
      <ul>
        <li>Assurer le quart machine sous la direction du Chef Mécanicien</li>
        <li>Surveiller le fonctionnement des moteurs principaux et auxiliaires</li>
        <li>Effectuer les rondes de surveillance et relever les paramètres machine</li>
        <li>Participer aux opérations de maintenance préventive et curative</li>
        <li>Intervenir en cas de dysfonctionnement ou d'urgence technique</li>
        <li>Contribuer à la tenue des registres machine et de la GMAO</li>
        <li>Participer aux exercices de sécurité (incendie, abandon, homme à la mer)</li>
        <li>Assister le Chef Mécanicien lors des approvisionnements et des arrêts techniques</li>
      </ul>
    `,
    profile: `
      <h3>Profil recherché</h3>
      <ul>
        <li><strong>Brevet :</strong> Mécanicien 750 kW ou équivalent</li>
        <li>CFBS à jour</li>
        <li>Expérience embarquée en service machine souhaitée</li>
        <li>Connaissances en mécanique diesel et systèmes hydrauliques</li>
        <li>Sens de l'observation, rigueur et réactivité</li>
        <li>Aptitude au travail en équipe et en milieu confiné</li>
      </ul>
    `,
    conditions: `
      <h3>Conditions & avantages</h3>
      <ul>
        <li><strong>Contrat :</strong> Saisonnier (Mai à Septembre)</li>
        <li><strong>Classification :</strong> Niveau 3 ou 4 CCN GASPE (IDCC 3228)</li>
        <li><strong>Régime social :</strong> ENIM</li>
        <li>Navigation estuarienne, retour à terre quotidien</li>
        <li>Possibilité d'évolution au sein de la structure</li>
      </ul>
    `,
    contactEmail: 'y.roussel@gironde.fr',
    contactName: 'Yannick ROUSSEL',
    salaryMin: 3200,
    publishedAt: '2026-03-26',
    published: true,
  },

  // ──────────────────────────────────────────────────
  //  Karu'Ferry / Step Group
  // ──────────────────────────────────────────────────
  {
    id: 'karu-responsable-technique',
    slug: 'responsable-technique-flotte-guadeloupe',
    title: 'Responsable Technique Flotte',
    company: "Karu\u2019Ferry / Step Group",
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
    company: "Karu\u2019Ferry / Step Group",
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
    company: "Karu\u2019Ferry / Step Group",
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
    company: "Karu\u2019Ferry / Step Group",
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
