import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Prode del Mundial 2026 - Pronósticos y Ligas",
  description:
    "Predecí los resultados de todos los partidos del Mundial 2026, creá grupos privados con amigos, sumá puntos por marcador exacto y competí en la tabla de posiciones global.",
  alternates: {
    canonical: "/prode",
  },
  openGraph: {
    title: "Prode del Mundial 2026 - Pronósticos y Ligas | Mundial de Selecciones 2026",
    description:
      "Predecí los resultados de todos los partidos del Mundial 2026, creá grupos privados con amigos, sumá puntos por marcador exacto y competí en la tabla de posiciones global.",
    url: "https://fifa-world-cup-2026.vercel.app/prode",
    siteName: "Mundial de Selecciones 2026",
    locale: "es_ES",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Mundial de Selecciones 2026 Prode Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Prode del Mundial 2026 - Pronósticos y Ligas | Mundial de Selecciones 2026",
    description:
      "Predecí los resultados de todos los partidos del Mundial 2026, creá grupos privados con amigos y competí en la tabla de posiciones global.",
    images: ["/opengraph-image"],
  },
};

export default function ProdeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
