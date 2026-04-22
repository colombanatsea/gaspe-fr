/**
 * BrandLogo – logo marque, swap-ready pour le rebrand ACF (nov. 2026).
 *
 * Par défaut, affiche le logo GASPE (marque actuelle). Quand la marque
 * bascule en ACF, il suffit de :
 *  1. Définir la variable d'env `NEXT_PUBLIC_BRAND=acf`, ou
 *  2. Passer `variant="acf"` en prop, ou
 *  3. Changer la constante `DEFAULT_BRAND` ci-dessous.
 *
 * Les assets sont dans `public/assets/brand/` :
 *  - `logo-gaspe.png` – wordmark GASPE (PNG transparent)
 *  - `logo-acf.png` – logo ACF full (avec horizon teal→cyan)
 *  - `logo-acf-contour.svg` – logo ACF contour, horizontal wide
 *  - `logo-gaspe-monogramme.jpg` – monogramme "A" (continuité visuelle,
 *    utilisable en favicon / avatar pendant la transition).
 */

import Image from "next/image";

type BrandVariant = "gaspe" | "acf";

const DEFAULT_BRAND: BrandVariant =
  (process.env.NEXT_PUBLIC_BRAND as BrandVariant) === "acf" ? "acf" : "gaspe";

const BRAND_ASSETS: Record<
  BrandVariant,
  { src: string; alt: string; aspect: number }
> = {
  gaspe: {
    src: "/assets/brand/logo-gaspe.png",
    alt: "GASPE – Groupement des Armateurs de Services Publics Maritimes de Passages d'Eau",
    aspect: 860 / 293, // ~2.93:1
  },
  acf: {
    src: "/assets/brand/logo-acf-contour.svg",
    alt: "ACF – Armateurs Côtiers Français",
    aspect: 3.2, // approx wordmark ratio
  },
};

interface BrandLogoProps {
  /** Forcer la variante (outrepasse NEXT_PUBLIC_BRAND) */
  variant?: BrandVariant;
  /** Hauteur en pixels (la largeur est calculée à partir de l'aspect ratio du wordmark) */
  height?: number;
  className?: string;
  /** Priorité de chargement (pour le logo du header notamment) */
  priority?: boolean;
}

export function BrandLogo({
  variant = DEFAULT_BRAND,
  height = 32,
  className,
  priority = false,
}: BrandLogoProps) {
  const asset = BRAND_ASSETS[variant];
  const width = Math.round(height * asset.aspect);
  return (
    <Image
      src={asset.src}
      alt={asset.alt}
      width={width}
      height={height}
      priority={priority}
      unoptimized
      className={`block ${className ?? ""}`}
    />
  );
}

/**
 * Monogramme "A" – continuité visuelle pendant la transition GASPE → ACF.
 * Convient pour favicons, avatars, badges, icônes d'app.
 */
export function BrandMonogram({
  size = 32,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src="/assets/brand/logo-gaspe-monogramme.jpg"
      alt="GASPE / ACF – monogramme"
      width={size}
      height={size}
      unoptimized
      className={`rounded-md object-contain ${className ?? ""}`}
    />
  );
}
