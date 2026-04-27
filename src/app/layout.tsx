import type { Metadata, Viewport } from "next";
import { SITE_NAME, SITE_FULL_NAME, SITE_DESCRIPTION, SITE_URL, SITE_KEYWORDS } from "@/lib/constants";
import { OrganizationJsonLd, WebSiteJsonLd } from "@/components/shared/SEOJsonLd";
import { Providers } from "@/components/shared/Providers";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5, // Permet le zoom mobile pour accessibilité
  themeColor: "#1B7E8A",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} – ${SITE_FULL_NAME}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  applicationName: SITE_NAME,
  category: "transport maritime",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: SITE_NAME,
    title: `${SITE_NAME} – ${SITE_FULL_NAME}`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} – ${SITE_FULL_NAME}`,
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} – ${SITE_FULL_NAME}`,
    description: SITE_DESCRIPTION,
    images: [`${SITE_URL}/og-image.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large", "max-video-preview": -1 },
  },
  alternates: {
    canonical: SITE_URL,
    types: {
      "application/rss+xml": [{ title: `${SITE_NAME} – Positions & actualités`, url: `${SITE_URL}/feed.xml` }],
    },
  },
  verification: {
    // Codes optionnels fournis par Google Search Console / Bing Webmaster Tools.
    // Déclarés via variables d'environnement pour éviter de les committer en dur.
    ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION && {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    }),
    ...(process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION && {
      other: { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION },
    }),
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/logo-gaspe.jpg" type="image/jpeg" />
        <link rel="apple-touch-icon" href="/logo-gaspe.jpg" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://server.arcgisonline.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* RSS auto-discovery – global pour toutes les pages publiques */}
        <link
          rel="alternate"
          type="application/rss+xml"
          title={`${SITE_NAME} – Positions & actualités`}
          href={`${SITE_URL}/feed.xml`}
        />
        {/* Google Fonts optimisées : 7 poids au lieu de 11 précédemment (≈-30% payload) */}
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Exo+2:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-xl focus:bg-[var(--gaspe-teal-600)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          Aller au contenu principal
        </a>
        <OrganizationJsonLd />
        <WebSiteJsonLd />
        <Providers>{children}</Providers>
        {/* Service Worker registration */}
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js').catch(() => {});
            });
          }
        ` }} />
      </body>
    </html>
  );
}
