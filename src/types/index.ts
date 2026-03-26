export interface Member {
  name: string;
  slug: string;
  city: string;
  latitude: number;
  longitude: number;
  region: string;
  territory: "metropole" | "dom-tom";
  category: "titulaire" | "associe";
  description?: string;
  logoUrl?: string;
  websiteUrl?: string;
  employeeCount?: number;
  shipCount?: number;
}

export interface NavItem {
  label: string;
  href: string;
  highlight?: boolean;
  children?: NavItem[];
}

export interface StatItem {
  value: number;
  label: string;
  suffix?: string;
}
