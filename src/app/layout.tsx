import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TournamentProvider } from "@/context/TournamentContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/JsonLd";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://fifa-world-cup-2026.vercel.app/"),
  title: {
    default: "FIFA World Cup 2026 - Fixture Interactivo y Simulador",
    template: "%s | FIFA World Cup 2026",
  },
  description:
    "Simula los resultados del Mundial 2026 con este fixture interactivo. Predice los partidos, calcula la tabla de posiciones y visualiza el cuadro de la fase final.",
  keywords: [
    "Mundial 2026",
    "FIFA World Cup 2026",
    "Fixture",
    "Simulador",
    "Calculadora",
    "Fútbol",
    "Predicciones",
    "Copa del Mundo",
    "México",
    "Estados Unidos",
    "Canadá",
  ],
  authors: [{ name: "José" }],
  creator: "José",
  publisher: "José",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "FIFA World Cup 2026 - Fixture Interactivo",
    description:
      "Simula todos los partidos del Mundial 2026. Predice resultados y mira quién será el campeón.",
    url: "https://fifa-world-cup-2026.vercel.app/",
    siteName: "FIFA World Cup 2026 Simulator",
    locale: "es_ES",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "FIFA World Cup 2026 Fixture Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FIFA World Cup 2026 - Fixture Interactivo",
    description:
      "Simula el camino al título del Mundial 2026. Haz tus predicciones ahora.",
    images: ["/og-image.png"],
    creator: "@jose",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${inter.className} bg-slate-50 dark:bg-slate-900 min-h-screen flex flex-col text-slate-900 dark:text-slate-100`}
      >
        <TournamentProvider>
          <LanguageProvider>
            <Header />
            <main id="main" className="flex-1 pb-36">
              {children}
            </main>
            <Footer />
          </LanguageProvider>
        </TournamentProvider>
        <Analytics />
        <JsonLd />
      </body>
    </html>
  );
}
