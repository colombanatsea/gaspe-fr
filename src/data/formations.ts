export interface Formation {
  id: string;
  slug: string;
  title: string;
  description: string;
  content: string;
  organizer: string;
  startDate: string;
  endDate: string;
  location: string;
  duration: string;
  capacity: number;
  enrolled: number;
  targetAudience: string;
  prerequisites: string;
  price: string;
  contactEmail: string;
  status: "open" | "closed" | "full";
  category: "sécurité" | "brevets" | "management" | "réglementaire" | "technique";
}

export const formations: Formation[] = [
  {
    id: "form-cfbs",
    slug: "cfbs-certificat-formation-base-securite",
    title: "Certificat de Formation de Base à la Sécurité (CFBS)",
    description: "Formation réglementaire obligatoire pour tout personnel embarqué. Inclut lutte incendie, survie en mer, premiers secours et sécurité individuelle.",
    content: `
      <h3>Objectifs de la formation</h3>
      <p>Le CFBS est la formation <strong>obligatoire</strong> pour toute personne embarquée sur un navire de commerce ou de passagers. Il constitue le socle commun de compétences en matière de sécurité maritime, conformément aux exigences de la convention <strong>STCW</strong>.</p>

      <h3>Programme détaillé</h3>
      <ul>
        <li><strong>Module 1 – Survie en mer :</strong> techniques de mise à l'eau, utilisation des radeaux de sauvetage, survie en eau froide, signaux de détresse</li>
        <li><strong>Module 2 – Lutte incendie :</strong> classes de feux, extincteurs, ARI (Appareil Respiratoire Isolant), manœuvre d'équipe</li>
        <li><strong>Module 3 – Premiers secours :</strong> gestes d'urgence, massage cardiaque, DEA, immobilisation, évacuation</li>
        <li><strong>Module 4 – Sécurité individuelle :</strong> prévention des risques, EPI, procédures d'urgence à bord, exercices d'abandon</li>
      </ul>

      <h3>Certification</h3>
      <p>À l'issue de la formation, les stagiaires obtiennent le <strong>Certificat de Formation de Base à la Sécurité</strong> (STCW A-VI/1), valable 5 ans. Le recyclage (revalidation) dure 2 jours.</p>

      <h3>Pédagogie</h3>
      <p>Formation en présentiel avec exercices pratiques en conditions réelles : bassins de survie, simulateur incendie, mannequins de secourisme. Évaluation continue tout au long des 5 jours.</p>
    `,
    organizer: "ENSM – École Nationale Supérieure Maritime",
    startDate: "2026-05-12",
    endDate: "2026-05-16",
    location: "Le Havre",
    duration: "5 jours (35h)",
    capacity: 20,
    enrolled: 14,
    targetAudience: "Tout personnel navigant",
    prerequisites: "Aptitude médicale à la navigation",
    price: "1 200 €",
    contactEmail: "formation@ensm.fr",
    status: "open",
    category: "sécurité",
  },
  {
    id: "form-capitaine-200",
    slug: "brevet-capitaine-200",
    title: "Brevet de Capitaine 200",
    description: "Formation au commandement de navires de moins de 200 UMS en navigation côtière. Réglementation, navigation, manœuvre, météo, anglais maritime.",
    content: `
      <h3>Objectifs de la formation</h3>
      <p>Le Brevet de Capitaine 200 autorise le commandement de navires de jauge brute inférieure à <strong>200 UMS</strong> en navigation côtière (jusqu'à 20 milles des côtes). C'est un brevet essentiel pour les compagnies opérant des liaisons de proximité et des navettes passagers.</p>

      <h3>Programme détaillé</h3>
      <ul>
        <li><strong>Navigation :</strong> calculs de marée, courants, position par relèvements, radar/ECDIS, routage côtier</li>
        <li><strong>Réglementation :</strong> RIPAM (règles de barre et de route), signalisation maritime, division 222/226</li>
        <li><strong>Manœuvre :</strong> accostage, appareillage, ancrage, propulsion Voith Schneider et azimutal</li>
        <li><strong>Météorologie :</strong> lecture de cartes synoptiques, bulletins Météo France, houle et vent</li>
        <li><strong>Anglais maritime :</strong> SMCP (Standard Marine Communication Phrases), VHF en anglais</li>
        <li><strong>Sécurité :</strong> Code ISM, plan d'urgence, exercices d'abandon et de lutte incendie</li>
      </ul>

      <h3>Certification</h3>
      <p>Examen final devant le jury des Affaires Maritimes. Le brevet est délivré par la DIRM après validation de la formation et du temps de navigation requis.</p>

      <h3>Débouchés</h3>
      <p>Commandement de navettes passagers, vedettes de liaison, bacs côtiers, navires de servitude portuaire. Ce brevet est la porte d'entrée vers le Capitaine 500 et le Capitaine 3000.</p>
    `,
    organizer: "ENSM – Le Havre",
    startDate: "2026-06-02",
    endDate: "2026-07-11",
    location: "Le Havre",
    duration: "6 semaines",
    capacity: 16,
    enrolled: 16,
    targetAudience: "Officiers pont",
    prerequisites: "12 mois de navigation effective, CFBS valide",
    price: "4 500 €",
    contactEmail: "formation@ensm.fr",
    status: "full",
    category: "brevets",
  },
  {
    id: "form-mecanicien-750",
    slug: "brevet-mecanicien-750kw",
    title: "Brevet de Mécanicien 750 kW",
    description: "Formation à la conduite et la maintenance des installations machine de navires jusqu'à 750 kW. Moteurs diesel, systèmes hydrauliques, électricité bord.",
    content: `
      <h3>Objectifs de la formation</h3>
      <p>Le Brevet de Mécanicien 750 kW permet de diriger les installations machines de navires dont la puissance propulsive n'excède pas <strong>750 kW</strong>. Formation essentielle pour les compagnies de passages d'eau exploitant des navires de taille moyenne.</p>

      <h3>Programme détaillé</h3>
      <ul>
        <li><strong>Moteurs diesel :</strong> principes, cycles, injection, turbocompression, maintenance préventive</li>
        <li><strong>Systèmes hydrauliques :</strong> circuits de barre, treuils, portes rampes, dépannage</li>
        <li><strong>Électricité bord :</strong> production, distribution, automatismes, alarmes, maintenance</li>
        <li><strong>Auxiliaires :</strong> pompes, compresseurs, séparateurs, traitement des eaux</li>
        <li><strong>Réglementation :</strong> visites périodiques, GMAO, registres techniques, division 222</li>
        <li><strong>Sécurité machine :</strong> prévention incendie, CO2, espaces confinés, procédures d'urgence</li>
      </ul>

      <h3>Certification</h3>
      <p>Examen théorique et pratique. Le brevet est conforme aux exigences <strong>STCW III/1</strong> pour les navires à puissance limitée. Passerelle vers le Mécanicien 3000 kW.</p>
    `,
    organizer: "ENSM – Marseille",
    startDate: "2026-09-15",
    endDate: "2026-10-24",
    location: "Marseille",
    duration: "6 semaines",
    capacity: 14,
    enrolled: 8,
    targetAudience: "Officiers machine",
    prerequisites: "6 mois de navigation, CFBS valide",
    price: "4 200 €",
    contactEmail: "formation@ensm.fr",
    status: "open",
    category: "brevets",
  },
  {
    id: "form-ism",
    slug: "audit-interne-ism-isps",
    title: "Audit interne ISM / ISPS",
    description: "Méthodologie d'audit interne du Code ISM (gestion de la sécurité) et du Code ISPS (sûreté maritime). Préparation aux inspections FSI.",
    content: `
      <h3>Objectifs de la formation</h3>
      <p>Maîtriser les techniques d'audit interne pour le <strong>Code ISM</strong> (International Safety Management) et le <strong>Code ISPS</strong> (International Ship and Port Facility Security). Préparer efficacement les inspections des sociétés de classification et des autorités maritimes.</p>

      <h3>Programme détaillé</h3>
      <ul>
        <li><strong>Jour 1 – Fondamentaux :</strong> Architecture ISM/ISPS, SMS (Safety Management System), SSP (Ship Security Plan), rôles du DPA et du CSO</li>
        <li><strong>Jour 2 – Méthodologie d'audit :</strong> planification, check-lists, techniques d'entretien, rédaction de constats (NC majeure, NC mineure, observation)</li>
        <li><strong>Jour 3 – Mise en pratique :</strong> audit simulé sur dossier réel, revue de direction, plan d'actions correctives, clôture d'audit</li>
      </ul>

      <h3>Certification</h3>
      <p>Attestation d'auditeur interne ISM/ISPS délivrée par Bureau Veritas Marine. Reconnue par les administrations maritimes pour les audits internes réglementaires.</p>

      <h3>Format</h3>
      <p>Formation possible en présentiel (Paris) ou en visioconférence. Supports de cours et modèles de check-lists fournis.</p>
    `,
    organizer: "Bureau Veritas Marine",
    startDate: "2026-04-22",
    endDate: "2026-04-24",
    location: "Paris (en ligne possible)",
    duration: "3 jours (21h)",
    capacity: 25,
    enrolled: 11,
    targetAudience: "DPA, responsables sécurité, capitaines",
    prerequisites: "Connaissance du Code ISM",
    price: "1 800 €",
    contactEmail: "marine.training@bureauveritas.com",
    status: "open",
    category: "réglementaire",
  },
  {
    id: "form-transition-energetique",
    slug: "transition-energetique-flottes",
    title: "Transition énergétique des flottes maritimes",
    description: "Panorama des solutions de décarbonation : GNL, hydrogène, propulsion vélique, hybridation électrique. Retours d'expérience et feuille de route IMO 2050.",
    content: `
      <h3>Objectifs de la formation</h3>
      <p>Comprendre les enjeux, les technologies et les réglementations liés à la <strong>décarbonation du transport maritime</strong>. Préparer sa compagnie aux objectifs IMO 2030/2050 et à la réglementation européenne FuelEU Maritime.</p>

      <h3>Programme détaillé</h3>
      <ul>
        <li><strong>Jour 1 – État des lieux :</strong> bilan carbone du secteur, réglementation IMO (CII, EEXI), FuelEU Maritime, taxe carbone européenne ETS</li>
        <li><strong>Jour 2 – Solutions technologiques :</strong> GNL/bio-GNL, hydrogène et piles à combustible, batteries et hybridation, propulsion vélique assistée, méthanol/ammoniac vert</li>
      </ul>

      <h3>Retours d'expérience</h3>
      <p>Témoignages de compagnies ayant lancé des projets : E-ferry danois (100% électrique), Energy Observer, navires hybrides de la Compagnie Océane, projet hydrogène de CMN.</p>

      <h3>Financement</h3>
      <p>Gratuit pour les adhérents GASPE. Co-organisé avec le Cluster Maritime Français dans le cadre du programme France 2030.</p>
    `,
    organizer: "GASPE / Cluster Maritime Français",
    startDate: "2026-11-18",
    endDate: "2026-11-19",
    location: "Nantes",
    duration: "2 jours (14h)",
    capacity: 40,
    enrolled: 22,
    targetAudience: "Dirigeants, responsables techniques, ingénieurs navals",
    prerequisites: "Aucun",
    price: "Gratuit pour les adhérents GASPE",
    contactEmail: "contact@gaspe.fr",
    status: "open",
    category: "technique",
  },
  {
    id: "form-secours-mer",
    slug: "recyclage-premiers-secours-mer",
    title: "Recyclage Premiers Secours en Mer (PSMer)",
    description: "Recyclage obligatoire tous les 5 ans. Gestes d'urgence, utilisation du DEA, hypothermie, noyade, évacuation sanitaire héliportée.",
    content: `
      <h3>Objectifs de la formation</h3>
      <p>Le recyclage PSMer est <strong>obligatoire tous les 5 ans</strong> pour le personnel navigant titulaire du certificat initial. Il permet de maintenir et actualiser les compétences en matière de secourisme maritime.</p>

      <h3>Programme détaillé</h3>
      <ul>
        <li><strong>Bilan des victimes :</strong> examen primaire et secondaire, score de Glasgow, communication avec le CCMM (Centre de Consultation Médicale Maritime)</li>
        <li><strong>Gestes d'urgence :</strong> RCP (réanimation cardio-pulmonaire), utilisation du DEA, position latérale de sécurité</li>
        <li><strong>Pathologies maritimes :</strong> hypothermie, noyade secondaire, mal de mer sévère, coup de chaleur</li>
        <li><strong>Hélitreuillage :</strong> préparation de la zone, communication VHF avec l'hélicoptère, conditionnement du blessé</li>
        <li><strong>Pharmacie de bord :</strong> dotations obligatoires, protocoles médicamenteux autorisés</li>
      </ul>

      <h3>Certification</h3>
      <p>Renouvellement du certificat PSMer pour 5 ans, conforme à la division 217 et aux exigences STCW A-VI/4.</p>
    `,
    organizer: "Croix-Rouge Maritime",
    startDate: "2026-06-16",
    endDate: "2026-06-17",
    location: "Brest",
    duration: "2 jours (14h)",
    capacity: 18,
    enrolled: 18,
    targetAudience: "Tout personnel navigant (recyclage)",
    prerequisites: "CFBS ou PSMer initial",
    price: "650 €",
    contactEmail: "maritime@croix-rouge.fr",
    status: "full",
    category: "sécurité",
  },
  {
    id: "form-management-equipes",
    slug: "management-equipage-leadership",
    title: "Management d'équipage et leadership maritime",
    description: "Communication à bord, gestion des conflits, leadership en situation d'urgence, BRM (Bridge Resource Management). Conforme STCW 2010.",
    content: `
      <h3>Objectifs de la formation</h3>
      <p>Développer les compétences de <strong>leadership et de gestion d'équipe</strong> dans l'environnement maritime. Conforme aux exigences STCW 2010 en matière de compétences non techniques (STCW A-II/1 et A-III/1).</p>

      <h3>Programme détaillé</h3>
      <ul>
        <li><strong>Jour 1 – Leadership maritime :</strong> styles de leadership, assertivité, prise de décision sous pression, autorité et responsabilité du commandant</li>
        <li><strong>Jour 2 – Communication à bord :</strong> briefings opérationnels, closed-loop communication, BRM (Bridge Resource Management), gestion du CRM (Crew Resource Management)</li>
        <li><strong>Jour 3 – Situations de crise :</strong> gestion des conflits, fatigue et stress, exercices de gestion d'urgence, débriefing et retour d'expérience</li>
      </ul>

      <h3>Pédagogie</h3>
      <p>Mises en situation sur simulateur de passerelle, jeux de rôles, études de cas d'accidents maritimes (BEAmer), travail en binôme capitaine/second.</p>

      <h3>Certification</h3>
      <p>Attestation de formation conforme STCW, valorisable dans le dossier de revalidation des brevets.</p>
    `,
    organizer: "CNAM Maritime",
    startDate: "2026-10-06",
    endDate: "2026-10-08",
    location: "Saint-Malo",
    duration: "3 jours (21h)",
    capacity: 12,
    enrolled: 5,
    targetAudience: "Capitaines, seconds capitaines, chefs mécaniciens",
    prerequisites: "Expérience de commandement",
    price: "2 100 €",
    contactEmail: "maritime@cnam.fr",
    status: "open",
    category: "management",
  },
  {
    id: "form-ccn-3228",
    slug: "ccn-3228-mise-a-jour",
    title: "Convention Collective Nationale 3228 – Mise à jour",
    description: "Séminaire sur les évolutions de la CCN 3228 applicable au transport maritime de passagers. Grilles salariales, congés, régime ENIM, accords de branche récents.",
    content: `
      <h3>Objectifs de la formation</h3>
      <p>Maîtriser les dernières évolutions de la <strong>CCN 3228</strong> (Convention Collective Nationale du personnel navigant des passages d'eau) et leur application concrète en entreprise.</p>

      <h3>Programme détaillé</h3>
      <ul>
        <li><strong>Grilles salariales 2026 :</strong> minima conventionnels par catégorie (navigant pont, navigant machine, navigant service), primes et indemnités</li>
        <li><strong>Temps de travail et repos :</strong> durées maximales, repos compensateur, dérogations saisonnières, compteurs d'heures</li>
        <li><strong>Régime ENIM :</strong> cotisations, prestations, retraite, invalidité, spécificités du régime des marins</li>
        <li><strong>Accords de branche récents :</strong> prévoyance complémentaire, formation professionnelle, égalité professionnelle</li>
        <li><strong>Classifications :</strong> système de classification des emplois, passerelles entre catégories, VAE maritime</li>
        <li><strong>Cas pratiques :</strong> calcul de bulletins de paie, gestion des congés, procédures disciplinaires spécifiques</li>
      </ul>

      <h3>Intervenants</h3>
      <p>Juristes spécialisés en droit maritime social, représentants du GASPE, experts ENIM.</p>

      <h3>Financement</h3>
      <p>Gratuit pour les adhérents du GASPE. Séminaire annuel organisé au siège parisien.</p>
    `,
    organizer: "GASPE",
    startDate: "2026-05-19",
    endDate: "2026-05-19",
    location: "Paris – Siège GASPE",
    duration: "1 jour (7h)",
    capacity: 50,
    enrolled: 31,
    targetAudience: "DRH, responsables paie, dirigeants adhérents",
    prerequisites: "Aucun",
    price: "Gratuit pour les adhérents GASPE",
    contactEmail: "contact@gaspe.fr",
    status: "open",
    category: "réglementaire",
  },
];

export const publishedFormations = formations.filter((f) => f.status !== "closed");
