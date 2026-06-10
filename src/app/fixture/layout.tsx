import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fixture Interactivo y Simulador",
  description:
    "Simula la Fase de Grupos y la Fase Final del Mundial 2026. Completá los resultados de todos los partidos y calculá las tablas de posiciones dinámicamente con las reglas oficiales de desempate.",
  alternates: {
    canonical: "/fixture",
  },
  openGraph: {
    title: "Fixture Interactivo y Simulador | Mundial de Selecciones 2026",
    description:
      "Simula la Fase de Grupos y la Fase Final del Mundial 2026. Completá los resultados de todos los partidos y calculá las tablas de posiciones dinámicamente.",
    url: "https://fifa-world-cup-2026.vercel.app/fixture",
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
    title: "Fixture Interactivo y Simulador | Mundial de Selecciones 2026",
    description:
      "Simula la Fase de Grupos y la Fase Final del Mundial 2026. Completá los resultados de todos los partidos y calculá las tablas de posiciones.",
    images: ["/opengraph-image"],
  },
};

export default function FixtureLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
