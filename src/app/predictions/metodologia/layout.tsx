import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Metodología de Predicción",
  description:
    "Conocé el funcionamiento matemático y estadístico de nuestro simulador del Mundial 2026. Distribución de Poisson, fuerza relativa Elo y simulación de Montecarlo explicada paso a paso.",
  alternates: {
    canonical: "/predictions/metodologia",
  },
  openGraph: {
    title: "Metodología de Predicción | Mundial de Selecciones 2026",
    description:
      "Conocé el funcionamiento matemático y estadístico de nuestro simulador del Mundial 2026. Distribución de Poisson, fuerza relativa Elo y simulación de Montecarlo explicada paso a paso.",
    url: "https://fifa-world-cup-2026.vercel.app/predictions/metodologia",
    siteName: "Mundial de Selecciones 2026",
    locale: "es_ES",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Mundial de Selecciones 2026 Predictions Methodology Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Metodología de Predicción | Mundial de Selecciones 2026",
    description:
      "Conocé el funcionamiento matemático y estadístico de nuestro simulador del Mundial 2026.",
    images: ["/opengraph-image"],
  },
};

export default function MethodologyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
