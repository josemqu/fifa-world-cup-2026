import type { Metadata } from "next";
import "katex/dist/katex.min.css";

export const metadata: Metadata = {
  title: "Predicciones",
  description:
    "Utilizá nuestra simulación de Montecarlo para predecir las probabilidades de cada equipo de ganar el Mundial 2026 y explorá la matriz de posibles cruces.",
  alternates: {
    canonical: "/predictions",
  },
  openGraph: {
    title: "Predicciones de Montecarlo | Mundial de Selecciones 2026",
    description:
      "Utilizá nuestra simulación de Montecarlo para predecir las probabilidades de cada equipo de ganar el Mundial 2026 y explorá la matriz de posibles cruces.",
    url: "https://fifa-world-cup-2026.vercel.app/predictions",
    siteName: "Mundial de Selecciones 2026",
    locale: "es_ES",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Mundial de Selecciones 2026 Predictions Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Predicciones de Montecarlo | Mundial de Selecciones 2026",
    description:
      "Utilizá nuestra simulación de Montecarlo para predecir las probabilidades de cada equipo de ganar el Mundial 2026.",
    images: ["/opengraph-image"],
  },
};

export default function PredictionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
