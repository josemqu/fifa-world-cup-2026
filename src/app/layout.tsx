import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TournamentProvider } from "@/context/TournamentContext";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { UserProfileModal } from "@/components/auth/UserProfileModal";
import { JsonLd } from "@/components/JsonLd";
import { Analytics } from "@vercel/analytics/next";
import { GoogleOneTap } from "@/components/auth/GoogleOneTap";
import { LiveScoreSync } from "@/components/LiveScoreSync";
import { LiveSimulationPanel } from "@/components/LiveSimulationPanel";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://fifa-world-cup-2026.vercel.app/"),
  alternates: {
    canonical: "/",
  },
  title: {
    default: "Mundial de Selecciones 2026 - Fixture Interactivo y Simulador",
    template: "%s | Mundial de Selecciones 2026",
  },
  description:
    "Simula los resultados del Mundial 2026 con este fixture interactivo. Predice los partidos, calcula la tabla de posiciones y visualiza el cuadro de la fase final.",
  keywords: [
    "Mundial 2026",
    "Mundial de Selecciones 2026",
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
    title: "Mundial de Selecciones 2026 - Fixture Interactivo",
    description:
      "Simula todos los partidos del Mundial 2026. Predice resultados y mira quién será el campeón.",
    url: "https://fifa-world-cup-2026.vercel.app/",
    siteName: "Mundial de Selecciones 2026",
    locale: "es_ES",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Mundial de Selecciones 2026 Fixture Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mundial de Selecciones 2026 - Fixture Interactivo",
    description:
      "Simula el camino al título del Mundial 2026. Haz tus predicciones ahora.",
    images: ["/opengraph-image"],
    creator: "@jose",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
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
        className={`${inter.className} bg-slate-50 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-slate-50 to-slate-100 dark:bg-slate-900 dark:bg-none min-h-screen flex flex-col text-slate-900 dark:text-slate-100`}
        suppressHydrationWarning
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <AuthProvider>
            <TournamentProvider>
              <LanguageProvider>
                <Header />
                <main id="main" className="flex-1 pb-20 md:pb-12">
                  {children}
                </main>
                <Footer />
                <UserProfileModal />
                <GoogleOneTap />
                <LiveScoreSync />
                <LiveSimulationPanel />
              </LanguageProvider>
            </TournamentProvider>
          </AuthProvider>
          <Analytics />
          <JsonLd />
        </ThemeProvider>
      </body>
    </html>
  );
}
