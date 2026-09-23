import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Noto_Sans_Bengali } from "next/font/google";

import Footer from "@/components/Footer";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import BookingProvider from "@/components/BookingProvider";
import MotionProvider from "@/components/MotionProvider";
import Navbar from "@/components/Navbar";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Bengali support (DESIGN.md §6, §59). Latin glyphs still come from Inter.
const notoSansBengali = Noto_Sans_Bengali({
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-bengali",
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// Home metadata is taken verbatim from docs/SEO.md §4 so no wording about the
// business is invented (SEO.md §1 — truthful information only).
const homeTitle = "Game Parlour — Premium Gaming Experience";
const homeDescription =
  "Play console games at our physical gaming parlour. Check games, pricing, availability and book your gaming session.";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: homeTitle,
    template: "%s — Game Parlour",
  },
  description: homeDescription,
  keywords: [
    "Game Parlour",
    "PlayStation Parlour",
    "Gaming Zone",
    "PS5 gaming",
    "console gaming",
    "gaming lounge",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: appUrl,
    siteName: "Game Parlour",
    title: homeTitle,
    description: homeDescription,
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: homeTitle,
    description: homeDescription,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0A0B0F",
  colorScheme: "dark",
};

const websiteStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Game Parlour",
  url: appUrl,
};

// Local SEO structured data (docs/SEO.md §5) — only truthful facts:
// the Owner-provided address and phone; no invented hours or ratings.
const localBusinessStructuredData = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Game Parlour",
  url: appUrl,
  telephone: "+916294667229",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Modan Mohanpara, Tomdar Dokan, Ward No. 3",
    addressLocality: "Dinhata",
    addressRegion: "West Bengal",
    addressCountry: "IN",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${notoSansBengali.variable} ${jetBrainsMono.variable}`}
    >
      <body className="min-h-screen bg-bg-base font-sans text-text-primary antialiased">
        <a href="#main-content" className="gp-skip-link">
          Skip to main content
        </a>

        <MotionProvider>
          <BookingProvider>
            <Navbar />

            <main id="main-content">{children}</main>

            <Footer />

            {/* Floating WhatsApp: z-30 sits below the navbar (z-50) and the
                booking modal layer (z-70), so it can never block them. */}
            <FloatingWhatsApp />
          </BookingProvider>
        </MotionProvider>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteStructuredData) }}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessStructuredData) }}
        />

        {/* Reduced-motion anchor scrolling is handled purely in CSS
            (app/globals.css: scroll-behavior: auto under
            prefers-reduced-motion), so no extra script is shipped —
            DESIGN.md §47, §57. */}
      </body>
    </html>
  );
}
